<canvas id="bg-canvas" style="position:fixed; inset:0; z-index:-1;"></canvas>

<script>
(() => {
  const palette = ['#D6B200','#DBBA14','#FFDB2E','#C2A100'];

  const rand = (a,b)=> a + Math.random()*(b-a);
  const pick = arr => arr[(Math.random()*arr.length)|0];

  const isMobile = /Android|iPhone|iPad|iPod|Touch/i.test(navigator.userAgent) || 'ontouchstart' in window;
  const TOTAL = isMobile ? 6 : 11;

  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');

  let w,h,dpr = Math.max(1, devicePixelRatio || 1);

  function resize(){
    w = innerWidth;
    h = innerHeight;
    canvas.width = w*dpr;
    canvas.height = h*dpr;
    canvas.style.width = w+'px';
    canvas.style.height = h+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  addEventListener('resize', resize);
  resize();

  class Shape{
    constructor(){
      this.reset(true);
    }

    reset(init){
      this.size = rand(60, 220);
      this.x = rand(-100, w+100);
      this.y = rand(-100, h+100);

      this.vx = rand(-0.02,0.02);
      this.vy = rand(-0.02,0.02);

      this.rot = rand(0, Math.PI*2);
      this.rotSpd = rand(-0.003,0.003);

      this.alpha = rand(0.15,0.5);
      this.color = pick(palette);

      this.points = Math.random()<0.9
        ? [[0,-1],[1,1],[-1,1]]
        : this.poly();
    }

    poly(){
      const pts = [];
      const sides = 4 + (Math.random()*2|0);
      for(let i=0;i<sides;i++){
        const a = i/sides*Math.PI*2;
        pts.push([Math.cos(a), Math.sin(a)]);
      }
      return pts;
    }

    update(dt){
      this.x += this.vx * dt*60;
      this.y += this.vy * dt*60;
      this.rot += this.rotSpd;
    }

    draw(ctx){
      ctx.save();

      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      ctx.scale(this.size, this.size);

      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;

      ctx.beginPath();
      const p = this.points;
      ctx.moveTo(p[0][0], p[0][1]);
      for(let i=1;i<p.length;i++) ctx.lineTo(p[i][0], p[i][1]);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  const shapes = Array.from({length: TOTAL}, () => new Shape());

  let last = performance.now()/1000;

  function loop(t){
    const now = t/1000;
    const dt = Math.min(0.033, now-last);
    last = now;

    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,w,h);

    for(const s of shapes){
      s.update(dt);
      s.draw(ctx);
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
</script>
