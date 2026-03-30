<canvas id="bg-canvas"></canvas>

<script>
(() => {
  const palette = ['#D6B200','#DBBA14','#FFDB2E','#C2A100'];

  const rand = (a,b=0)=> b===0?Math.random()*a : a+Math.random()*(b-a);
  const pick = arr => arr[(Math.random()*arr.length)|0];

  const isMobile = /Android|iPhone|iPad|iPod|Touch/i.test(navigator.userAgent) || 'ontouchstart' in window;

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let w,h,dpr = Math.max(1, window.devicePixelRatio||1);

  function resize(){
    w = innerWidth|0;
    h = innerHeight|0;
    canvas.width = w*dpr;
    canvas.height = h*dpr;
    canvas.style.width = w+'px';
    canvas.style.height = h+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  addEventListener('resize', resize, {passive:true});
  resize();

  const TOTAL = isMobile ? 6 : 11;

  class Shape{
    constructor(){
      this.reset(true);
    }

    reset(init){
      this.s = rand(40, 260);

      this.x = rand(-0.1*w,1.1*w);
      this.y = rand(-0.1*h,1.1*h);

      this.vx = rand(-0.03,0.03);
      this.vy = rand(-0.03,0.03);

      this.rot = rand(Math.PI*2);
      this.rotSpd = rand(-0.005,0.005);

      this.ttl = rand(20,40);
      this.age = init ? rand(0,this.ttl) : 0;

      this.scale = rand(0.9,1.1);
      this.alpha = rand(0.15,0.6);

      this.color = pick(palette);

      this.points = Math.random()<0.9
        ? [[0,-0.6],[0.5,0.4],[-0.5,0.4]]
        : this.poly();

      this.path = new Path2D();
      this.build();
    }

    poly(){
      const sides = 4 + (Math.random()*2|0);
      const pts = [];
      for(let i=0;i<sides;i++){
        const a = i/sides*Math.PI*2;
        const r = 0.7 + Math.random()*0.3;
        pts.push([Math.cos(a)*r, Math.sin(a)*r]);
      }
      return pts;
    }

    build(){
      const p = this.points;
      this.path.moveTo(p[0][0], p[0][1]);
      for(let i=1;i<p.length;i++) this.path.lineTo(p[i][0], p[i][1]);
      this.path.closePath();
    }

    update(dt){
      this.x += this.vx * dt*60;
      this.y += this.vy * dt*60;
      this.rot += this.rotSpd;

      this.age += dt;
      if(this.age >= this.ttl) this.reset();
    }

    draw(ctx){
      const cos = Math.cos(this.rot);
      const sin = Math.sin(this.rot);
      const s = this.s * this.scale;

      ctx.setTransform(
        cos*s, sin*s,
        -sin*s, cos*s,
        this.x, this.y
      );

      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      ctx.fill(this.path);
    }
  }

  const shapes = [];
  for(let i=0;i<TOTAL;i++) shapes.push(new Shape());

  let last = performance.now()/1000;

  function loop(t){
    const now = t/1000;
    const dt = Math.min(0.033, now-last);
    last = now;

    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,w,h);

    for(let i=0;i<shapes.length;i++){
      const s = shapes[i];
      s.update(dt);
      s.draw(ctx);
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);

  document.addEventListener('visibilitychange', ()=>{
    last = performance.now()/1000;
  });
})();
</script>
