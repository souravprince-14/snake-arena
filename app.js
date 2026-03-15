import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { APP_CONFIG } from "./config.js";

const CELL_SIZE = 24;
const GRID_WIDTH = 20;
const GRID_HEIGHT = 20;
const TICK_MS = 140;

const COLORS = {
  background: "#f4f1ea",
  grid: "#ddd6c8",
  snake: "#1f6f50",
  snakeHead: "#124734",
  food: "#cc5333",
};

const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const authForm = document.getElementById("auth-form");
const emailInput = document.getElementById("email-input");
const passwordInput = document.getElementById("password-input");
const displayNameInput = document.getElementById("display-name-input");
const authStatus = document.getElementById("auth-status");
const modalShell = document.getElementById("modal-shell");
const modalBackdrop = document.getElementById("modal-backdrop");
const instructionsOpenButton = document.getElementById("instructions-open-button");
const instructionsModal = document.getElementById("instructions-modal");
const feedbackToggleButton = document.getElementById("feedback-toggle-button");
const feedbackInboxOpenButton = document.getElementById("feedback-inbox-open-button");
const leaderboardJumpButton = document.getElementById("leaderboard-jump-button");
const leaderboardSection = document.getElementById("leaderboard-section");
const feedbackCard = document.getElementById("feedback-card");
const feedbackInboxCard = document.getElementById("feedback-inbox-card");
const feedbackInboxStatus = document.getElementById("feedback-inbox-status");
const feedbackInboxList = document.getElementById("feedback-inbox-list");
const feedbackForm = document.getElementById("feedback-form");
const feedbackStatus = document.getElementById("feedback-status");
const feedbackCategoryInput = document.getElementById("feedback-category-input");
const feedbackMessageInput = document.getElementById("feedback-message-input");
const feedbackSubmitButton = document.getElementById("feedback-submit-button");
const feedbackCancelButton = document.getElementById("feedback-cancel-button");
const modalCloseButtons = document.querySelectorAll("[data-close-modal]");
const scoreboard = document.getElementById("scoreboard");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayMessage = document.getElementById("overlay-message");
const playPauseButton = document.getElementById("play-pause-button");
const restartButton = document.getElementById("restart-button");
const signUpButton = document.getElementById("sign-up-button");
const saveNameButton = document.getElementById("save-name-button");
const signOutButton = document.getElementById("sign-out-button");
const leaderboardList = document.getElementById("leaderboard-list");
const touchButtons = document.querySelectorAll(".touch");

const hasSupabaseConfig =
  APP_CONFIG.supabaseUrl &&
  APP_CONFIG.supabaseAnonKey &&
  !APP_CONFIG.supabaseUrl.includes("YOUR_SUPABASE");

const supabase = hasSupabaseConfig
  ? createClient(APP_CONFIG.supabaseUrl, APP_CONFIG.supabaseAnonKey)
  : null;

let session = null;
let playerProfile = null;
let playerHighScore = 0;
let tickHandle = null;
let isPaused = true;
let state = newGame();
let isAdmin = false;
let activeModal = null;

function setAuthMessage(message, isError = false) {
  authStatus.textContent = message;
  authStatus.style.color = isError ? "#a03f2b" : "#6d6558";
}

function setFeedbackMessage(message, isError = false) {
  feedbackStatus.textContent = message;
  feedbackStatus.style.color = isError ? "#a03f2b" : "#6d6558";
}

function setFeedbackInboxMessage(message, isError = false) {
  feedbackInboxStatus.textContent = message;
  feedbackInboxStatus.style.color = isError ? "#a03f2b" : "#6d6558";
}

function randomFood(snake) {
  const occupied = new Set(snake.map((segment) => `${segment.x},${segment.y}`));
  const available = [];

  for (let y = 0; y < GRID_HEIGHT; y += 1) {
    for (let x = 0; x < GRID_WIDTH; x += 1) {
      if (!occupied.has(`${x},${y}`)) {
        available.push({ x, y });
      }
    }
  }

  if (available.length === 0) {
    return null;
  }

  return available[Math.floor(Math.random() * available.length)];
}

function newGame() {
  const centerX = Math.floor(GRID_WIDTH / 2);
  const centerY = Math.floor(GRID_HEIGHT / 2);
  const snake = [
    { x: centerX, y: centerY },
    { x: centerX - 1, y: centerY },
    { x: centerX - 2, y: centerY },
  ];

  return {
    snake,
    direction: { ...DIRECTIONS.right },
    food: randomFood(snake),
    score: 0,
    gameOver: false,
  };
}

function isOppositeDirection(current, next) {
  return current.x + next.x === 0 && current.y + next.y === 0;
}

function stopLoop() {
  if (tickHandle !== null) {
    window.clearInterval(tickHandle);
    tickHandle = null;
  }
}

function startLoop() {
  if (tickHandle !== null || state.gameOver || !canPlay()) {
    return;
  }
  tickHandle = window.setInterval(stepGame, TICK_MS);
}

function setPause(nextPaused) {
  if (!canPlay() || state.gameOver) {
    return;
  }

  isPaused = nextPaused;
  if (isPaused) {
    stopLoop();
  } else {
    startLoop();
  }
  draw();
}

function togglePause() {
  if (state.gameOver) {
    restartGame();
    return;
  }
  setPause(!isPaused);
}

function restartGame() {
  stopLoop();
  state = newGame();
  isPaused = true;
  draw();
}

function changeDirection(nextDirection) {
  if (!canPlay() || state.gameOver) {
    return;
  }
  if (state.snake.length > 1 && isOppositeDirection(state.direction, nextDirection)) {
    return;
  }
  state = {
    ...state,
    direction: { ...nextDirection },
  };
  draw();
}

async function stepGame() {
  if (state.gameOver || isPaused || !canPlay()) {
    return;
  }

  const head = state.snake[0];
  const nextHead = {
    x: head.x + state.direction.x,
    y: head.y + state.direction.y,
  };

  const hitWall =
    nextHead.x < 0 ||
    nextHead.x >= GRID_WIDTH ||
    nextHead.y < 0 ||
    nextHead.y >= GRID_HEIGHT;

  if (hitWall) {
    state = { ...state, gameOver: true };
    stopLoop();
    await submitHighScore();
    draw();
    return;
  }

  const ateFood = state.food && nextHead.x === state.food.x && nextHead.y === state.food.y;
  const nextSnake = [nextHead, ...state.snake];

  if (!ateFood) {
    nextSnake.pop();
  }

  const hitSelf = nextSnake
    .slice(1)
    .some((segment) => segment.x === nextHead.x && segment.y === nextHead.y);

  if (hitSelf) {
    state = { ...state, snake: nextSnake, gameOver: true };
    stopLoop();
    await submitHighScore();
    draw();
    return;
  }

  state = {
    ...state,
    snake: nextSnake,
    food: ateFood ? randomFood(nextSnake) : state.food,
    score: state.score + (ateFood ? 1 : 0),
  };

  draw();
}

function drawGrid() {
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;

  for (let x = 0; x <= canvas.width; x += CELL_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y <= canvas.height; y += CELL_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawCell(x, y, color, inset) {
  const px = x * CELL_SIZE + inset;
  const py = y * CELL_SIZE + inset;
  const size = CELL_SIZE - inset * 2;
  ctx.fillStyle = color;
  ctx.fillRect(px, py, size, size);
}

function drawSnake() {
  state.snake.forEach((segment, index) => {
    drawCell(segment.x, segment.y, index === 0 ? COLORS.snakeHead : COLORS.snake, 2);
  });
}

function drawFood() {
  if (!state.food) {
    return;
  }
  drawCell(state.food.x, state.food.y, COLORS.food, 4);
}

function updateOverlay() {
  if (!hasSupabaseConfig) {
    overlay.classList.remove("hidden");
    overlayTitle.textContent = "Add Supabase config";
    overlayMessage.textContent = "Fill in config.js with your Supabase URL and anon key.";
    return;
  }

  if (!session) {
    overlay.classList.remove("hidden");
    overlayTitle.textContent = "Login required";
    overlayMessage.textContent = "Sign in or create an account to play.";
    return;
  }

  if (!playerProfile?.display_name) {
    overlay.classList.remove("hidden");
    overlayTitle.textContent = "Choose a name";
    overlayMessage.textContent = "Save a display name before starting the game.";
    return;
  }

  if (state.gameOver) {
    overlay.classList.remove("hidden");
    overlayTitle.textContent = "Game Over";
    overlayMessage.textContent = "Press Restart, Space, or P to play again.";
    return;
  }

  if (isPaused) {
    overlay.classList.remove("hidden");
    overlayTitle.textContent = "Paused";
    overlayMessage.textContent = "Press Play, Space, or P to start.";
    return;
  }

  overlay.classList.add("hidden");
}

function canPlay() {
  return Boolean(session && playerProfile?.display_name && hasSupabaseConfig);
}

function canSendFeedback() {
  return Boolean(session && hasSupabaseConfig);
}

function isAdminUser() {
  return isAdmin;
}

function syncControlState() {
  const playable = canPlay();
  playPauseButton.disabled = !playable;
  restartButton.disabled = !playable;
  signOutButton.classList.toggle("hidden", !session);
  signUpButton.classList.toggle("hidden", Boolean(session));
  saveNameButton.classList.toggle("hidden", !session);
  feedbackSubmitButton.disabled = !canSendFeedback();
  feedbackInboxOpenButton.classList.toggle("hidden", !isAdminUser());
}

function openModal(name) {
  activeModal = name;
  modalShell.classList.remove("hidden");
  modalShell.setAttribute("aria-hidden", "false");
  instructionsModal.classList.toggle("hidden", name !== "instructions");
  feedbackCard.classList.toggle("hidden", name !== "feedback");
  feedbackInboxCard.classList.toggle("hidden", name !== "feedback-inbox");

  if (name === "feedback" && !canSendFeedback()) {
    setFeedbackMessage("Sign in first to send feedback.", true);
  } else if (name === "feedback") {
    setFeedbackMessage("Signed-in players can send suggestions for future improvements.");
  }
}

function closeModal() {
  activeModal = null;
  modalShell.classList.add("hidden");
  modalShell.setAttribute("aria-hidden", "true");
  instructionsModal.classList.add("hidden");
  feedbackCard.classList.add("hidden");
  feedbackInboxCard.classList.add("hidden");
}

function draw() {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawFood();
  drawSnake();
  scoreboard.textContent = `Score: ${state.score} | Your Best: ${playerHighScore}`;
  playPauseButton.textContent = state.gameOver || isPaused ? "Play" : "Pause";
  syncControlState();
  updateOverlay();
}

function renderLeaderboard(entries) {
  if (!entries.length) {
    leaderboardList.innerHTML = '<li class="muted">No scores yet.</li>';
    return;
  }

  leaderboardList.innerHTML = entries
    .map((entry) => {
      const isCurrentUser = entry.user_id === session?.user?.id;
      const badge = isCurrentUser ? '<span class="leaderboard-badge">you</span>' : "";
      return `
        <li class="leaderboard-item">
          <div class="leaderboard-line">
            <strong>${escapeHtml(entry.display_name)}</strong>
            ${badge}
          </div>
          <span class="muted">score ${entry.score}</span>
        </li>
      `;
    })
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function loadLeaderboard() {
  if (!supabase) {
    return;
  }

  const { data, error } = await supabase
    .from("high_scores")
    .select("user_id, display_name, score")
    .order("score", { ascending: false })
    .order("updated_at", { ascending: true })
    .limit(10);

  if (error) {
    leaderboardList.innerHTML = `<li class="muted">${escapeHtml(error.message)}</li>`;
    return;
  }

  renderLeaderboard(data || []);
}

function renderFeedbackInbox(entries) {
  if (!entries.length) {
    feedbackInboxList.innerHTML = '<p class="muted">No feedback yet.</p>';
    return;
  }

  feedbackInboxList.innerHTML = entries
    .map((entry) => {
      const created = new Date(entry.created_at).toLocaleString();
      return `
        <article class="feedback-entry">
          <div class="feedback-entry-head">
            <div>
              <strong>${escapeHtml(entry.display_name)}</strong>
              <div class="feedback-meta">${escapeHtml(entry.email)} | ${escapeHtml(created)}</div>
            </div>
            <span class="feedback-category">${escapeHtml(entry.category)}</span>
          </div>
          <p>${escapeHtml(entry.message)}</p>
        </article>
      `;
    })
    .join("");
}

async function loadFeedbackInbox() {
  if (!supabase || !isAdminUser()) {
    feedbackInboxList.innerHTML = '<p class="muted">Admin feedback will appear here.</p>';
    setFeedbackInboxMessage("Sign in with an admin account to review player feedback.");
    return;
  }

  const { data, error } = await supabase
    .from("feedback")
    .select("display_name, email, category, message, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    setFeedbackInboxMessage(error.message, true);
    feedbackInboxList.innerHTML = '<p class="muted">Could not load feedback.</p>';
    return;
  }

  setFeedbackInboxMessage("Latest player feedback");
  renderFeedbackInbox(data || []);
}

async function loadAdminStatus() {
  if (!supabase || !session) {
    isAdmin = false;
    return;
  }

  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error) {
    isAdmin = false;
    return;
  }

  isAdmin = Boolean(data?.user_id);
}

async function submitFeedback() {
  if (!supabase || !session) {
    throw new Error("Please sign in before sending feedback.");
  }

  const message = feedbackMessageInput.value.trim();
  if (message.length < 8) {
    throw new Error("Please add a little more detail before sending feedback.");
  }

  const payload = {
    user_id: session.user.id,
    display_name: playerProfile?.display_name || "Unknown",
    email: session.user.email,
    category: feedbackCategoryInput.value,
    message,
  };

  const { error } = await supabase.from("feedback").insert(payload);

  if (error) {
    throw error;
  }
}

async function loadPlayerProfile() {
  if (!supabase || !session) {
    playerProfile = null;
    playerHighScore = 0;
    return;
  }

  const userId = session.user.id;

  const [{ data: profileData }, { data: scoreData }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
    supabase.from("high_scores").select("score").eq("user_id", userId).maybeSingle(),
  ]);

  playerProfile = profileData || null;
  playerHighScore = scoreData?.score || 0;
  displayNameInput.value = playerProfile?.display_name || "";
}

async function saveDisplayName(displayName) {
  if (!supabase || !session) {
    return;
  }

  const cleaned = displayName.trim();
  if (!cleaned) {
    throw new Error("Display name is required.");
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: session.user.id,
      display_name: cleaned,
    },
    {
      onConflict: "id",
    }
  );

  if (error) {
    throw error;
  }

  playerProfile = { display_name: cleaned };
}

async function submitHighScore() {
  if (!supabase || !session || !playerProfile?.display_name) {
    return;
  }

  if (state.score <= playerHighScore) {
    return;
  }

  const payload = {
    user_id: session.user.id,
    display_name: playerProfile.display_name,
    score: state.score,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("high_scores").upsert(payload, {
    onConflict: "user_id",
  });

  if (error) {
    setAuthMessage(error.message, true);
    return;
  }

  playerHighScore = state.score;
  await loadLeaderboard();
}

async function handleSignIn(event) {
  event.preventDefault();

  if (!supabase) {
    setAuthMessage("Add your Supabase URL and anon key first.", true);
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    setAuthMessage(error.message, true);
    return;
  }

  setAuthMessage("Signed in.");
}

async function handleSignUp() {
  if (!supabase) {
    setAuthMessage("Add your Supabase URL and anon key first.", true);
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const displayName = displayNameInput.value.trim();

  if (!displayName) {
    setAuthMessage("Please choose a display name before creating an account.", true);
    return;
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    setAuthMessage(error.message, true);
    return;
  }

  if (!data.session) {
    setAuthMessage("Account created. Check your email to confirm, then sign in.");
    return;
  }

  await saveDisplayName(displayName);
  setAuthMessage("Account created and signed in.");
  await refreshForSession(data.session);
}

async function handleSignOut() {
  if (!supabase) {
    return;
  }

  await supabase.auth.signOut();
  stopLoop();
  session = null;
  playerProfile = null;
  playerHighScore = 0;
  isPaused = true;
  isAdmin = false;
  state = newGame();
  setAuthMessage("Signed out.");
  draw();
  await loadLeaderboard();
  await loadFeedbackInbox();
}

async function handleSaveName() {
  try {
    await saveDisplayName(displayNameInput.value);
    setAuthMessage("Display name saved.");
    await loadLeaderboard();
    draw();
  } catch (error) {
    setAuthMessage(error.message, true);
  }
}

async function handleFeedbackSubmit(event) {
  event.preventDefault();

  try {
    feedbackSubmitButton.disabled = true;
    feedbackCancelButton.disabled = true;
    await submitFeedback();
    feedbackForm.reset();
    feedbackCategoryInput.value = "gameplay";
    setFeedbackMessage("Thanks. Your feedback has been saved.");
    if (isAdminUser()) {
      await loadFeedbackInbox();
    }
  } catch (error) {
    setFeedbackMessage(error.message, true);
  } finally {
    feedbackSubmitButton.disabled = !canSendFeedback();
    feedbackCancelButton.disabled = false;
  }
}

async function refreshForSession(nextSession) {
  session = nextSession;
  stopLoop();
  state = newGame();
  isPaused = true;

  if (session) {
    await loadAdminStatus();
    await loadPlayerProfile();
    if (displayNameInput.value.trim() && !playerProfile?.display_name) {
      await saveDisplayName(displayNameInput.value);
    }
    setAuthMessage(`Signed in as ${session.user.email}`);
  } else {
    isAdmin = false;
    playerProfile = null;
    playerHighScore = 0;
  }

  await loadLeaderboard();
  await loadFeedbackInbox();
  draw();
}

function handleDirectionInput(name) {
  const direction = DIRECTIONS[name];
  if (direction) {
    changeDirection(direction);
  }
}

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (key === "escape" && activeModal) {
    closeModal();
    return;
  }

  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "spacebar"].includes(key)) {
    event.preventDefault();
  }

  const directionMap = {
    arrowup: "up",
    w: "up",
    arrowdown: "down",
    s: "down",
    arrowleft: "left",
    a: "left",
    arrowright: "right",
    d: "right",
  };

  if (key === "r") {
    restartGame();
    return;
  }

  if (key === "p" || key === " " || key === "spacebar") {
    togglePause();
    return;
  }

  const directionName = directionMap[key];
  if (directionName) {
    handleDirectionInput(directionName);
  }
});

authForm.addEventListener("submit", handleSignIn);
signUpButton.addEventListener("click", handleSignUp);
saveNameButton.addEventListener("click", handleSaveName);
signOutButton.addEventListener("click", handleSignOut);
playPauseButton.addEventListener("click", togglePause);
restartButton.addEventListener("click", restartGame);
instructionsOpenButton.addEventListener("click", () => openModal("instructions"));
feedbackToggleButton.addEventListener("click", () => openModal("feedback"));
feedbackInboxOpenButton.addEventListener("click", () => openModal("feedback-inbox"));
feedbackCancelButton.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", closeModal);
modalCloseButtons.forEach((button) => {
  button.addEventListener("click", closeModal);
});
leaderboardJumpButton.addEventListener("click", () => {
  leaderboardSection.scrollIntoView({ behavior: "smooth", block: "start" });
});
feedbackForm.addEventListener("submit", handleFeedbackSubmit);

touchButtons.forEach((button) => {
  button.addEventListener("click", () => {
    handleDirectionInput(button.dataset.direction);
  });
});

if (supabase) {
  supabase.auth.getSession().then(({ data }) => {
    refreshForSession(data.session);
  });

  supabase.auth.onAuthStateChange((_event, nextSession) => {
    refreshForSession(nextSession);
  });

  loadLeaderboard();
} else {
  leaderboardList.innerHTML = '<li class="muted">Add Supabase config to load the leaderboard.</li>';
  feedbackInboxList.innerHTML = '<p class="muted">Add Supabase config to load feedback.</p>';
  draw();
}
