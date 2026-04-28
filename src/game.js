(() => {
  const content = window.GameContent;
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const roomNameEl = document.getElementById("roomName");
  const objectiveEl = document.getElementById("objective");
  const inventoryEl = document.getElementById("inventory");
  const promptEl = document.getElementById("interactionPrompt");
  const dialogueEl = document.getElementById("dialogue");
  const dialogueSpeakerEl = document.getElementById("dialogueSpeaker");
  const dialogueTextEl = document.getElementById("dialogueText");
  const dialogueChoicesEl = document.getElementById("dialogueChoices");
  const journalEl = document.getElementById("journal");
  const journalListEl = document.getElementById("journalList");
  const closeJournalButton = document.getElementById("closeJournal");

  const state = {
    roomId: content.startRoom,
    player: {
      x: content.startPosition.x * content.tileSize + content.tileSize / 2,
      y: content.startPosition.y * content.tileSize + content.tileSize / 2,
      radius: 11,
      speed: 116,
      facing: { x: 0, y: 1 }
    },
    keys: new Set(),
    inventory: new Set(),
    flags: { ...content.flags },
    journal: [],
    dialogue: null,
    activeInteractable: null,
    time: 0,
    camera: { x: 0, y: 0 },
    shake: 0
  };

  const tileSize = content.tileSize;
  const solidTiles = new Set(["#"]);
  const pixelAssets = {
    image: new Image(),
    loaded: false,
    sourceTile: 16,
    spacing: 1,
    columns: 27,
    floorTiles: [8, 9, 10, 35],
    wallTiles: [81, 108, 135],
    objectTiles: {
      notice: 162,
      bag: 185,
      cabinet: 112,
      generator: 426,
      keys: 190,
      npc: 293,
      door: 108,
      exit: 108,
      stairs: 324,
      phone: 163
    },
    playerTiles: {
      down: 23,
      up: 77,
      left: 50,
      right: 50
    }
  };
  const movementCodes = new Set([
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "KeyW",
    "KeyA",
    "KeyS",
    "KeyD",
    "ShiftLeft",
    "ShiftRight"
  ]);
  const keyFallbacks = {
    w: "KeyW",
    a: "KeyA",
    s: "KeyS",
    d: "KeyD",
    W: "KeyW",
    A: "KeyA",
    S: "KeyS",
    D: "KeyD",
    Shift: "ShiftLeft",
    ArrowUp: "ArrowUp",
    ArrowDown: "ArrowDown",
    ArrowLeft: "ArrowLeft",
    ArrowRight: "ArrowRight",
    " ": "Space",
    Spacebar: "Space"
  };
  const objectGlyphs = {
    A: { color: "#73836f", type: "notice" },
    B: { color: "#8a7462", type: "bag" },
    C: { color: "#554a40", type: "cabinet" },
    D: { color: "#77614f", type: "exit" },
    G: { color: "#53616f", type: "generator" },
    K: { color: "#7c715e", type: "keys" },
    N: { color: "#8e9b8e", type: "npc" },
    R: { color: "#6f2f31", type: "door" },
    S: { color: "#4d5954", type: "stairs" },
    T: { color: "#4c5b52", type: "phone" }
  };

  let lastFrame = performance.now();
  let audioContext = null;
  let droneGain = null;

  pixelAssets.image.onload = () => {
    pixelAssets.loaded = true;
  };
  pixelAssets.image.src = "assets/vendor/kenney-rpg-urban/raw/Tilemap/tilemap.png";

  function room() {
    return content.rooms[state.roomId];
  }

  function mapSize(currentRoom = room()) {
    return {
      cols: currentRoom.map[0].length,
      rows: currentRoom.map.length,
      width: currentRoom.map[0].length * tileSize,
      height: currentRoom.map.length * tileSize
    };
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    canvas.width = Math.max(640, Math.floor(rect.width * scale));
    canvas.height = Math.max(360, Math.floor(rect.height * scale));
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }

  function screenSize() {
    return {
      width: canvas.width / (window.devicePixelRatio || 1),
      height: canvas.height / (window.devicePixelRatio || 1)
    };
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function assetSourceRect(index) {
    const cell = pixelAssets.sourceTile + pixelAssets.spacing;
    return {
      x: (index % pixelAssets.columns) * cell,
      y: Math.floor(index / pixelAssets.columns) * cell,
      size: pixelAssets.sourceTile
    };
  }

  function drawPixelTile(index, x, y, width = tileSize, height = tileSize) {
    if (!pixelAssets.loaded) return false;
    const source = assetSourceRect(index);
    ctx.drawImage(
      pixelAssets.image,
      source.x,
      source.y,
      source.size,
      source.size,
      Math.round(x),
      Math.round(y),
      width,
      height
    );
    return true;
  }

  function normalizedCode(event) {
    return keyFallbacks[event.key] || event.code;
  }

  function tileAtPixel(x, y, currentRoom = room()) {
    const tx = Math.floor(x / tileSize);
    const ty = Math.floor(y / tileSize);
    if (ty < 0 || ty >= currentRoom.map.length || tx < 0 || tx >= currentRoom.map[0].length) {
      return "#";
    }
    return currentRoom.map[ty][tx];
  }

  function isSolid(x, y) {
    return solidTiles.has(tileAtPixel(x, y));
  }

  function canOccupy(x, y) {
    const r = state.player.radius;
    return (
      !isSolid(x - r, y - r) &&
      !isSolid(x + r, y - r) &&
      !isSolid(x - r, y + r) &&
      !isSolid(x + r, y + r)
    );
  }

  function movePlayer(dx, dy, dt) {
    if (state.dialogue) return;
    if (dx === 0 && dy === 0) return;

    const length = Math.hypot(dx, dy);
    const walkMod = state.keys.has("ShiftLeft") || state.keys.has("ShiftRight") ? 0.52 : 1;
    const step = state.player.speed * walkMod * dt;
    const nx = state.player.x + (dx / length) * step;
    const ny = state.player.y + (dy / length) * step;

    state.player.facing = { x: dx / length, y: dy / length };
    if (canOccupy(nx, state.player.y)) state.player.x = nx;
    if (canOccupy(state.player.x, ny)) state.player.y = ny;
  }

  function findInteractable() {
    const candidates = [];
    const currentRoom = room();
    for (const item of currentRoom.interactables || []) {
      if (item.onceFlag && state.flags[item.onceFlag]) continue;
      const distance = distanceToTile(item.x, item.y);
      if (distance < 42) candidates.push({ ...item, distance, kind: "object" });
    }
    for (const exit of currentRoom.exits || []) {
      const distance = distanceToTile(exit.x, exit.y);
      if (distance < 38) candidates.push({ ...exit, distance, kind: "exit" });
    }
    candidates.sort((a, b) => a.distance - b.distance);
    return candidates[0] || null;
  }

  function distanceToTile(tx, ty) {
    const cx = tx * tileSize + tileSize / 2;
    const cy = ty * tileSize + tileSize / 2;
    return Math.hypot(state.player.x - cx, state.player.y - cy);
  }

  function interact() {
    if (state.dialogue) {
      advanceDialogue();
      return;
    }

    const target = state.activeInteractable;
    if (!target) return;

    if (target.kind === "exit") {
      tryExit(target);
      return;
    }

    if (target.requiredItem && !state.inventory.has(target.requiredItem)) {
      openDialogue({
        speaker: "物品不足",
        lines: [`需要 ${content.items[target.requiredItem].name}。`],
        choices: [{ text: "返回", close: true }]
      });
      return;
    }
    if (target.requiredFlag && !state.flags[target.requiredFlag]) {
      openDialogueById(target.lockedDialogue);
      return;
    }

    if (target.giveItem) addItem(target.giveItem);
    if (target.setFlag) state.flags[target.setFlag] = true;
    if (target.onceFlag) state.flags[target.onceFlag] = true;
    openDialogueById(target.dialogue);
  }

  function tryExit(exit) {
    if (exit.requiredItem && !state.inventory.has(exit.requiredItem)) {
      openDialogueById(exit.lockedDialogue);
      return;
    }
    if (exit.requiredFlag && !state.flags[exit.requiredFlag]) {
      openDialogueById(exit.lockedDialogue);
      return;
    }
    changeRoom(exit.targetRoom, exit.targetSpawn);
  }

  function changeRoom(roomId, spawnId) {
    const nextRoom = content.rooms[roomId];
    const spawn = nextRoom.spawnPoints[spawnId] || content.startPosition;
    state.roomId = roomId;
    state.player.x = spawn.x * tileSize + tileSize / 2;
    state.player.y = spawn.y * tileSize + tileSize / 2;
    state.activeInteractable = null;
    state.shake = 0.22;
    updateHud();
    tuneDrone();
  }

  function openDialogueById(id) {
    const dialogue = content.dialogues[id];
    if (!dialogue) return;
    openDialogue(dialogue);
  }

  function openDialogue(dialogue) {
    state.dialogue = {
      ...dialogue,
      index: 0,
      recorded: false
    };
    dialogueEl.classList.remove("hidden");
    renderDialogue();
  }

  function renderDialogue() {
    const dialogue = state.dialogue;
    if (!dialogue) return;
    dialogueSpeakerEl.textContent = dialogue.speaker || "";
    dialogueTextEl.textContent = dialogue.lines[dialogue.index] || "";
    dialogueChoicesEl.innerHTML = "";

    const isLastLine = dialogue.index >= dialogue.lines.length - 1;
    if (!isLastLine) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "继续";
      button.addEventListener("click", advanceDialogue);
      dialogueChoicesEl.appendChild(button);
      return;
    }

    if (dialogue.journal && !dialogue.recorded) {
      addJournal(dialogue.journal);
      dialogue.recorded = true;
    }

    for (const choice of dialogue.choices || [{ text: "结束", close: true }]) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = choice.text;
      button.addEventListener("click", () => chooseDialogue(choice));
      dialogueChoicesEl.appendChild(button);
    }
  }

  function advanceDialogue() {
    if (!state.dialogue) return;
    if (state.dialogue.index < state.dialogue.lines.length - 1) {
      state.dialogue.index += 1;
      renderDialogue();
      return;
    }
    const choices = state.dialogue.choices || [];
    if (choices.length === 1) chooseDialogue(choices[0]);
  }

  function chooseDialogue(choice) {
    if (choice.setFlag) state.flags[choice.setFlag] = true;
    if (choice.giveItem) addItem(choice.giveItem);
    if (choice.next) {
      openDialogueById(choice.next);
      return;
    }
    if (choice.close) closeDialogue();
  }

  function closeDialogue() {
    state.dialogue = null;
    dialogueEl.classList.add("hidden");
  }

  function addItem(itemId) {
    if (state.inventory.has(itemId)) return;
    state.inventory.add(itemId);
    addJournal(`获得：${content.items[itemId].name}。${content.items[itemId].description}`);
    updateHud();
  }

  function addJournal(text) {
    if (state.journal.includes(text)) return;
    state.journal.push(text);
    renderJournal();
  }

  function renderJournal() {
    journalListEl.innerHTML = "";
    const entries = state.journal.length ? state.journal : content.controls;
    for (const entry of entries) {
      const li = document.createElement("li");
      li.textContent = entry;
      journalListEl.appendChild(li);
    }
  }

  function updateHud() {
    roomNameEl.textContent = room().name;
    objectiveEl.textContent = content.objective;
    inventoryEl.textContent = state.inventory.size
      ? [...state.inventory].map((id) => content.items[id].name).join("、")
      : "空";
  }

  function updatePrompt() {
    state.activeInteractable = findInteractable();
    if (state.dialogue || !state.activeInteractable) {
      promptEl.classList.add("hidden");
      return;
    }
    promptEl.textContent = `E / 空格：${state.activeInteractable.label}`;
    promptEl.classList.remove("hidden");
  }

  function draw() {
    const size = screenSize();
    const currentRoom = room();
    const dimensions = mapSize(currentRoom);
    const shakeX = (Math.random() - 0.5) * state.shake * 10;
    const shakeY = (Math.random() - 0.5) * state.shake * 10;
    const offsetX = dimensions.width < size.width ? Math.floor((size.width - dimensions.width) / 2) : 0;
    const offsetY = dimensions.height < size.height ? Math.floor((size.height - dimensions.height) / 2) : 0;

    state.camera.x = clamp(state.player.x - size.width / 2, 0, Math.max(0, dimensions.width - size.width));
    state.camera.y = clamp(state.player.y - size.height / 2, 0, Math.max(0, dimensions.height - size.height));

    ctx.clearRect(0, 0, size.width, size.height);
    ctx.save();
    ctx.translate(offsetX - Math.floor(state.camera.x) + shakeX, offsetY - Math.floor(state.camera.y) + shakeY);

    drawRoom(currentRoom);
    drawInteractables(currentRoom);
    drawExits(currentRoom);
    drawLight(currentRoom, dimensions);
    drawPlayer();

    ctx.restore();
    drawNoise(size);
  }

  function drawRoom(currentRoom) {
    const dimensions = mapSize(currentRoom);
    ctx.fillStyle = currentRoom.ambient;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    for (let y = 0; y < currentRoom.map.length; y += 1) {
      for (let x = 0; x < currentRoom.map[y].length; x += 1) {
        const glyph = currentRoom.map[y][x];
        const px = x * tileSize;
        const py = y * tileSize;
        if (glyph === "#") {
          drawWall(px, py, currentRoom.wall);
        } else {
          drawFloor(px, py, currentRoom.floor, x, y);
          if (objectGlyphs[glyph]) drawMapObject(px, py, objectGlyphs[glyph], x, y);
        }
      }
    }
  }

  function drawFloor(x, y, color, tx, ty) {
    const floorIndex = pixelAssets.floorTiles[(tx * 3 + ty * 5) % pixelAssets.floorTiles.length];
    if (drawPixelTile(floorIndex, x, y)) {
      ctx.fillStyle = "rgba(5, 9, 8, 0.36)";
      ctx.fillRect(x, y, tileSize, tileSize);
      return;
    }

    ctx.fillStyle = color;
    ctx.fillRect(x, y, tileSize, tileSize);
    ctx.fillStyle = (tx + ty) % 2 === 0 ? "rgba(255,255,255,0.018)" : "rgba(0,0,0,0.035)";
    ctx.fillRect(x, y, tileSize, tileSize);
    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.strokeRect(x + 0.5, y + 0.5, tileSize - 1, tileSize - 1);
  }

  function drawWall(x, y, color) {
    const wallIndex = pixelAssets.wallTiles[Math.floor((x / tileSize + y / tileSize) % pixelAssets.wallTiles.length)];
    if (drawPixelTile(wallIndex, x, y)) {
      ctx.fillStyle = "rgba(0,0,0,0.34)";
      ctx.fillRect(x, y + tileSize - 8, tileSize, 8);
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.strokeRect(x + 0.5, y + 0.5, tileSize - 1, tileSize - 1);
      return;
    }

    ctx.fillStyle = color;
    ctx.fillRect(x, y, tileSize, tileSize);
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(x, y + tileSize - 8, tileSize, 8);
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.strokeRect(x + 0.5, y + 0.5, tileSize - 1, tileSize - 1);
  }

  function drawMapObject(x, y, info, tx, ty) {
    const pulse = 1 + Math.sin(state.time * 4 + tx + ty) * 0.04;
    ctx.save();
    ctx.translate(x + tileSize / 2, y + tileSize / 2);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(1, 9, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    const tile = pixelAssets.objectTiles[info.type];
    if (typeof tile === "number" && pixelAssets.loaded) {
      ctx.imageSmoothingEnabled = false;
      drawPixelTile(tile, -tileSize / 2, -tileSize / 2, tileSize, tileSize);
      ctx.restore();
      return;
    }

    ctx.fillStyle = info.color;
    if (info.type === "npc") {
      ctx.beginPath();
      ctx.arc(0, -4, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-7, 4, 14, 12);
    } else if (info.type === "phone") {
      ctx.fillRect(-9, -6, 18, 14);
      ctx.fillRect(-5, -12, 10, 7);
    } else if (info.type === "door" || info.type === "exit") {
      ctx.fillRect(-11, -13, 22, 26);
      ctx.fillStyle = "#b58a68";
      ctx.fillRect(5, 0, 3, 3);
    } else if (info.type === "stairs") {
      for (let i = 0; i < 4; i += 1) ctx.fillRect(-12 + i * 6, -10 + i * 5, 20, 4);
    } else {
      ctx.fillRect(-10, -10, 20, 20);
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.fillRect(-7, -7, 14, 4);
    }
    ctx.restore();
  }

  function drawInteractables(currentRoom) {
    for (const item of currentRoom.interactables || []) {
      if (item.onceFlag && state.flags[item.onceFlag]) continue;
      const isActive = state.activeInteractable?.kind === "object" && state.activeInteractable.id === item.id;
      drawMarker(item.x, item.y, isActive ? "#dceab2" : "#93a175");
    }
  }

  function drawExits(currentRoom) {
    for (const exit of currentRoom.exits || []) {
      const isActive = state.activeInteractable?.kind === "exit" && state.activeInteractable.id === exit.id;
      drawMarker(exit.x, exit.y, isActive ? "#f1d4a5" : "#a8845e");
    }
  }

  function drawMarker(tx, ty, color) {
    const x = tx * tileSize + tileSize / 2;
    const y = ty * tileSize + tileSize / 2 - 16;
    const bob = Math.sin(state.time * 5 + tx) * 2;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y + bob, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.beginPath();
    ctx.arc(x, y + bob, 7, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawPlayer() {
    const { x, y, radius } = state.player;
    const direction =
      Math.abs(state.player.facing.x) > Math.abs(state.player.facing.y)
        ? state.player.facing.x < 0
          ? "left"
          : "right"
        : state.player.facing.y < 0
          ? "up"
          : "down";

    ctx.save();
    ctx.fillStyle = "rgba(199, 232, 146, 0.18)";
    ctx.beginPath();
    ctx.ellipse(x, y + 7, 22, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(224, 245, 170, 0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y + 7, 19, 10, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.ellipse(x + 1, y + 12, 13, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    if (pixelAssets.loaded) {
      const tile = pixelAssets.playerTiles[direction];
      ctx.imageSmoothingEnabled = false;
      drawPixelTile(tile, x - 16, y - 24, 32, 32);
      ctx.strokeStyle = "rgba(246, 255, 204, 0.8)";
      ctx.strokeRect(Math.round(x - 17) + 0.5, Math.round(y - 25) + 0.5, 33, 33);
      ctx.restore();
      return;
    }

    ctx.fillStyle = content.player.shadow;
    ctx.fillRect(x - 7, y - 3, 14, 18);
    ctx.fillStyle = content.player.color;
    ctx.beginPath();
    ctx.arc(x, y - 8, radius - 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#2d362f";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - 8);
    ctx.lineTo(x + state.player.facing.x * 12, y - 8 + state.player.facing.y * 12);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.restore();
  }

  function drawLight(currentRoom, dimensions) {
    const radius = state.flags.generatorAwake ? 178 : 132;
    const pulse = Math.sin(state.time * 3.3) * 12 + Math.sin(state.time * 9.1) * 4;
    const gradient = ctx.createRadialGradient(
      state.player.x,
      state.player.y,
      20,
      state.player.x,
      state.player.y,
      radius + pulse
    );
    gradient.addColorStop(0, "rgba(255, 248, 210, 0.9)");
    gradient.addColorStop(0.52, "rgba(0, 0, 0, 0.34)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = currentRoom.fog;
    ctx.globalAlpha = 0.72;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, radius + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const flicker = Math.max(0, Math.sin(state.time * 17) - 0.86);
    if (flicker > 0) {
      ctx.fillStyle = `rgba(255, 255, 230, ${flicker * 0.18})`;
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    }
  }

  function drawNoise(size) {
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 70; i += 1) {
      const x = Math.random() * size.width;
      const y = Math.random() * size.height;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.restore();
  }

  function update(dt) {
    state.time += dt;
    state.shake = Math.max(0, state.shake - dt);

    const left = state.keys.has("ArrowLeft") || state.keys.has("KeyA");
    const right = state.keys.has("ArrowRight") || state.keys.has("KeyD");
    const up = state.keys.has("ArrowUp") || state.keys.has("KeyW");
    const down = state.keys.has("ArrowDown") || state.keys.has("KeyS");
    movePlayer(Number(right) - Number(left), Number(down) - Number(up), dt);
    updatePrompt();
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function toggleJournal(force) {
    const shouldShow = typeof force === "boolean" ? force : journalEl.classList.contains("hidden");
    journalEl.classList.toggle("hidden", !shouldShow);
  }

  function ensureAudio() {
    if (audioContext) return;
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const filter = audioContext.createBiquadFilter();
    droneGain = audioContext.createGain();

    oscillator.type = "sawtooth";
    oscillator.frequency.value = 46;
    filter.type = "lowpass";
    filter.frequency.value = 180;
    droneGain.gain.value = 0.018;

    oscillator.connect(filter);
    filter.connect(droneGain);
    droneGain.connect(audioContext.destination);
    oscillator.start();
    tuneDrone();
  }

  function tuneDrone() {
    if (!droneGain || !audioContext) return;
    const gainByMood = { low: 0.015, thin: 0.011, pulse: 0.024 };
    droneGain.gain.setTargetAtTime(gainByMood[room().musicMood] || 0.014, audioContext.currentTime, 0.8);
  }

  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("keydown", (event) => {
    const code = normalizedCode(event);
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(code)) {
      event.preventDefault();
    }
    if (code === "KeyE" || code === "Space") {
      ensureAudio();
      interact();
      return;
    }
    if (code === "KeyJ") {
      toggleJournal();
      return;
    }
    if (movementCodes.has(code)) {
      state.keys.add(code);
    }
  });
  window.addEventListener("keyup", (event) => {
    state.keys.delete(normalizedCode(event));
  });
  window.addEventListener("blur", () => {
    state.keys.clear();
  });
  canvas.addEventListener("pointerdown", () => {
    canvas.focus();
    ensureAudio();
    if (state.activeInteractable) interact();
  });
  closeJournalButton.addEventListener("click", () => toggleJournal(false));

  resizeCanvas();
  updateHud();
  renderJournal();
  addJournal("雨停之后，旧楼里只剩应急灯还亮着。物业说可能只是跳闸。");
  canvas.focus();
  requestAnimationFrame(loop);
})();
