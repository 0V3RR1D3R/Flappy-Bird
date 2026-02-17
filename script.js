(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width; const H = canvas.height;

  // HiDPI scaling
  function fitCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  fitCanvas();

  // Game state
  let frames = 0;
  let pipes = [];
  let score = 0;
  let best = 0;
  let running = true;

  const bird = {
    x: 80, y: H/2, w: 34, h: 24, vy: 0,
    gravity: 0.6, jump: -10, maxVy: 12
  };

  const PIPE_W = 60; const GAP = 150; const PIPE_SPACING = 160; const SPEED = 2.5;

  function reset() {
    frames = 0; pipes = []; score = 0; running = true;
    bird.y = H/2; bird.vy = 0;
  }

  function spawnPipe() {
    const topH = 60 + Math.random()*(H - 220);
    pipes.push({x: W, top: topH, bottom: topH + GAP, passed: false});
  }

  function update() {
    if (!running) return;
    frames++;
    // Bird physics
    bird.vy = Math.min(bird.vy + bird.gravity, bird.maxVy);
    bird.y += bird.vy;

    // Spawn pipes
    if (frames % PIPE_SPACING === 0) spawnPipe();

    // Move pipes and check score
    for (let p of pipes) {
      p.x -= SPEED;
      if (!p.passed && p.x + PIPE_W < bird.x) { p.passed = true; score++; best = Math.max(best, score); }
    }
    // Remove offscreen
    pipes = pipes.filter(p => p.x + PIPE_W > -50);

    // Collisions
    // ground and ceiling
    if (bird.y + bird.h/2 >= H || bird.y - bird.h/2 <= 0) gameOver();
    // pipes
    for (let p of pipes) {
      const bx = bird.x - bird.w/2, by = bird.y - bird.h/2, bw = bird.w, bh = bird.h;
      // top pipe rect
      if (rectsOverlap(bx,by,bw,bh, p.x, 0, PIPE_W, p.top)) { gameOver(); }
      // bottom pipe
      if (rectsOverlap(bx,by,bw,bh, p.x, p.bottom, PIPE_W, H - p.bottom)) { gameOver(); }
    }
  }

  function rectsOverlap(x1,y1,w1,h1,x2,y2,w2,h2){
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }

  function draw() {
    // background
    ctx.clearRect(0,0,W,H);
    // sky gradient already via canvas background; draw pipes
    for (let p of pipes) {
      ctx.fillStyle = '#2aa02a';
      // top pipe
      ctx.fillRect(p.x, 0, PIPE_W, p.top);
      // bottom pipe
      ctx.fillRect(p.x, p.bottom, PIPE_W, H - p.bottom);
      // pipe caps
      ctx.fillStyle = '#1f7a1f';
      ctx.fillRect(p.x-6, p.top - 12, PIPE_W+12, 12);
      ctx.fillRect(p.x-6, p.bottom, PIPE_W+12, 12);
    }

    // Bird
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.fillStyle = '#ffdd57';
    ctx.beginPath();
    ctx.ellipse(0,0,bird.w/2,bird.h/2,0,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillRect(bird.w/4, -4, 6, 6);
    ctx.restore();

    // Score
    ctx.fillStyle = '#fff'; ctx.font = '28px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(score, W/2, 40);

    if (!running) drawGameOver();
  }

  function drawGameOver(){
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    const w = 260, h = 120; const x = (W - w)/2, y = (H - h)/2;
    roundRect(ctx, x, y, w, h, 8);
    ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Game Over', W/2, y + 36);
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score + '  Best: ' + best, W/2, y + 66);
    ctx.fillText('Click or press Space to restart', W/2, y + 96);
  }

  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); ctx.fill(); }

  function gameOver(){ running = false; }

  function loop(){ update(); draw(); requestAnimationFrame(loop); }

  // Input
  function flap(){ if (!running) { reset(); return; } bird.vy = bird.jump; }
  window.addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); flap(); } });
  canvas.addEventListener('click', () => { flap(); });
  canvas.addEventListener('touchstart', (e)=>{ e.preventDefault(); flap(); }, {passive:false});

  // Start
  reset(); loop();

})();
