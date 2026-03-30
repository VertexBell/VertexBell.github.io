(function () {
  'use strict';

  const isMobile =
    /Android|iPhone|iPad|iPod|Touch/i.test(navigator.userAgent) ||
    'ontouchstart' in window;

  const KEY = {
    LEFT: 37,
    RIGHT: 39,
    UP: 38,
    DOWN: 40,
    CTRL: 17,
    ESC: 27,
    E: 69
  };

  function fakeKey(code, type) {
    const e = new Event(type, { bubbles: true, cancelable: true });
    e.keyCode = code;
    e.which = code;
    document.dispatchEvent(e);
  }

  const keyState = {};

  function press(code) {
    if (keyState[code]) return;
    keyState[code] = true;
    fakeKey(code, 'keydown');
  }

  function release(code) {
    if (!keyState[code]) return;
    keyState[code] = false;
    fakeKey(code, 'keyup');
  }

  function tap(code) {
    press(code);
    setTimeout(() => release(code), 60);
  }

  // ─── KEY REMAP ─────────────────────────

  const remap = {
    87: KEY.UP,   // W
    83: KEY.DOWN, // S
    69: KEY.ESC   // E
  };

  document.addEventListener('keydown', e => {
    const k = remap[e.keyCode];
    if (!k) return;

    e.preventDefault();
    e.stopImmediatePropagation();
    press(k);
  }, true);

  document.addEventListener('keyup', e => {
    const k = remap[e.keyCode];
    if (!k) return;

    e.preventDefault();
    e.stopImmediatePropagation();
    release(k);
  }, true);

  // ─── MOUSE ────────────────────────────

  let mouseTimeout = null;

  document.addEventListener('mousedown', e => {
    if (e.button === 0) press(KEY.CTRL);
  });

  document.addEventListener('mouseup', e => {
    if (e.button === 0) release(KEY.CTRL);
  });

  document.addEventListener('mousemove', e => {
    const dx = e.movementX || 0;
    if (Math.abs(dx) < 3) return;

    if (dx < 0) {
      press(KEY.LEFT);
      release(KEY.RIGHT);
    } else {
      press(KEY.RIGHT);
      release(KEY.LEFT);
    }

    clearTimeout(mouseTimeout);
    mouseTimeout = setTimeout(() => {
      release(KEY.LEFT);
      release(KEY.RIGHT);
    }, 70);
  });

  if (!isMobile) return;

  // ─── MOBILE UI ────────────────────────

  const style = document.createElement('style');
  style.textContent = `
    #hud {position:fixed;inset:0;z-index:9999;pointer-events:none}
    .b{
      position:absolute;
      pointer-events:all;
      border-radius:50%;
      background:rgba(0,0,0,.4);
      border:2px solid rgba(103,204,0,.6);
      color:#fff;
      display:flex;
      align-items:center;
      justify-content:center;
      font:bold 18px monospace;
    }
    .a{background:rgba(103,204,0,.4)}
    #f{right:20px;bottom:100px;width:80px;height:80px}
    #u{right:110px;bottom:120px;width:60px;height:60px}
    #up{left:70px;bottom:180px;width:60px;height:60px}
    #dn{left:70px;bottom:110px;width:60px;height:60px}
    #look{position:absolute;left:0;top:0;right:50%;bottom:0;pointer-events:all}
  `;
  document.head.appendChild(style);

  const hud = document.createElement('div');
  hud.id = 'hud';
  hud.innerHTML = `
    <div id="look"></div>
    <div id="up" class="b">▲</div>
    <div id="dn" class="b">▼</div>
    <div id="u" class="b">USE</div>
    <div id="f" class="b">●</div>
  `;
  document.body.appendChild(hud);

  function hold(el, code) {
    el.addEventListener('touchstart', e => {
      e.preventDefault();
      el.classList.add('a');
      press(code);
    }, { passive:false });

    el.addEventListener('touchend', () => {
      el.classList.remove('a');
      release(code);
    });

    el.addEventListener('touchcancel', () => {
      el.classList.remove('a');
      release(code);
    });
  }

  hold(up, KEY.UP);
  hold(dn, KEY.DOWN);
  hold(f, KEY.CTRL);

  u.addEventListener('touchstart', e => {
    e.preventDefault();
    u.classList.add('a');
    tap(KEY.ESC);
  }, { passive:false });

  u.addEventListener('touchend', () => u.classList.remove('a'));

  // LOOK

  let lastX = null;

  look.addEventListener('touchstart', e => {
    lastX = e.touches[0].clientX;
  }, { passive:false });

  look.addEventListener('touchmove', e => {
    const x = e.touches[0].clientX;
    const dx = x - lastX;
    lastX = x;

    if (Math.abs(dx) < 2) return;

    if (dx < 0) {
      press(KEY.LEFT);
      release(KEY.RIGHT);
    } else {
      press(KEY.RIGHT);
      release(KEY.LEFT);
    }
  }, { passive:false });

  look.addEventListener('touchend', () => {
    release(KEY.LEFT);
    release(KEY.RIGHT);
    lastX = null;
  });

})();
