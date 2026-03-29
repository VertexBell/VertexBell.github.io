(function() {
  'use strict';

  var isMobile = /Android|iPhone|iPad|iPod|Touch/i.test(navigator.userAgent) || ('ontouchstart' in window);

  // Key codes used by DOSBox/DOOM
  var KEY = {
    LEFT:    37,
    RIGHT:   39,
    UP:      38,
    DOWN:    40,
    CTRL:    17,
    ALT:     18,
    ESC:     27,
    SPACE:   32,
    E:       69,
  };

  function fakeKey(keyCode, type) {
    var ev = new KeyboardEvent(type, {
      bubbles: true,
      cancelable: true,
      keyCode: keyCode,
      which: keyCode
    });
    Object.defineProperty(ev, 'keyCode', { value: keyCode });
    document.dispatchEvent(ev);
  }

  function pressKey(keyCode) {
    fakeKey(keyCode, 'keydown');
  }

  function releaseKey(keyCode) {
    fakeKey(keyCode, 'keyup');
  }

  function tapKey(keyCode) {
    pressKey(keyCode);
    setTimeout(function() { releaseKey(keyCode); }, 80);
  }

  // Remap W -> UP, S -> DOWN
  document.addEventListener('keydown', function(e) {
    if ((e.keyCode === 87 || e.keyCode === 83) && !e._remapped) {
      e.stopImmediatePropagation();
      e.preventDefault();
      var target = e.keyCode === 87 ? KEY.UP : KEY.DOWN;
      var ev = new KeyboardEvent('keydown', { bubbles: true, cancelable: true });
      Object.defineProperty(ev, 'keyCode', { value: target });
      Object.defineProperty(ev, 'which',   { value: target });
      ev._remapped = true;
      document.dispatchEvent(ev);
    }
  }, true);

  document.addEventListener('keyup', function(e) {
    if ((e.keyCode === 87 || e.keyCode === 83) && !e._remapped) {
      e.stopImmediatePropagation();
      e.preventDefault();
      var target = e.keyCode === 87 ? KEY.UP : KEY.DOWN;
      var ev = new KeyboardEvent('keyup', { bubbles: true, cancelable: true });
      Object.defineProperty(ev, 'keyCode', { value: target });
      Object.defineProperty(ev, 'which',   { value: target });
      ev._remapped = true;
      document.dispatchEvent(ev);
    }
  }, true);

  // Remap E -> ESC (interact/open door)
  document.addEventListener('keydown', function(e) {
    if (e.keyCode === KEY.E && !e._remapped) {
      e.stopImmediatePropagation();
      e.preventDefault();
      var ev = new KeyboardEvent('keydown', { bubbles: true, cancelable: true });
      Object.defineProperty(ev, 'keyCode', { value: KEY.ESC });
      Object.defineProperty(ev, 'which',   { value: KEY.ESC });
      ev._remapped = true;
      document.dispatchEvent(ev);
    }
  }, true);

  document.addEventListener('keyup', function(e) {
    if (e.keyCode === KEY.E && !e._remapped) {
      e.stopImmediatePropagation();
      e.preventDefault();
      var ev = new KeyboardEvent('keyup', { bubbles: true, cancelable: true });
      Object.defineProperty(ev, 'keyCode', { value: KEY.ESC });
      Object.defineProperty(ev, 'which',   { value: KEY.ESC });
      ev._remapped = true;
      document.dispatchEvent(ev);
    }
  }, true);

  // Left click -> CTRL (shoot)
  document.addEventListener('mousedown', function(e) {
    if (e.button === 0) pressKey(KEY.CTRL);
  });
  document.addEventListener('mouseup', function(e) {
    if (e.button === 0) releaseKey(KEY.CTRL);
  });

  // Mouse horizontal movement -> LEFT/RIGHT arrows
  var mouseThreshold = 4;
  var mouseTimeout = null;
  document.addEventListener('mousemove', function(e) {
    var dx = e.movementX || e.mozMovementX || 0;
    if (Math.abs(dx) < mouseThreshold) return;

    releaseKey(KEY.LEFT);
    releaseKey(KEY.RIGHT);
    if (mouseTimeout) clearTimeout(mouseTimeout);

    if (dx < 0) pressKey(KEY.LEFT);
    else         pressKey(KEY.RIGHT);

    mouseTimeout = setTimeout(function() {
      releaseKey(KEY.LEFT);
      releaseKey(KEY.RIGHT);
    }, 80);
  });

  if (!isMobile) return;

  // ─── MOBILE UI ────────────────────────────────────────────────────────────

  var css = `
    #dc-hud {
      position: fixed;
      inset: 0;
      z-index: 9999;
      pointer-events: none;
      font-family: monospace;
    }

    .dc-btn {
      position: absolute;
      pointer-events: all;
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: bold;
      color: rgba(255,255,255,0.85);
      background: rgba(0,0,0,0.45);
      border: 2px solid rgba(103,204,0,0.6);
      box-shadow: 0 0 12px rgba(103,204,0,0.25);
      transition: background 0.08s, box-shadow 0.08s;
    }

    .dc-btn.active {
      background: rgba(103,204,0,0.35);
      box-shadow: 0 0 20px rgba(103,204,0,0.6);
    }

    #dc-fire {
      width: 90px; height: 90px;
      right: 28px; bottom: 120px;
      font-size: 28px;
    }

    #dc-use {
      width: 68px; height: 68px;
      right: 130px; bottom: 130px;
      font-size: 18px;
      border-color: rgba(255,180,0,0.6);
    }

    #dc-up {
      width: 68px; height: 68px;
      left: 90px; bottom: 210px;
    }

    #dc-down {
      width: 68px; height: 68px;
      left: 90px; bottom: 120px;
    }

    #dc-look {
      position: absolute;
      left: 0; top: 0; right: 50%; bottom: 0;
      pointer-events: all;
      touch-action: none;
    }
  `;

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var hud = document.createElement('div');
  hud.id = 'dc-hud';
  hud.innerHTML = `
    <div id="dc-look"></div>
    <div class="dc-btn" id="dc-up">▲</div>
    <div class="dc-btn" id="dc-down">▼</div>
    <div class="dc-btn" id="dc-use">USE</div>
    <div class="dc-btn" id="dc-fire">🔫</div>
  `;
  document.body.appendChild(hud);

  function holdKey(el, keyCode) {
    el.addEventListener('touchstart', function(e) {
      e.preventDefault();
      el.classList.add('active');
      pressKey(keyCode);
    }, { passive: false });

    el.addEventListener('touchend', function(e) {
      e.preventDefault();
      el.classList.remove('active');
      releaseKey(keyCode);
    }, { passive: false });

    el.addEventListener('touchcancel', function(e) {
      el.classList.remove('active');
      releaseKey(keyCode);
    });
  }

  holdKey(document.getElementById('dc-up'),   KEY.UP);
  holdKey(document.getElementById('dc-down'), KEY.DOWN);
  holdKey(document.getElementById('dc-fire'), KEY.CTRL);

  var useBtn = document.getElementById('dc-use');
  useBtn.addEventListener('touchstart', function(e) {
    e.preventDefault();
    useBtn.classList.add('active');
    tapKey(KEY.ESC);
  }, { passive: false });
  useBtn.addEventListener('touchend', function(e) {
    e.preventDefault();
    useBtn.classList.remove('active');
  }, { passive: false });

  // Left side swipe -> turn camera
  var lookZone = document.getElementById('dc-look');
  var lookStartX = null;
  var lookLastX  = null;
  var lookInterval = null;

  lookZone.addEventListener('touchstart', function(e) {
    e.preventDefault();
    var t = e.touches[0];
    lookStartX = t.clientX;
    lookLastX  = t.clientX;
  }, { passive: false });

  lookZone.addEventListener('touchmove', function(e) {
    e.preventDefault();
    var t = e.touches[0];
    var dx = t.clientX - lookLastX;
    lookLastX = t.clientX;

    releaseKey(KEY.LEFT);
    releaseKey(KEY.RIGHT);
    if (Math.abs(dx) > 2) {
      if (dx < 0) pressKey(KEY.LEFT);
      else         pressKey(KEY.RIGHT);
    }
  }, { passive: false });

  lookZone.addEventListener('touchend', function(e) {
    e.preventDefault();
    releaseKey(KEY.LEFT);
    releaseKey(KEY.RIGHT);
    lookStartX = null;
  }, { passive: false });

})();