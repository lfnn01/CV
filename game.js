(() => {
  const canvas = document.getElementById("frog-canvas");
  const scoreEl = document.getElementById("game-score");
  const resetBtn = document.getElementById("game-reset");
  const startBtn = document.getElementById("game-start");
  const gameStage = document.getElementById("game-stage");
  const gameShell = gameStage ? gameStage.closest(".game-shell") : null;
  if (!canvas || !scoreEl || !resetBtn || !startBtn || !gameShell) return;

  const ctx = canvas.getContext("2d");
  const world = { w: canvas.width, h: canvas.height };

  const frog = {
    x: world.w * 0.18,
    y: world.h - 62,
    r: 28,
  };

  const tongue = {
    active: false,
    retracting: false,
    tipX: frog.x + 8,
    tipY: frog.y - 6,
    vx: 0,
    vy: 0,
    maxLength: 300,
    speed: 15,
  };

  let aim = { x: world.w * 0.6, y: world.h * 0.4 };
  let butterflies = [];
  let spawnTimer = 0;
  let score = 0;
  let running = false;
  const isNightMode = () => document.body.classList.contains("night-mode");

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function makeButterfly() {
    return {
      x: world.w + rand(15, 70),
      y: rand(30, world.h - 120),
      size: rand(9, 14),
      vx: rand(1.4, 2.4),
      vy: rand(-0.25, 0.25),
      flap: rand(0, Math.PI * 2),
      bob: rand(0, Math.PI * 2),
    };
  }

  function resetTongue() {
    tongue.active = false;
    tongue.retracting = false;
    tongue.tipX = frog.x + 8;
    tongue.tipY = frog.y - 6;
    tongue.vx = 0;
    tongue.vy = 0;
  }

  function restartGame() {
    butterflies = [];
    spawnTimer = 0;
    score = 0;
    scoreEl.textContent = "Score: 0";
    resetTongue();
  }

  function launchTongue() {
    if (tongue.active) return;
    const sx = frog.x + 8;
    const sy = frog.y - 6;
    const dx = aim.x - sx;
    const dy = aim.y - sy;
    const d = Math.hypot(dx, dy) || 1;
    tongue.active = true;
    tongue.retracting = false;
    tongue.tipX = sx;
    tongue.tipY = sy;
    tongue.vx = (dx / d) * tongue.speed;
    tongue.vy = (dy / d) * tongue.speed;
  }

  function tongueLength() {
    return Math.hypot(tongue.tipX - (frog.x + 8), tongue.tipY - (frog.y - 6));
  }

  function updateTongue() {
    if (!tongue.active) return;

    const baseX = frog.x + 8;
    const baseY = frog.y - 6;

    if (!tongue.retracting) {
      tongue.tipX += tongue.vx;
      tongue.tipY += tongue.vy;
      if (
        tongue.tipX < 0 || tongue.tipX > world.w ||
        tongue.tipY < 0 || tongue.tipY > world.h ||
        tongueLength() >= tongue.maxLength
      ) {
        tongue.retracting = true;
      }
    } else {
      const dx = baseX - tongue.tipX;
      const dy = baseY - tongue.tipY;
      const d = Math.hypot(dx, dy) || 1;
      tongue.tipX += (dx / d) * (tongue.speed + 2);
      tongue.tipY += (dy / d) * (tongue.speed + 2);
      if (d < 10) resetTongue();
    }
  }

  function updateButterflies() {
    spawnTimer -= 1;
    if (spawnTimer <= 0) {
      butterflies.push(makeButterfly());
      spawnTimer = 30 + Math.floor(Math.random() * 30);
    }

    for (let i = butterflies.length - 1; i >= 0; i -= 1) {
      const b = butterflies[i];
      b.x -= b.vx;
      b.y += b.vy + Math.sin(b.bob) * 0.35;
      b.bob += 0.06;
      b.flap += 0.33;

      if (b.y < 18) b.y = 18;
      if (b.y > world.h - 88) b.y = world.h - 88;

      if (tongue.active) {
        const dx = b.x - tongue.tipX;
        const dy = b.y - tongue.tipY;
        const hit = (b.size + 5) * (b.size + 5);
        if (dx * dx + dy * dy <= hit) {
          butterflies.splice(i, 1);
          score += 1;
          scoreEl.textContent = `Score: ${score}`;
          tongue.retracting = true;
          continue;
        }
      }

      if (b.x < -40) butterflies.splice(i, 1);
    }
  }

  function update() {
    if (!running) return;
    updateTongue();
    updateButterflies();
  }

  function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, world.h);
    if (isNightMode()) {
      sky.addColorStop(0, "#0a1430");
      sky.addColorStop(1, "#12284a");
    } else {
      sky.addColorStop(0, "#0996ed");
      sky.addColorStop(1, "#bfeecf");
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, world.w, world.h);

    if (isNightMode()) {
      ctx.fillStyle = "rgba(255,255,225,0.9)";
      const stars = [
        [48, 28, 1.3], [92, 48, 1], [138, 24, 1.2], [188, 42, 1],
        [236, 30, 1.4], [292, 52, 1], [338, 24, 1.2], [386, 40, 1],
        [432, 27, 1.3], [476, 47, 1.1],
      ];
      for (const [sx, sy, r] of stars) {
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const drawCloud = (cx, cy, s = 1) => {
      ctx.fillStyle = isNightMode() ? "rgba(190, 210, 255, 0.16)" : "rgba(255,255,255,0.26)";
      ctx.beginPath();
      ctx.ellipse(cx, cy + 8 * s, 33 * s, 10 * s, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isNightMode() ? "rgba(208, 224, 255, 0.35)" : "rgba(255,255,255,0.8)";
      ctx.beginPath();
      ctx.arc(cx - 18 * s, cy + 2 * s, 12 * s, 0, Math.PI * 2);
      ctx.arc(cx - 3 * s, cy - 5 * s, 16 * s, 0, Math.PI * 2);
      ctx.arc(cx + 15 * s, cy + 1 * s, 13 * s, 0, Math.PI * 2);
      ctx.arc(cx + 28 * s, cy + 6 * s, 9 * s, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    };

    drawCloud(55, 34, 0.85);
    drawCloud(155, 48, 1);
    drawCloud(255, 30, 0.9);
    drawCloud(350, 45, 1.05);
    drawCloud(455, 32, 0.82);

    ctx.fillStyle = isNightMode() ? "#27533a" : "#80d58f";
    ctx.fillRect(0, world.h - 44, world.w, 44);
  }

  function drawButterfly(b) {
    const flap = Math.sin(b.flap) * (b.size * 0.22);

    ctx.save();
    ctx.translate(b.x, b.y);

    ctx.fillStyle = "#121dee8e";
    ctx.beginPath();
    ctx.ellipse(-b.size * 0.55, -b.size * 0.15, b.size * 0.72, b.size * 0.52 + flap, 0.4, 0, Math.PI * 2);
    ctx.ellipse(b.size * 0.55, -b.size * 0.15, b.size * 0.72, b.size * 0.52 - flap, -0.4, 0, Math.PI * 2);
    ctx.ellipse(-b.size * 0.6, b.size * 0.35, b.size * 0.58, b.size * 0.42 + flap * 0.5, 0.2, 0, Math.PI * 2);
    ctx.ellipse(b.size * 0.6, b.size * 0.35, b.size * 0.58, b.size * 0.42 - flap * 0.5, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#cfe0ff";
    ctx.beginPath();
    ctx.ellipse(-b.size * 0.48, -b.size * 0.12, b.size * 0.34, b.size * 0.22 + flap * 0.25, 0.4, 0, Math.PI * 2);
    ctx.ellipse(b.size * 0.48, -b.size * 0.12, b.size * 0.34, b.size * 0.22 - flap * 0.25, -0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#2f3f66";
    ctx.fillRect(-1.3, -b.size * 0.72, 2.6, b.size * 1.45);
    ctx.strokeStyle = "#2f3f66";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-0.7, -b.size * 0.72);
    ctx.quadraticCurveTo(-4.2, -b.size * 1.02, -5.6, -b.size * 1.22);
    ctx.moveTo(0.7, -b.size * 0.72);
    ctx.quadraticCurveTo(4.2, -b.size * 1.02, 5.6, -b.size * 1.22);
    ctx.stroke();

    ctx.restore();
  }

  function drawTongue() {
    if (!tongue.active) return;
    const baseX = frog.x + 8;
    const baseY = frog.y - 6;

    ctx.strokeStyle = " #fb748d";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.lineTo(tongue.tipX, tongue.tipY);
    ctx.stroke();

    ctx.fillStyle = "#ff7e96";
    ctx.beginPath();
    ctx.arc(tongue.tipX, tongue.tipY, 4.3, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFrog() {
    const x = frog.x;
    const y = frog.y;

    ctx.fillStyle = "#4ba95b";
    ctx.beginPath();
    ctx.ellipse(x, y + 8, frog.r * 1.06, frog.r * 0.86, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#68c879";
    ctx.beginPath();
    ctx.ellipse(x, y + 10, frog.r * 0.58, frog.r * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();


    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x - 11, y - 12, 7, 0, Math.PI * 2);
    ctx.arc(x + 11, y - 12, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fb86ab";
    ctx.beginPath();
    ctx.ellipse(x - 13, y - 1, 6, 3.2, -0.2, 0, Math.PI * 2);
    ctx.ellipse(x + 13, y - 1, 6, 3.2, 0.2, 0, Math.PI * 2);
    ctx.fill();

    
    ctx.fillStyle = "#151d18";
    ctx.beginPath();
    ctx.arc(x - 11, y - 12, 5, 0, Math.PI * 2);
    ctx.arc(x + 11, y - 12, 5, 0, Math.PI * 2);
    ctx.fill();

    const drawEyeHighlights = (cx, cy) => {
      ctx.beginPath();
      ctx.arc(cx - 1.3, cy - 1.4, 1.15, 0, Math.PI * 2);
      ctx.arc(cx + 1.0, cy - 0.55, 0.75, 0, Math.PI * 2);
      ctx.arc(cx - 0.2, cy + 1.0, 0.55, 0, Math.PI * 2);
      ctx.fill();
    };
    ctx.fillStyle = "#ffffff";
    drawEyeHighlights(x - 11, y - 12);
    drawEyeHighlights(x + 11, y - 12);

   ctx.strokeStyle = "#2f6540";
ctx.lineWidth = 1;
ctx.lineCap = "round";
ctx.beginPath();
ctx.moveTo(x - 8, y + 2);
ctx.quadraticCurveTo(x - 4, y -3, x , y + 2);
ctx.quadraticCurveTo(x + 4, y - 3, x + 8, y + 2);
ctx.stroke();

  }

  function drawAimHint() {
    if (tongue.active) return;
    ctx.strokeStyle = " rgba(249, 246, 246, 0.7)";
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(frog.x + 10, frog.y - 6);
    ctx.lineTo(aim.x, aim.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function draw() {
    drawBackground();
    butterflies.forEach(drawButterfly);
    drawAimHint();
    drawTongue();
    drawFrog();
  }

  function frame() {
    if (!running) return;
    update();
    draw();
    requestAnimationFrame(frame);
  }

  function setAimFromPointer(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const sx = world.w / rect.width;
    const sy = world.h / rect.height;
    aim.x = (clientX - rect.left) * sx;
    aim.y = (clientY - rect.top) * sy;
    aim.x = Math.max(0, Math.min(world.w, aim.x));
    aim.y = Math.max(0, Math.min(world.h, aim.y));
  }

  canvas.addEventListener("mousemove", (e) => {
    setAimFromPointer(e.clientX, e.clientY);
  });

  canvas.addEventListener("click", (e) => {
    if (!running) return;
    setAimFromPointer(e.clientX, e.clientY);
    launchTongue();
  });

  canvas.addEventListener("touchstart", (e) => {
    if (!running) return;
    const t = e.touches[0];
    if (!t) return;
    setAimFromPointer(t.clientX, t.clientY);
    launchTongue();
    e.preventDefault();
  }, { passive: false });

  window.addEventListener("keydown", (e) => {
    if (!running) return;
    if (e.code === "Space") {
      e.preventDefault();
      launchTongue();
    }
  });

  resetBtn.addEventListener("click", restartGame);

  gameShell.classList.add("is-dormant");

  gameShell.addEventListener("mouseenter", () => {
    if (!running) gameShell.classList.add("show-start");
  });

  gameShell.addEventListener("mouseleave", () => {
    if (!running) gameShell.classList.remove("show-start");
  });

  gameShell.addEventListener("touchstart", () => {
    if (!running) gameShell.classList.add("show-start");
  }, { passive: true });

  startBtn.addEventListener("click", () => {
    if (running) return;
    running = true;
    gameShell.classList.remove("is-dormant", "show-start");
    startBtn.setAttribute("hidden", "hidden");
    frame();
  });

  restartGame();
  draw();
})();
