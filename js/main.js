(function () {
  'use strict';

  var KINA_DATE = new Date('2026-09-06T19:00:00+03:00');
  var DUGUN_DATE = new Date('2026-09-09T19:00:00+03:00');
  var KINA_THEME_DAYS = 7;
  var MUSIC_START = 58;
  var countdownCelebrated = false;
  var dugunCountdownCelebrated = false;
  var kinaMode = false;

  var INVITE_TEXT = {
    generic:
      'Sevgili dostlarımız, hayatımızın en güzel günlerine sizleri de davet ediyoruz. ' +
      'Kına gecemizde coşkumuzu, düğünümüzde ise birlikte güzel vakit geçirmek ' +
      'için sizi aramızda görmekten büyük mutluluk duyacağız.',
    personal:
      'hayatımızın en güzel günlerine sizi de davet ediyoruz. ' +
      'Kına gecemizde coşkumuzu, düğünümüzde ise birlikte güzel vakit geçirmek ' +
      'için sizi aramızda görmekten büyük mutluluk duyacağız.'
  };

  var intro = document.getElementById('intro');
  var invite = document.getElementById('invite');
  var musicBtn = document.getElementById('music-btn');
  var audio = document.getElementById('music-audio');
  var canvas = document.getElementById('particles');
  var ctx = canvas.getContext('2d');
  var isPlaying = false;
  var opened = false;
  var particles = [];
  var animating = false;
  var ambientMode = false;

  /* ---- Canvas boyutlandır ---- */
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  /* ---- Kişiye özel davet (?ad=Ahmet) ---- */
  function getGuestName() {
    var params = new URLSearchParams(window.location.search);
    var raw = params.get('ad') || params.get('isim') || params.get('name');
    if (!raw) return '';

    var name = decodeURIComponent(raw.replace(/\+/g, ' ')).trim();
    name = name.replace(/[<>"'`\\/]/g, '');
    if (!name || name.length > 48) return '';
    return name;
  }

  function initPersonalization() {
    var guest = getGuestName();
    if (!guest) return;

    var introText = document.getElementById('intro-guest-text');
    if (introText) {
      introText.classList.add('personal');
      introText.textContent = '';
      introText.appendChild(document.createTextNode('Sevgili '));
      var introName = document.createElement('span');
      introName.className = 'guest-name';
      introName.textContent = guest;
      introText.appendChild(introName);
      introText.appendChild(document.createTextNode(', sizi aramızda görmekten mutluluk duyarız'));
    }

    var inviteText = document.getElementById('invite-text');
    if (inviteText) {
      inviteText.textContent = '';
      inviteText.appendChild(document.createTextNode('Sevgili '));
      var inviteName = document.createElement('span');
      inviteName.className = 'guest-name';
      inviteName.textContent = guest;
      inviteText.appendChild(inviteName);
      inviteText.appendChild(document.createTextNode(', ' + INVITE_TEXT.personal));
    }
  }

  initPersonalization();

  /* ---- Parçacık sistemi ---- */
  var COLORS = ['#C9A84C', '#c99595', '#722F37', '#E8D5A3', '#8fbc8f', '#d4af37'];
  var GOLD_COLORS = ['#C9A84C', '#E8D5A3', '#d4af37', '#f0dfa0'];

  function createParticle(x, y, burst, forceGold) {
    var types = kinaMode
      ? ['confetti', 'heart', 'leaf', 'gold', 'gold']
      : ['confetti', 'heart', 'leaf'];
    var type = forceGold ? 'gold' : types[Math.floor(Math.random() * types.length)];
    var isGold = type === 'gold';
    return {
      x: x,
      y: y,
      type: type,
      vx: (Math.random() - 0.5) * (burst ? 14 : (isGold ? 1.2 : 2)),
      vy: burst ? -(Math.random() * 12 + 4) : (isGold ? Math.random() * 0.8 + 0.2 : Math.random() * 1.5 + 0.5),
      size: isGold ? Math.random() * 2.5 + 1 : Math.random() * 8 + 6,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * (isGold ? 2 : 8),
      color: isGold
        ? GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)]
        : COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: 1,
      life: burst ? 1 : Math.random(),
      decay: isGold ? 0.003 + Math.random() * 0.004 : (burst ? 0.008 + Math.random() * 0.008 : 0.001 + Math.random() * 0.002),
      gravity: burst ? 0.18 : (isGold ? 0.004 : 0.02),
      wobble: Math.random() * Math.PI * 2,
      twinkle: Math.random() * Math.PI * 2,
    };
  }

  function burstParticles(count) {
    var cx = window.innerWidth / 2;
    var cy = window.innerHeight / 2;
    for (var i = 0; i < count; i++) {
      particles.push(createParticle(cx, cy, true));
    }
    if (!animating) {
      animating = true;
      requestAnimationFrame(tick);
    }
  }

  function startAmbient() {
    ambientMode = true;
    canvas.classList.add('ambient');
    if (!animating) {
      animating = true;
      requestAnimationFrame(tick);
    }
  }

  function drawHeart(x, y, size, color, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.fillStyle = color;
    ctx.beginPath();
    var s = size * 0.4;
    ctx.moveTo(0, s * 0.3);
    ctx.bezierCurveTo(0, 0, -s, 0, -s, s * 0.3);
    ctx.bezierCurveTo(-s, s * 0.7, 0, s, 0, s * 1.2);
    ctx.bezierCurveTo(0, s, s, s * 0.7, s, s * 0.3);
    ctx.bezierCurveTo(s, 0, 0, 0, 0, s * 0.3);
    ctx.fill();
    ctx.restore();
  }

  function drawLeaf(x, y, size, color, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.25, size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.5);
    ctx.lineTo(0, size * 0.5);
    ctx.stroke();
    ctx.restore();
  }

  function drawConfetti(x, y, size, color, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.fillStyle = color;
    ctx.fillRect(-size * 0.3, -size * 0.15, size * 0.6, size * 0.3);
    ctx.restore();
  }

  function drawGold(x, y, size, color, opacity, twinkle) {
    var glow = size * (2 + Math.sin(twinkle) * 0.5);
    ctx.save();
    ctx.globalAlpha = opacity * 0.25;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, glow, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = opacity;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var ambientLimit = kinaMode ? 55 : 35;
    var spawnRate = kinaMode ? 0.16 : 0.08;

    if (ambientMode && particles.length < ambientLimit && Math.random() < spawnRate) {
      particles.push(createParticle(Math.random() * canvas.width, -20, false, kinaMode && Math.random() < 0.45));
    }

    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.wobble += 0.04;
      if (p.twinkle !== undefined) p.twinkle += 0.08;
      p.x += p.vx + Math.sin(p.wobble) * (p.type === 'gold' ? 0.15 : 0.3);
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.rotSpeed;
      p.life -= p.decay;
      p.opacity = Math.max(0, p.life);

      if (p.opacity <= 0 || p.y > canvas.height + 40) {
        particles.splice(i, 1);
        continue;
      }

      ctx.globalAlpha = p.opacity;

      if (p.type === 'gold') drawGold(p.x, p.y, p.size, p.color, p.opacity, p.twinkle);
      else if (p.type === 'heart') drawHeart(p.x, p.y, p.size, p.color, p.rotation);
      else if (p.type === 'leaf') drawLeaf(p.x, p.y, p.size, p.color, p.rotation);
      else drawConfetti(p.x, p.y, p.size, p.color, p.rotation);
    }

    ctx.globalAlpha = 1;

    if (particles.length > 0 || ambientMode) {
      requestAnimationFrame(tick);
    } else {
      animating = false;
    }
  }

  /* ---- Kına teması ---- */
  function getDaysUntilKina() {
    return Math.ceil((KINA_DATE - Date.now()) / 86400000);
  }

  function applyKinaTheme() {
    var days = getDaysUntilKina();
    kinaMode = days <= KINA_THEME_DAYS && days >= 0;
    if (kinaMode) {
      document.body.classList.add('kina-mode');
    }
  }

  applyKinaTheme();

  /* ---- Davetiyeyi aç ---- */
  function openInvite() {
    if (opened) return;
    opened = true;

    intro.classList.add('opening');
    burstParticles(120);

    setTimeout(function () {
      burstParticles(60);
    }, 200);

    setTimeout(function () {
      intro.classList.add('hide');
      invite.classList.add('show');
      invite.setAttribute('aria-hidden', 'false');
      musicBtn.hidden = false;
      startAmbient();
      startCountdown();
      startDugunCountdown();
      initFilmstrip();
      startMusic();
    }, 650);

    setTimeout(function () {
      intro.remove();
    }, 1650);
  }

  intro.addEventListener('click', openInvite);
  intro.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') openInvite();
  });
  intro.setAttribute('tabindex', '0');
  intro.setAttribute('role', 'button');

  /* ---- Geri sayım ---- */
  function showCountdownCelebration(options) {
    var block = document.getElementById(options.blockId);
    var title = document.getElementById(options.titleId);
    var timer = document.getElementById(options.timerId);
    var celebrate = document.getElementById(options.celebrateId);

    if (title) title.textContent = options.todayTitle;
    if (timer) timer.hidden = true;
    if (celebrate) celebrate.hidden = false;
    if (block) block.classList.add('is-today');

    if (options.burst) {
      burstParticles(160);
      setTimeout(function () { burstParticles(80); }, 350);
    }

    if (!animating) {
      animating = true;
      requestAnimationFrame(tick);
    }
  }

  function updateCountdownDisplay(diff, els) {
    els.days.textContent = Math.floor(diff / 86400000);
    els.hours.textContent = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0');
    els.mins.textContent = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    els.secs.textContent = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
  }

  function startCountdown() {
    var els = {
      days: document.getElementById('cd-days'),
      hours: document.getElementById('cd-hours'),
      mins: document.getElementById('cd-mins'),
      secs: document.getElementById('cd-secs')
    };
    if (!els.days) return;

    applyKinaTheme();

    function tickCd() {
      var diff = KINA_DATE - Date.now();
      if (diff <= 0) {
        if (!countdownCelebrated) {
          showCountdownCelebration({
            blockId: 'countdown-block',
            titleId: 'countdown-title',
            timerId: 'countdown-timer',
            celebrateId: 'countdown-celebrate',
            todayTitle: 'Kına Gecesi Bugün',
            burst: true
          });
          countdownCelebrated = true;
        }
        return;
      }

      updateCountdownDisplay(diff, els);
    }

    tickCd();
    setInterval(tickCd, 1000);
  }

  function startDugunCountdown() {
    var els = {
      days: document.getElementById('cd-dugun-days'),
      hours: document.getElementById('cd-dugun-hours'),
      mins: document.getElementById('cd-dugun-mins'),
      secs: document.getElementById('cd-dugun-secs')
    };
    if (!els.days) return;

    function tickCd() {
      var diff = DUGUN_DATE - Date.now();
      if (diff <= 0) {
        if (!dugunCountdownCelebrated) {
          showCountdownCelebration({
            blockId: 'countdown-dugun-block',
            titleId: 'countdown-dugun-title',
            timerId: 'countdown-dugun-timer',
            celebrateId: 'countdown-dugun-celebrate',
            todayTitle: 'Düğün Bugün',
            burst: false
          });
          dugunCountdownCelebrated = true;
        }
        return;
      }

      updateCountdownDisplay(diff, els);
    }

    tickCd();
    setInterval(tickCd, 1000);
  }

  /* ---- Film şeridi ---- */
  function initFilmstrip() {
    var scroll = document.getElementById('filmstrip-scroll');
    var track = document.getElementById('filmstrip-track');
    if (!scroll || !track) return;
    var clone = track.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    scroll.appendChild(clone);
  }

  window.addFilmPhoto = function (src, alt) {
    var track = document.getElementById('filmstrip-track');
    if (!track) return;
    var cell = document.createElement('div');
    cell.className = 'film-cell';
    cell.innerHTML = '<img src="' + src + '" alt="' + (alt || '') + '" loading="lazy">';
    track.appendChild(cell);
  };

  /* ---- Müzik ---- */
  if (audio) {
    audio.addEventListener('ended', function () {
      audio.currentTime = MUSIC_START;
      audio.play();
    });
  }

  function startMusic() {
    if (!audio) return;
    audio.volume = 0.7;
    audio.currentTime = MUSIC_START;
    var playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(function () {
        isPlaying = true;
        musicBtn.classList.add('playing');
      }).catch(function () {
        isPlaying = false;
      });
    }
  }

  musicBtn.addEventListener('click', function () {
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
      musicBtn.classList.remove('playing');
    } else {
      audio.play();
      isPlaying = true;
      musicBtn.classList.add('playing');
    }
  });

})();
