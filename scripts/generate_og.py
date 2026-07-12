from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "og-image.jpg"
PHOTO = ROOT / "fotograflar" / "foto1.jpeg"

W, H = 1200, 630
BG = (243, 237, 230)
CARD = (255, 253, 250)
BURGUNDY = (114, 47, 55)
GOLD = (201, 168, 76)
GOLD_LIGHT = (232, 213, 163)
MUTED = (122, 101, 101)
SEAL = (143, 58, 68)


def load_fonts():
    try:
        return {
            "label": ImageFont.truetype("C:/Windows/Fonts/georgia.ttf", 34),
            "names": ImageFont.truetype("C:/Windows/Fonts/georgiai.ttf", 72),
            "amp": ImageFont.truetype("C:/Windows/Fonts/georgiai.ttf", 56),
            "sub": ImageFont.truetype("C:/Windows/Fonts/georgiai.ttf", 30),
            "event": ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 24),
            "date": ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 22),
            "seal": ImageFont.truetype("C:/Windows/Fonts/georgia.ttf", 24),
        }
    except OSError:
        default = ImageFont.load_default()
        return {k: default for k in ("label", "names", "amp", "sub", "event", "date", "seal")}


def text_width(draw, text, font):
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0]


def draw_corner_brackets(draw, box, color, size=24, width=2):
    x1, y1, x2, y2 = box
    for pts in [
        [(x1, y1 + size), (x1, y1), (x1 + size, y1)],
        [(x2 - size, y1), (x2, y1), (x2, y1 + size)],
        [(x1, y2 - size), (x1, y2), (x1 + size, y2)],
        [(x2 - size, y2), (x2, y2), (x2, y2 - size)],
    ]:
        draw.line(pts[:2], fill=color, width=width)
        draw.line(pts[1:], fill=color, width=width)


def draw_ornament(draw, cx, y, width, color):
    half = width // 2
    draw.line([(cx - half, y), (cx - 20, y)], fill=color, width=1)
    draw.line([(cx + 20, y), (cx + half, y)], fill=color, width=1)
    s = 9
    draw.polygon(
        [(cx, y - s), (cx + s, y), (cx, y + s), (cx - s, y)],
        outline=color,
        fill=CARD,
    )


def draw_wax_seal(draw, cx, cy, r, fonts):
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=SEAL, outline=GOLD, width=3)
    text = "T & F"
    bbox = draw.textbbox((0, 0), text, font=fonts["seal"])
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((cx - tw / 2, cy - th / 2 - 2), text, fill=GOLD_LIGHT, font=fonts["seal"])


def draw_names_stacked(draw, x, y, left, right, fonts):
    """İsimleri iki satırda çizer: üstte bir isim, altta & diğer isim."""
    names_font = fonts["names"]
    amp_font = fonts["amp"]

    draw.text((x, y), left, fill=BURGUNDY, font=names_font)
    line_gap = 78
    y2 = y + line_gap

    amp_w = text_width(draw, "&", amp_font)
    draw.text((x, y2 + 10), "&", fill=GOLD, font=amp_font)
    draw.text((x + amp_w + 14, y2), right, fill=BURGUNDY, font=names_font)

    return y2 + 82


def main():
    fonts = load_fonts()
    bg = Image.new("RGB", (W, H), BG)
    glow = Image.new("RGB", (W, H), BG)
    ImageDraw.Draw(glow).ellipse([80, 20, 1120, 610], fill=(252, 246, 238))
    bg = Image.blend(bg, glow.filter(ImageFilter.GaussianBlur(45)), 0.5)
    draw = ImageDraw.Draw(bg)

    card_w, card_h = 1040, 520
    card_x, card_y = (W - card_w) // 2, (H - card_h) // 2

    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        [card_x + 12, card_y + 18, card_x + card_w + 12, card_y + card_h + 18],
        radius=8,
        fill=(114, 47, 55, 60),
    )
    bg.paste(shadow.filter(ImageFilter.GaussianBlur(20)), (0, 0), shadow.filter(ImageFilter.GaussianBlur(20)))
    draw = ImageDraw.Draw(bg)

    draw.rounded_rectangle(
        [card_x, card_y, card_x + card_w, card_y + card_h],
        radius=6,
        fill=CARD,
        outline=GOLD,
        width=3,
    )
    inner = [card_x + 18, card_y + 18, card_x + card_w - 18, card_y + card_h - 18]
    draw.rectangle(inner, outline=GOLD_LIGHT, width=1)
    draw_corner_brackets(draw, inner, GOLD, size=28)

    # sol fotoğraf
    photo = Image.open(PHOTO).convert("RGB")
    pw, ph = photo.size
    photo = photo.crop((0, 0, pw, int(ph * 0.92)))
    photo_w, photo_h = 230, 290
    px = card_x + 70
    py = card_y + (card_h - photo_h) // 2 - 10
    draw.rectangle([px - 4, py - 4, px + photo_w + 8, py + photo_h + 8], fill=GOLD_LIGHT)
    bg.paste(photo.resize((photo_w, photo_h), Image.Resampling.LANCZOS), (px, py))
    draw = ImageDraw.Draw(bg)
    draw.rectangle([px, py, px + photo_w, py + photo_h], outline=(201, 168, 76), width=2)

    # sağ metin alanı
    tx = card_x + 360
    ty = card_y + 72

    label = "KINA & DÜĞÜN"
    draw.text((tx, ty), label, fill=BURGUNDY, font=fonts["label"])
    draw_ornament(draw, tx + 130, ty + 52, 260, GOLD)

    names_y = ty + 78
    names_bottom = draw_names_stacked(draw, tx, names_y, "Tamara", "Fatih Emir", fonts)

    sub = "Sizi kına ve düğünümüze"
    sub2 = "davet ediyoruz"
    draw.text((tx, names_bottom + 8), sub, fill=MUTED, font=fonts["sub"])
    draw.text((tx, names_bottom + 42), sub2, fill=MUTED, font=fonts["sub"])

    draw.line([(tx, names_bottom + 96), (tx + 300, names_bottom + 96)], fill=GOLD, width=2)
    draw.text((tx, names_bottom + 114), "6 Eylül · Kına Gecesi", fill=MUTED, font=fonts["event"])
    draw.text((tx, names_bottom + 148), "9 Eylül · Düğün", fill=MUTED, font=fonts["event"])
    draw.text((tx, names_bottom + 190), "Antalya · 2026", fill=GOLD, font=fonts["date"])

    draw_wax_seal(draw, card_x + card_w - 95, card_y + card_h - 72, 38, fonts)

    bg.save(OUT, "JPEG", quality=93, optimize=True)
    print(f"Created {OUT}")


if __name__ == "__main__":
    main()
