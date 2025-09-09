/* ============================================================
   Math Solver Game — Shared Script (no frameworks)
   Pages: index.html (start), question.html (quiz), result.html
   ============================================================ */

const STORAGE = {
  username: "msg_username",
  score: "msg_score",
  leaderboard: "msg_leaderboard",
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
  const level = localStorage.getItem("msg_level") || "easy";
  const multiplier = level === "easy" ? 1 : level === "medium" ? 2 : 3;
  const current = getScore();
  localStorage.setItem(STORAGE.score, String(current + multiplier));
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

// Audio
const soundCorrect = new Audio("correct.mp3");
const soundWrong = new Audio("wrong.mp3");

// PlayBeep jadi versi pake file
function playBeep(type) {
    if (type === "ok") {
        soundCorrect.currentTime = 0;
        soundCorrect.play();
    } else if (type === "bad") {
        soundWrong.currentTime = 0;
        soundWrong.play();
    }
}


/* ---------- Start Page ---------- */
function initStart() {
  const input = document.getElementById("username");
  const btn = document.getElementById("playBtn");
  const levelButtons = {
    easy: document.getElementById("levelEasy"),
    medium: document.getElementById("levelMedium"),
    hard: document.getElementById("levelHard")
  };

  let selectedLevel = localStorage.getItem("msg_level") || "easy";

  // Pre-fill if we have a name
  const existing = getName();
  if (existing) input.value = existing;

  // Highlight selected level
  function updateLevelSelection() {
    Object.values(levelButtons).forEach(el => {
      el.classList.remove("btn-secondary");
      el.classList.add("btn-primary");
    });
    levelButtons[selectedLevel].classList.remove("btn-primary");
    levelButtons[selectedLevel].classList.add("btn-secondary");
    btn.disabled = false;
  }

  // Set default
  updateLevelSelection();

  // Event listeners for level selection
  levelButtons.easy.addEventListener("click", () => {
    selectedLevel = "easy";
    localStorage.setItem("msg_level", selectedLevel);
    updateLevelSelection();
  });
  levelButtons.medium.addEventListener("click", () => {
    selectedLevel = "medium";
    localStorage.setItem("msg_level", selectedLevel);
    updateLevelSelection();
  });
  levelButtons.hard.addEventListener("click", () => {
    selectedLevel = "hard";
    localStorage.setItem("msg_level", selectedLevel);
    updateLevelSelection();
  });

  btn.addEventListener("click", () => {
    const name = input.value.trim();
    if (!name) {
      input.focus();
      input.classList.add("flash-wrong");
      setTimeout(() => input.classList.remove("flash-wrong"), 500);
      playBeep("bad");
      return;
    }
    saveName(name);
    resetScore();
    playBeep("ok");
    setTimeout(() => goToQuestion(1), 150);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !btn.disabled) btn.click();
  });
}

/* ---------- Question Generation ---------- */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function generateQuestion(level = "easy") {
  let a, b, questionText, correct, op;

  if (level === "easy") {
    const ops = ["+", "-"];
    op = ops[randomInt(0, ops.length - 1)];
    a = randomInt(1, 20);
    b = randomInt(1, 20);
    if (op === "-" && b > a) [a, b] = [b, a];
    correct = op === "+" ? a + b : a - b;
    questionText = `${a} ${op} ${b} = ?`;

  } else if (level === "medium") {
    const ops = ["×", "÷", "^"];
    op = ops[randomInt(0, ops.length - 1)];

    if (op === "×") {
      a = randomInt(1, 12);
      b = randomInt(1, 12);
      correct = a * b;
    } else if (op === "÷") {
      b = randomInt(1, 12);
      const q = randomInt(1, 12);
      a = b * q;
      correct = q;
    } else if (op === "^") {
      a = randomInt(2, 5);
      b = randomInt(2, 4);
      correct = Math.pow(a, b);
    }
    questionText = op === "^" ? `${a}<sup>${b}</sup> = ?` : `${a} ${op} ${b} = ?`;

  } else if (level === "hard") {
    const types = ["decimal", "fraction"];
    const type = types[randomInt(0, types.length - 1)];

    if (type === "decimal") {
      const ops = ["+", "-"];
      op = ops[randomInt(0, 1)];
      a = parseFloat((randomInt(1, 15) + randomInt(10, 99) / 100).toFixed(2));
      b = parseFloat((randomInt(1, 15) + randomInt(10, 99) / 100).toFixed(2));
      if (op === "-" && b > a) [a, b] = [b, a];
      correct = op === "+" ? a + b : a - b;
      correct = parseFloat(correct.toFixed(2));
      questionText = `${a} ${op} ${b} = ?`;

    } else if (type === "fraction") {
      const denom = randomInt(2, 8);
      const num1 = randomInt(1, denom - 1);
      const num2 = randomInt(1, denom - 1);
      op = "+";
      const totalNum = num1 + num2;
      let simplifiedNum = totalNum;
      let simplifiedDenom = denom;
      const g = gcd(totalNum, denom);
      if (g > 1) {
        simplifiedNum = totalNum / g;
        simplifiedDenom = denom / g;
      }
      questionText = `${num1}/${denom} + ${num2}/${denom} = ?`;
      correct = simplifiedDenom === 1 ? simplifiedNum : `${simplifiedNum}/${simplifiedDenom}`;
    }
  }

  // Build 4 unique choices
  const choices = new Set();
  choices.add(correct);

  function addDistractor() {
    if (typeof correct === "string" && correct.includes("/")) {
      const [n, d] = correct.split("/").map(Number);
      if (isNaN(d)) return;
      let delta = randomInt(-2, 2);
      if (delta === 0) delta = 1;
      let newN = n + delta;
      if (newN > 0 && newN < d * 3) {
        let sn = newN, sd = d;
        const g = gcd(sn, sd);
        if (g > 1) { sn /= g; sd /= g; }
        choices.add(sd === 1 ? sn : `${sn}/${sd}`);
      }
    } else {
      let delta = randomInt(1, 6) * (Math.random() < 0.5 ? 1 : -1);
      let candidate = typeof correct === "number" ? correct + delta : correct;
      if (typeof candidate === "number") {
        if (level === "hard" && typeof correct === "number" && String(correct).includes(".")) {
          candidate = parseFloat(candidate.toFixed(2));
        }
        if (!isNaN(candidate) && candidate >= 0) choices.add(candidate);
      }
    }
  }

  while (choices.size < 4) {
    addDistractor();
    if (choices.size < 4) {
      if (typeof correct === "number") {
        choices.add(randomInt(0, level === "hard" ? 30 : 50));
      } else if (typeof correct === "string") {
        choices.add("0");
      }
    }
  }

  // Convert to array & shuffle
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

  const level = localStorage.getItem("msg_level") || "easy";

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
  progressText.textContent = `Question ${number} / ${TOTAL_QUESTIONS} • Level: ${level.toUpperCase()}`;

  // Generate & render
  const { questionText, correctAnswer, options } = generateQuestion(level);
  questionBox.innerHTML = questionText; // innerHTML for <sup> support

  choiceButtons.forEach((btn, i) => {
    btn.classList.remove("correct", "wrong");
    btn.querySelector(".choice-text").textContent = options[i];
    btn.disabled = false;
  });

  let locked = false;
  function handleChoice(btn, value) {
    if (locked) return;
    locked = true;
    const isCorrect = String(value) === String(correctAnswer);

    btn.classList.add(isCorrect ? "correct" : "wrong");
    document.querySelector(".card").classList.add(isCorrect ? "flash-correct" : "flash-wrong");
    isCorrect ? playBeep("ok") : playBeep("bad");

    if (isCorrect) {
      addPoint();
      scoreLabel.textContent = getScore();
    }

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
  const level = localStorage.getItem("msg_level") || "easy";

  document.getElementById("finalUser").textContent = user;
  animateCount(document.getElementById("finalScore"), 0, score, 600);

  // Tampilkan level di hasil
  const levelDisplay = document.createElement("p");
  levelDisplay.innerHTML = `<strong>🎯 Level Completed:</strong> ${level.toUpperCase()}`;
  levelDisplay.style.marginTop = "8px";
  levelDisplay.style.fontSize = "16px";
  levelDisplay.style.color = "#b8c1ff";
  document.querySelector(".final-score").after(levelDisplay);

  saveToLeaderboard(user, score);
  renderLeaderboard();

  document.getElementById("playAgainBtn").addEventListener("click", () => {
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

/* ---------- Leaderboard Functions ---------- */
function saveToLeaderboard(name, score) {
  if (name.trim().toLowerCase() === "player") {
    console.warn('Default name "Player" is not allowed on the leaderboard.');
    return;
  }

  // ✅ GLOBAL — tidak pakai level
  let board = JSON.parse(localStorage.getItem(STORAGE.leaderboard) || "[]");
  const existingIndex = board.findIndex(entry => entry.name === name);

  if (existingIndex !== -1) {
    if (score > board[existingIndex].score) {
      board[existingIndex].score = score;
    }
  } else {
    board.push({ name, score });
  }

  // ✅ SORT DESC + SLICE 10 — sesuai revisi temanmu
  board.sort((a, b) => b.score - a.score);
  board = board.slice(0, 10);

  localStorage.setItem(STORAGE.leaderboard, JSON.stringify(board));
}

function renderLeaderboard() {
  const tbody = document.querySelector("#leaderboardTable tbody");
  tbody.innerHTML = "";

  // ✅ Ambil leaderboard GLOBAL
  const board = JSON.parse(localStorage.getItem(STORAGE.leaderboard) || "[]");

  // ✅ Judul tetap "Leaderboard" — tanpa level
  document.querySelector(".leaderboard h3").textContent = `🏆 Leaderboard`;

  board.forEach((entry, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${entry.name}</td>
      <td>${entry.score}</td>
    `;
    tbody.appendChild(tr);
  });
}

