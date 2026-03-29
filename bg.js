/* Animated geometric background for index.html
   - Mostly triangles, occasional polygons
   - Palette constrained to four colors with slight brightness variation
   - Three depth layers with different sizes/speeds
   - Smooth drifting and gentle rotation; shapes spawn/fade/scale
*/

(() => {
  const palette = ['#D6B200','#DBBA14','#FFDB2E','#C2A100'];

  // Helpers
  const rand = (a,b=0) => (b===0?Math.random()*a : a + Math.random()*(b-a));
  const pick = arr => arr[Math.floor(Math.random()*arr.length)];
  const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
  const varyColor = (hex, pct=0.1) => {
    // simple brightness tweak: convert to rgb, scale then reassemble
    const n = parseInt(hex.slice(1),16);
    let r = (n>>16)&255, g = (n>>8)&255, b = n&255;
    const f = 1 + (Math.random()*2-1)*pct;
    r = clamp(Math.round(r*f),0,255);
    g = clamp(Math.round(g*f),0,255);
    b = clamp(Math.round(b*f),0,255);
    return `rgb(${r},${g},${b})`;
  };

  // Canvas setup
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w=0,h=0,dpr = Math.max(1, window.devicePixelRatio || 1);

  function resize() {
    // ensure we ignore scrollbar: use innerWidth/innerHeight
    w = Math.max(1, Math.floor(window.innerWidth));
    h = Math.max(1, Math.floor(window.innerHeight));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w+'px';
    canvas.style.height = h+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  window.addEventListener('resize', resize, {passive:true});
  resize();

  // Layers config: background, midground, foreground
  const LAYERS = [
    {count: 8, size:[180,420], speed:0.12, alpha:0.22, blur:8},
    {count: 18, size:[70,160], speed:0.4, alpha:0.32, blur:3},
    {count: 36, size:[18,64], speed:1.0, alpha:0.9, blur:0}
  ];

  // Shape class
  class Shape {
    constructor(layerIdx){
      this.layer = LAYERS[layerIdx];
      this.reset(true);
    }

    reset(initial=false){
      const L = this.layer;
      this.type = (Math.random() < 0.9) ? 'triangle' : 'poly';
      this.s = rand(L.size[0], L.size[1]); // base size
      // position spawn off-canvas edges for natural drifting
      this.x = rand(-0.2*w, 1.2*w);
      this.y = rand(-0.2*h, 1.2*h);
      this.ttl = rand(8, 26) * (1 / (L.speed||1)); // life in seconds
      this.age = initial ? rand(0, this.ttl) : 0;
      this.rotation = rand(Math.PI*2);
      this.rotSpeed = rand(-0.25,0.25) * 0.2; // slow rotation
      this.vx = rand(-0.3,0.3) * (L.speed||1);
      this.vy = rand(-0.25,0.25) * (L.speed||1);
      // gentle noise offsets to avoid linear motion
      this.noiseOffset = {x: Math.random()*1000, y: Math.random()*1000};
      this.color = varyColor(pick(palette), 0.1);
      this.opacity = rand(0.6, 1) * L.alpha;
      this.points = this.makePoints();
      this.spawnScale = rand(0.7, 1.2);
      this.scale = this.spawnScale;
    }

    makePoints(){
      if (this.type === 'triangle') {
        return [{x:0,y:-0.6},{x:0.55,y:0.4},{x:-0.55,y:0.4}];
      }
      // polygon 4-6 sides
      const sides = Math.floor(rand(4,6.999));
      const pts = [];
      for (let i=0;i<sides;i++){
        const a = (i/sides)*Math.PI*2;
        const r = 0.7 + Math.random()*0.6;
        pts.push({x: Math.cos(a)*r, y: Math.sin(a)*r});
      }
      return pts;
    }

    update(dt, t){
      // smooth drifting via sin/cos (simple pseudo-noise)
      const n = Math.sin((t+this.noiseOffset.x)*0.15 + this.noiseOffset.y) * 0.3;
      this.x += (this.vx + n) * dt * 60 * (this.layer.speed||1) * 0.4;
      this.y += (this.vy + Math.cos((t+this.noiseOffset.y)*0.13)*0.25) * dt * 60 * (this.layer.speed||1) * 0.4;
      this.rotation += this.rotSpeed * dt;
      this.age += dt;
      // grow slightly then shrink near end
      const life = clamp(this.age / this.ttl, 0, 1);
      this.scale = this.spawnScale * (1 + 0.08*Math.sin(life*Math.PI));
      // fade in/out
      this.currentAlpha = this.opacity * (life < 0.12 ? (life/0.12) : (life > 0.88 ? (1 - (life-0.88)/0.12) : 1));
      // recycle when done
      if (this.age >= this.ttl) {
        this.reset();
      }
    }

    draw(ctx){
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      const size = this.s * this.scale;
      ctx.globalAlpha = clamp(this.currentAlpha,0,1);
      if (this.layer.blur) {
        ctx.shadowBlur = this.layer.blur;
        ctx.shadowColor = this.color;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fillStyle = this.color;

      ctx.beginPath();
      const pts = this.points;
      for (let i=0;i<pts.length;i++){
        const p = pts[i];
        const px = p.x * size;
        const py = p.y * size;
        if (i===0) ctx.moveTo(px,py);
        else ctx.lineTo(px,py);
      }
      ctx.closePath();
      // gentle gradient fill for subtle depth
      const g = ctx.createLinearGradient(-size, -size, size, size);
      const c1 = this.color, c2 = varyColor(this.color, 0.04);
      g.addColorStop(0, c1);
      g.addColorStop(1, c2);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();
    }
  }

  // Populate layers
  const layerShapes = LAYERS.map((L, idx) => {
    const arr = [];
    for (let i=0;i<L.count;i++) arr.push(new Shape(idx));
    return arr;
  });

  let last = performance.now()/1000;

  function step(nowMs){
    const now = nowMs/1000;
    const dt = Math.min(0.032, now - last);
    last = now;

    // clear
    ctx.clearRect(0,0,w,h);

    // draw each layer back-to-front (background first)
    for (let li=0; li<layerShapes.length; li++){
      const shapes = layerShapes[li];
      // subtle composite for background softer
      ctx.globalCompositeOperation = 'lighter';
      shapes.forEach(s => { s.update(dt, now); s.draw(ctx); });
      ctx.globalCompositeOperation = 'source-over';
    }

    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);

  // keep canvas in sync if page becomes hidden/visible
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      last = performance.now()/1000;
    }
  });
})();