(function () {
  // Minimal game.js: menu navigation, simple HUD, and playable canvas
  // UI elements
  const menuScreen = document.getElementById("menuScreen");
  const careerScreen = document.getElementById("careerScreen");
  const controlsScreen = document.getElementById("controlsScreen");
  const gameScreen = document.getElementById("gameScreen");

  const exhibitionBtn = document.getElementById("exhibitionBtn");
  const careerBtn = document.getElementById("careerBtn");
  const controlsBtn = document.getElementById("controlsBtn");
  const controlsBackBtn = document.getElementById("controlsBackBtn");
  const backToMenuBtn = document.getElementById("backToMenuBtn");
  const startCareerBtn = document.getElementById("startCareerBtn");

  const homeNameEl = document.getElementById("homeName");
  const awayNameEl = document.getElementById("awayName");
  const homeScoreEl = document.getElementById("homeScore");
  const awayScoreEl = document.getElementById("awayScore");
  const clockText = document.getElementById("clockText");
  const driveText = document.getElementById("driveText");
  const statusText = document.getElementById("statusText");

  const playerNameInput = document.getElementById("playerName");
  const schoolSelect = document.getElementById("schoolSelect");
  const positionSelect = document.getElementById("positionSelect");
  const difficultySelect = document.getElementById("difficultySelect");

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  // Navigation helper
  function showScreen(el) {
    [menuScreen, careerScreen, controlsScreen, gameScreen].forEach(s => s.classList.remove("active"));
    el.classList.add("active");
  }

  // Wire buttons (guard with ? in case elements change)
  exhibitionBtn?.addEventListener("click", startExhibition);
  careerBtn?.addEventListener("click", () => showScreen(careerScreen));
  controlsBtn?.addEventListener("click", () => showScreen(controlsScreen));
  controlsBackBtn?.addEventListener("click", () => showScreen(menuScreen));
  backToMenuBtn?.addEventListener("click", () => showScreen(menuScreen));
  startCareerBtn?.addEventListener("click", startCareer);

  function startExhibition() {
    homeNameEl.textContent = "Texas A&M";
    awayNameEl.textContent = "Georgia";
    homeScoreEl.textContent = "0";
    awayScoreEl.textContent = "0";
    statusText.textContent = "Exhibition";
    startGame();
  }

  function startCareer() {
    const name = playerNameInput?.value || "Player";
    const school = schoolSelect?.value || "School";
    homeNameEl.textContent = school;
    awayNameEl.textContent = "Rival";
    statusText.textContent = `Playing as ${name} (${positionSelect?.value || 'UNK'})`;
    startGame();
  }

  // Simple state
  let lastTs = 0;
  let paused = false;
  const state = {
    clock: 20,
    drive: 1,
    player: { x: 120, y: 260, w: 18, h: 28, speed: 120, sprintMul: 1.9 },
    keys: {}
  };

  function startGame() {
    showScreen(gameScreen);
    state.clock = 20;
    state.drive = 1;
    updateHud();
    lastTs = performance.now();
    paused = false;
    requestAnimationFrame(loop);
  }

  function updateHud() {
    const mm = Math.floor(state.clock / 60).toString().padStart(2, "0");
    const ss = Math.floor(state.clock % 60).toString().padStart(2, "0");
    clockText.textContent = `${mm}:${ss}`;
    driveText.textContent = `Drive ${state.drive}`;
    homeScoreEl.textContent = homeScoreEl.textContent || "0";
    awayScoreEl.textContent = awayScoreEl.textContent || "0";
  }

  function loop(ts) {
    const dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;
    if (!paused) {
      update(dt);
      render();
      requestAnimationFrame(loop);
    } else {
      render();
      requestAnimationFrame(loop);
    }
  }

  function update(dt) {
    state.clock = Math.max(0, state.clock - dt);
    if (state.clock <= 0) {
      statusText.textContent = "Quarter over. Press Enter to continue.";
    }
    updateHud();

    const p = state.player;
    let mul = 1;
    if (state.keys[" "]) mul = p.sprintMul;
    let vx = 0, vy = 0;
    if (state.keys["ArrowUp"] || state.keys["w"]) vy = -1;
    if (state.keys["ArrowDown"] || state.keys["s"]) vy = 1;
    if (state.keys["ArrowLeft"] || state.keys["a"]) vx = -1;
    if (state.keys["ArrowRight"] || state.keys["d"]) vx = 1;
    const len = Math.hypot(vx, vy) || 1;
    p.x += (vx / len) * p.speed * mul * dt;
    p.y += (vy / len) * p.speed * mul * dt;

    p.x = Math.max(8, Math.min(canvas.width - p.w - 8, p.x));
    p.y = Math.max(8, Math.min(canvas.height - p.h - 8, p.y));
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // field
    ctx.fillStyle = "#0f6c44";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // midline
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    // player
    const p = state.player;
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = "#8a3a00";
    ctx.strokeRect(p.x, p.y, p.w, p.h);

    // HUD overlay small
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(8, 8, 260, 36);
    ctx.fillStyle = "#fff";
    ctx.font = "14px sans-serif";
    ctx.fillText(statusText.textContent || "Push the ball down field and score.", 12, 32);

    if (paused) {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff";
      ctx.font = "28px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Paused", canvas.width / 2, canvas.height / 2);
      ctx.textAlign = "start";
    }
  }

  // Input
  window.addEventListener("keydown", (e) => {
    const k = e.key;
    state.keys[k] = true;

    if (k === "Escape") {
      paused = !paused;
      statusText.textContent = paused ? "Paused" : "Resumed";
      if (!paused) lastTs = performance.now();
    }

    if (k === "Enter") {
      if (state.clock <= 0) {
        state.drive += 1;
        state.clock = 20;
        updateHud();
        statusText.textContent = "Drive continued";
      }
    }

    if (k === "e" || k === "E") {
      statusText.textContent = "Impact play!";
    }
  });

  window.addEventListener("keyup", (e) => {
    const k = e.key;
    delete state.keys[k];
  });

  // Resize canvas to match CSS size and devicePixelRatio
  function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    const cssW = Math.min(960, canvas.clientWidth || 960);
    const cssH = Math.min(520, canvas.clientHeight || 520);
    canvas.width = Math.floor(cssW * ratio);
    canvas.height = Math.floor(cssH * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  window.addEventListener("resize", resizeCanvas);
  // initial
  resizeCanvas();

  // Ensure a screen is active
  if (!menuScreen.classList.contains("active") &&
      !careerScreen.classList.contains("active") &&
      !controlsScreen.classList.contains("active") &&
      !gameScreen.classList.contains("active")) {
    showScreen(menuScreen);
  }
})();
