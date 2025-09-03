/* ============================================================
   Math Solver Game — Shared Script (no frameworks)
   Pages: index.html (start), question.html (quiz), result.html
   ============================================================ */

const STORAGE = {
  username: "msg_username",
  score: "msg_score",
};
const TOTAL_QUESTIONS = 10;

// Simple router by data-page attribute
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.getAttribute("data-page");
  if (page === "start") initStart();
  if (page === "question") initQuestion();
  if (page === "result") initResult();
});

/* ---------- Utils ---------- */
function saveName(name) {
  localStorage.setItem(STORAGE.username, name.trim());
}
function getName() {
  return localStorage.getItem(STORAGE.username) || "";
}
function resetScore() {
  localStorage.setItem(STORAGE.score, "0");
}
function getScore() {
  return parseInt(localStorage.getItem(STORAGE.score) || "0", 10);
}
function addPoint() {
  localStorage.setItem(STORAGE.score, String(getScore() + 1));
}
function getQueryNumber() {
  const url = new URL(window.location.href);
  const n = parseInt(url.searchParams.get("number") || "1", 10);
  return Number.isNaN(n) ? 1 : Math.max(1, n);
}
function goToQuestion(n) {
  window.location.href = `question.html?number=${n}`;
}
function goToResult() {
  window.location.href = `result.html`;
}
function goToStart() {
  window.location.href = `index.html`;
}

/* ---------- Tiny Sound FX via WebAudio (optional, no assets) ---------- */
let audioCtx;
function playBeep(type = "ok") {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "sine";
    o.frequency.value = type === "ok" ? 880 : 180; // hi = correct, low = wrong
    g.gain.setValueAtTime(type === "ok" ? 0.06 : 0.08, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.25);
    o.connect(g).connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + 0.25);
  } catch { /* ignore */ }
}

/* ---------- Start Page ---------- */
function initStart() {
  const input = document.getElementById("username");
  const btn = document.getElementById("playBtn");

  // Pre-fill if we have a name
  const existing = getName();
  if (existing) input.value = existing;

  btn.addEventListener("click", () => {
    const name = input.value.trim();
    if (!name) {
      // playful nudge
      input.focus();
      input.classList.add("flash-wrong");
      setTimeout(() => input.classList.remove("flash-wrong"), 500);
      playBeep("bad");
      return;
    }
    saveName(name);
    resetScore();
    playBeep("ok");
    // Small delay for feedback
    setTimeout(() => goToQuestion(1), 150);
  });

  // Enter to submit
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") btn.click();
  });
}

/* ---------- Question Generation ---------- */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate a clean integer division; otherwise ensure op with 1..20
function generateQuestion() {
  const ops = ["+", "-", "×", "÷"];
  const op = ops[randomInt(0, ops.length - 1)];

  let a, b, questionText, correct;

  if (op === "÷") {
    // Ensure divisible integers within 1..20
    // Try a few times to get a divisible pair a ÷ b where a,b in [1,20]
    for (let tries = 0; tries < 50; tries++) {
      b = randomInt(1, 20);
      a = randomInt(1, 20);
      if (a % b === 0) break;
    }
    // If still not divisible, force a = b * q
    if (a % b !== 0) {
      b = randomInt(1, 10);
      const q = randomInt(1, 10);
      a = b * q;
    }
    correct = a / b;
  } else if (op === "×") {
    a = randomInt(1, 12);
    b = randomInt(1, 12);
    correct = a * b;
  } else if (op === "-") {
    a = randomInt(1, 20);
    b = randomInt(1, 20);
    if (b > a) [a, b] = [b, a]; // avoid negatives
    correct = a - b;
  } else {
    a = randomInt(1, 20);
    b = randomInt(1, 20);
    correct = a + b;
  }

  questionText = `${a} ${op} ${b} = ?`;

  // Build 3 unique distractors
  const choices = new Set([correct]);
  while (choices.size < 4) {
    let delta = randomInt(-6, 6);
    if (delta === 0) delta = 1;
    const candidate = correct + delta * (Math.random() < 0.5 ? 1 : -1);
    // Keep integers and non-negative
    if (Number.isInteger(candidate) && candidate >= 0) choices.add(candidate);
  }

  // Shuffle
  const arr = Array.from(choices);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return { questionText, correctAnswer: correct, options: arr };
}

/* ---------- Question Page ---------- */
function initQuestion() {
  const username = getName();
  if (!username) {
    goToStart();
    return;
  }

  const number = getQueryNumber();
  if (!localStorage.getItem(STORAGE.score)) resetScore();

  // UI bindings
  const userNameLabel = document.getElementById("userNameLabel");
  const scoreLabel = document.getElementById("scoreLabel");
  const questionBox = document.getElementById("questionBox");
  const choiceButtons = Array.from(document.querySelectorAll(".choice-btn"));
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");

  userNameLabel.textContent = username;
  scoreLabel.textContent = getScore();

  // Progress
  const pct = Math.min(100, Math.round((number - 1) / TOTAL_QUESTIONS * 100));
  progressBar.style.width = `${pct}%`;
  progressText.textContent = `Question ${number} / ${TOTAL_QUESTIONS}`;

  // Generate & render
  const { questionText, correctAnswer, options } = generateQuestion();
  questionBox.textContent = questionText;

  choiceButtons.forEach((btn, i) => {
    btn.classList.remove("correct", "wrong");
    btn.querySelector(".choice-text").textContent = options[i];
    btn.disabled = false;
  });

  let locked = false;
  function handleChoice(btn, value) {
    if (locked) return;
    locked = true;
    const isCorrect = Number(value) === Number(correctAnswer);

    // Visual feedback
    btn.classList.add(isCorrect ? "correct" : "wrong");
    document.querySelector(".card").classList.add(isCorrect ? "flash-correct" : "flash-wrong");
    isCorrect ? playBeep("ok") : playBeep("bad");

    // Score update
    if (isCorrect) {
      addPoint();
      scoreLabel.textContent = getScore();
    }

    // Short pause then go next
    setTimeout(() => {
      const next = number + 1;
      if (next <= TOTAL_QUESTIONS) goToQuestion(next);
      else goToResult();
    }, 650);
  }

  choiceButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      handleChoice(btn, btn.querySelector(".choice-text").textContent);
    });
  });
}

/* ---------- Result Page ---------- */
function initResult() {
  const user = getName() || "Player";
  const score = getScore();

  document.getElementById("finalUser").textContent = user;
  // Animate counting up for fun
  const target = document.getElementById("finalScore");
  animateCount(target, 0, score, 600);

  const playAgainBtn = document.getElementById("playAgainBtn");
  playAgainBtn.addEventListener("click", () => {
    resetScore();
    playBeep("ok");
    setTimeout(() => goToStart(), 150);
  });
}

function animateCount(el, from, to, duration = 500) {
  const start = performance.now();
  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const val = Math.round(from + (to - from) * easeOutCubic(t));
    el.textContent = val;
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function initResult() {
  const user = getName() || "Player";
  const score = getScore();

  document.getElementById("finalUser").textContent = user;
  animateCount(document.getElementById("finalScore"), 0, score, 600);

  saveToLeaderboard(user, score);
  renderLeaderboard();

  document.getElementById("playAgainBtn").addEventListener("click", () => {
    resetScore();
    playBeep("ok");
    setTimeout(() => goToStart(), 150);
  });
}

