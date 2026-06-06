// DK-Knight Badminton - Roster & Stats Manager JS Logic

// --- SEED DATA ---
const SEED_PLAYERS = [
  {
    id: "p-1",
    name: "อเล็กซ์ แทน",
    phone: "+66 81 555 1234",
    email: "alex.tan@dkknight.com",
    skill: "intermediate",
    style: "doubles",
    hand: "right",
    status: "active",
    matchesWon: 12,
    matchesPlayed: 18,
    notes: "ควบคุมลูกหน้าเน็ตได้ดี เกมรับเหนียวแน่น ชอบเล่นประเภทคู่",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    attributes: { pace: 74, power: 68, control: 78, defense: 76, stamina: 72, tactics: 75 }
  },
  {
    id: "p-2",
    name: "การัน สิงห์",
    phone: "+66 82 444 5678",
    email: "karan.singh@dkknight.com",
    skill: "elite",
    style: "all",
    hand: "right",
    status: "active",
    matchesWon: 24,
    matchesPlayed: 30,
    notes: "เล่นเกมบุกดุดัน ตบหนัก แรงดีและฟุตเวิร์กเยี่ยม อดีตนักกีฬาตัวมหาวิทยาลัย",
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    attributes: { pace: 88, power: 92, control: 84, defense: 80, stamina: 90, tactics: 86 }
  },
  {
    id: "p-3",
    name: "ซาร่าห์ เชน",
    phone: "+66 89 777 9900",
    email: "sarah.chen@dkknight.com",
    skill: "advanced",
    style: "singles",
    hand: "left",
    status: "active",
    matchesWon: 16,
    matchesPlayed: 20,
    notes: "ลูกหยอดหลอกหน้าเน็ตดีมาก ถนัดซ้ายทำให้คู่แข่งรับมุมส่งลูกยาก",
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    attributes: { pace: 82, power: 72, control: 90, defense: 82, stamina: 78, tactics: 88 }
  },
  {
    id: "p-4",
    name: "แดนนี่ เค.",
    phone: "+66 85 111 2222",
    email: "danny.k@dkknight.com",
    skill: "intermediate",
    style: "mixed",
    hand: "right",
    status: "injured",
    matchesWon: 8,
    matchesPlayed: 15,
    notes: "กำลังฟื้นตัวจากอาการข้อเท้าแพลงเล็กน้อย เล่นเซฟ ปูทางให้คู่หูเข้าทำได้ดี",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    attributes: { pace: 68, power: 74, control: 72, defense: 70, stamina: 68, tactics: 76 }
  },
  {
    id: "p-5",
    name: "ริว ซูซูกิ",
    phone: "+66 86 999 8888",
    email: "ryu.suzuki@dkknight.com",
    skill: "beginner",
    style: "doubles",
    hand: "right",
    status: "inactive",
    matchesWon: 2,
    matchesPlayed: 10,
    notes: "กำลังพัฒนาฟุตเวิร์ก เข้าขากับคู่หูที่มีประสบการณ์ได้ดี",
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    attributes: { pace: 64, power: 58, control: 62, defense: 60, stamina: 65, tactics: 58 }
  }
];

const SEED_MATCHES = [
  {
    id: "m-1",
    player1Id: "p-2",
    player2Id: "p-3",
    score1: 21,
    score2: 19,
    winnerId: "p-2",
    notes: "เกมเดี่ยวความเข้มข้นสูง",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "m-2",
    player1Id: "p-1",
    player2Id: "p-4",
    score1: 21,
    score2: 15,
    winnerId: "p-1",
    notes: "เกมซ้อมเล่นเดี่ยว",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// --- APP STATE ---
let players = [];
let matches = [];
let sortColumn = "name";
let sortDirection = "asc"; // 'asc' or 'desc'

// Skill Levels Rank Order for sorting
const SKILL_RANKS = {
  novice: 1,
  beginner: 2,
  intermediate: 3,
  advanced: 4,
  elite: 5
};

// Status Order for sorting
const STATUS_RANKS = {
  active: 1,
  injured: 2,
  inactive: 3
};

// Thai translations for labels
const SKILL_LABELS = {
  novice: "มือใหม่หัดเล่น (Novice)",
  beginner: "มือใหม่ (Beginner)",
  intermediate: "มือกลาง (Intermediate)",
  advanced: "มือระดับสูง (Advanced)",
  elite: "มืออาชีพ/โปร (Elite)"
};

const STYLE_LABELS = {
  singles: "เดี่ยว",
  doubles: "คู่",
  mixed: "คู่ผสม",
  all: "เล่นได้ทุกแบบ (All-Rounder)"
};

const STATUS_LABELS = {
  active: "พร้อมเล่น",
  injured: "บาดเจ็บ",
  inactive: "ไม่พร้อมเล่น"
};

// --- DOM ELEMENTS ---
// Table elements
const playerTableBody = document.getElementById("playerTableBody");
const tableEmptyState = document.getElementById("tableEmptyState");
const tableHeaders = document.querySelectorAll("thead th[data-sort]");

// Filter elements
const searchInput = document.getElementById("searchInput");
const filterSkill = document.getElementById("filterSkill");
const filterStyle = document.getElementById("filterStyle");
const filterHand = document.getElementById("filterHand");
const filterStatus = document.getElementById("filterStatus");

// Dashboard elements
const statTotalPlayers = document.getElementById("stat-total-players");
const statActivePlayers = document.getElementById("stat-active-players");
const statInjuredText = document.getElementById("stat-injured-text");
const statTotalMatches = document.getElementById("stat-total-matches");
const statAvgWinRate = document.getElementById("stat-avg-winrate");
const statTopPlayerText = document.getElementById("stat-top-player-text");

// Modal elements: Player Add/Edit
const playerModal = document.getElementById("playerModal");
const playerModalTitle = document.getElementById("playerModalTitle");
const playerForm = document.getElementById("playerForm");
const editPlayerId = document.getElementById("editPlayerId");
const playerNameInput = document.getElementById("playerName");
const playerPhoneInput = document.getElementById("playerPhone");
const playerEmailInput = document.getElementById("playerEmail");
const playerSkillSelect = document.getElementById("playerSkill");
const playerStyleSelect = document.getElementById("playerStyle");
const playerHandSelect = document.getElementById("playerHand");
const playerStatusSelect = document.getElementById("playerStatus");
const playerWonInput = document.getElementById("playerMatchesWon");
const playerPlayedInput = document.getElementById("playerMatchesPlayed");
const playerNotesInput = document.getElementById("playerNotes");

// Player Attributes Range Elements & Val span tags
const attrPace = document.getElementById("attrPace");
const valPace = document.getElementById("valPace");
const attrPower = document.getElementById("attrPower");
const valPower = document.getElementById("valPower");
const attrControl = document.getElementById("attrControl");
const valControl = document.getElementById("valControl");
const attrDefense = document.getElementById("attrDefense");
const valDefense = document.getElementById("valDefense");
const attrStamina = document.getElementById("attrStamina");
const valStamina = document.getElementById("valStamina");
const attrTactics = document.getElementById("attrTactics");
const valTactics = document.getElementById("valTactics");

// Modal buttons: Player
const btnAddPlayer = document.getElementById("btnAddPlayer");
const btnCancelPlayer = document.getElementById("btnCancelPlayer");
const btnSavePlayer = document.getElementById("btnSavePlayer");
const btnClosePlayerModal = document.getElementById("btnClosePlayerModal");

// Modal elements: Match
const matchModal = document.getElementById("matchModal");
const matchForm = document.getElementById("matchForm");
const matchPlayer1Select = document.getElementById("matchPlayer1");
const matchPlayer2Select = document.getElementById("matchPlayer2");
const matchScore1Input = document.getElementById("matchScore1");
const matchScore2Input = document.getElementById("matchScore2");
const matchNotesInput = document.getElementById("matchNotes");

// Modal buttons: Match
const btnRecordMatch = document.getElementById("btnRecordMatch");
const btnCancelMatch = document.getElementById("btnCancelMatch");
const btnSaveMatch = document.getElementById("btnSaveMatch");
const btnCloseMatchModal = document.getElementById("btnCloseMatchModal");

// Modal elements: Player Profile
const profileModal = document.getElementById("profileModal");
const btnCloseProfileModal = document.getElementById("btnCloseProfileModal");
const btnCloseProfile = document.getElementById("btnCloseProfile");

// Profile data tags
const profName = document.getElementById("profName");
const profOvr = document.getElementById("profOvr");
const profStyle = document.getElementById("profStyle");
const profHand = document.getElementById("profHand");
const profPac = document.getElementById("profPac");
const profPwr = document.getElementById("profPwr");
const profCtl = document.getElementById("profCtl");
const profDef = document.getElementById("profDef");
const profSta = document.getElementById("profSta");
const profTac = document.getElementById("profTac");
const profMatchesPlayed = document.getElementById("profMatchesPlayed");
const profMatchesWon = document.getElementById("profMatchesWon");
const profWinRate = document.getElementById("profWinRate");
const profRecentForm = document.getElementById("profRecentForm");
const profRemarks = document.getElementById("profRemarks");
const radarSvg = document.getElementById("radarSvg");
const profileFutCard = document.getElementById("profileFutCard");

// CSV backup elements
const btnExportCsv = document.getElementById("btnExportCsv");
const csvFileInput = document.getElementById("csvFileInput");

// Toast Container
const toastContainer = document.getElementById("toastContainer");

// Theme Toggle
const btnThemeToggle = document.getElementById("btnThemeToggle");

// --- TAB CONTROLS ---
const tabRoster = document.getElementById("tabRoster");
const tabCalendar = document.getElementById("tabCalendar");
const viewRoster = document.getElementById("viewRoster");
const viewCalendar = document.getElementById("viewCalendar");

// --- CALENDAR DOM ELEMENTS ---
const btnPrevMonth = document.getElementById("btnPrevMonth");
const btnNextMonth = document.getElementById("btnNextMonth");
const calendarMonthTitle = document.getElementById("calendarMonthTitle");
const calendarGrid = document.getElementById("calendarGrid");
const selectedDateTitle = document.getElementById("selectedDateTitle");
const btnAddActivity = document.getElementById("btnAddActivity");
const activityDropdown = document.getElementById("activityDropdown");
const menuRecordMatch = document.getElementById("menuRecordMatch");
const menuRecordTraining = document.getElementById("menuRecordTraining");
const dayEventsList = document.getElementById("dayEventsList");

// --- TRAINING MODAL DOM ELEMENTS ---
const trainingModal = document.getElementById("trainingModal");
const trainingForm = document.getElementById("trainingForm");
const editTrainingId = document.getElementById("editTrainingId");
const trainingPlayerSelect = document.getElementById("trainingPlayer");
const trainingDateInput = document.getElementById("trainingDate");
const trainingCoachInput = document.getElementById("trainingCoach");
const trainingDurationInput = document.getElementById("trainingDuration");
const trainingTopicInput = document.getElementById("trainingTopic");
const trainingIntensityInput = document.getElementById("trainingIntensity");
const valIntensity = document.getElementById("valIntensity");
const trainingScoreInput = document.getElementById("trainingScore");
const valTrainingScore = document.getElementById("valTrainingScore");
const trainingBeforeLevelInput = document.getElementById("trainingBeforeLevel");
const valBeforeLevel = document.getElementById("valBeforeLevel");
const trainingAfterLevelInput = document.getElementById("trainingAfterLevel");
const valAfterLevel = document.getElementById("valAfterLevel");
const trainingAttendanceSelect = document.getElementById("trainingAttendance");
const trainingNextDateInput = document.getElementById("trainingNextDate");
const trainingFeedbackInput = document.getElementById("trainingFeedback");
const trainingHomeworkInput = document.getElementById("trainingHomework");
const trainingImprovementInput = document.getElementById("trainingImprovement");

// Training Modal Buttons
const btnCancelTraining = document.getElementById("btnCancelTraining");
const btnSaveTraining = document.getElementById("btnSaveTraining");
const btnCloseTrainingModal = document.getElementById("btnCloseTrainingModal");

// --- CALENDAR STATE ---
let trainings = [];
let currentDate = new Date();
let selectedDate = new Date();

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];


// --- INITIALIZATION ---
async function initApp() {
  initTheme();
  await loadData();
  setupEventListeners();
  setupSliders();
  updateDashboard();
  renderTable();
}

// --- THEME MANAGEMENT ---
function initTheme() {
  const savedTheme = localStorage.getItem("dk_theme") || "dark";
  if (savedTheme === "light") {
    document.body.classList.add("light-mode");
    if (btnThemeToggle) btnThemeToggle.textContent = "🌙";
  } else {
    document.body.classList.remove("light-mode");
    if (btnThemeToggle) btnThemeToggle.textContent = "☀️";
  }
}

// Load data from Express Excel backend, falling back to LocalStorage
async function loadData() {
  try {
    console.log("Attempting to load data from Excel backend...");
    const res = await fetch("/api/data");
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    players = data.players;
    matches = data.matches;
    trainings = data.trainings || [];
    console.log("Successfully loaded data from Excel database.");
    
    // Cache to local storage as fallback
    localStorage.setItem("dk_players", JSON.stringify(players));
    localStorage.setItem("dk_matches", JSON.stringify(matches));
    localStorage.setItem("dk_trainings", JSON.stringify(trainings));
  } catch (e) {
    console.warn("Could not load from Excel backend. Falling back to local storage:", e.message);
    const storedPlayers = localStorage.getItem("dk_players");
    const storedMatches = localStorage.getItem("dk_matches");
    const storedTrainings = localStorage.getItem("dk_trainings");

    if (storedPlayers) {
      players = JSON.parse(storedPlayers);
      // Automatically migrate English seed data to Thai
      players.forEach(p => {
        if (p.id === "p-1" && p.name === "Alex Tan") {
          p.name = "อเล็กซ์ แทน";
          p.notes = "ควบคุมลูกหน้าเน็ตได้ดี เกมรับเหนียวแน่น ชอบเล่นประเภทคู่";
        } else if (p.id === "p-2" && p.name === "Karan Singh") {
          p.name = "การัน สิงห์";
          p.notes = "เล่นเกมบุกดุดัน ตบหนัก แรงดีและฟุตเวิร์กเยี่ยม อดีตนักกีฬาตัวมหาวิทยาลัย";
        } else if (p.id === "p-3" && p.name === "Sarah Chen") {
          p.name = "ซาร่าห์ เชน";
          p.notes = "ลูกหยอดหลอกหน้าเน็ตดีมาก ถนัดซ้ายทำให้คู่แข่งรับมุมส่งลูกยาก";
        } else if (p.id === "p-4" && p.name === "Danny K.") {
          p.name = "แดนนี่ เค.";
          p.notes = "กำลังฟื้นตัวจากอาการข้อเท้าแพลงเล็กน้อย เล่นเซฟ ปูทางให้คู่หูเข้าทำได้ดี";
        } else if (p.id === "p-5" && p.name === "Ryu Suzuki") {
          p.name = "ริว ซูซูกิ";
          p.notes = "กำลังพัฒนาฟุตเวิร์ก เข้าขากับคู่หูที่มีประสบการณ์ได้ดี";
        }
      });
      localStorage.setItem("dk_players", JSON.stringify(players));
    } else {
      players = [...SEED_PLAYERS];
      localStorage.setItem("dk_players", JSON.stringify(players));
    }

    if (storedMatches) {
      matches = JSON.parse(storedMatches);
      matches.forEach(m => {
        if (m.id === "m-1" && m.notes === "High intensity singles match.") {
          m.notes = "เกมเดี่ยวความเข้มข้นสูง";
        } else if (m.id === "m-2" && m.notes === "Practice singles match.") {
          m.notes = "เกมซ้อมเล่นเดี่ยว";
        }
      });
      localStorage.setItem("dk_matches", JSON.stringify(matches));
    } else {
      matches = [...SEED_MATCHES];
      localStorage.setItem("dk_matches", JSON.stringify(matches));
    }

    if (storedTrainings) {
      trainings = JSON.parse(storedTrainings);
    } else {
      trainings = [];
    }
  }
}

async function savePlayersToServer() {
  try {
    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(players)
    });
    if (!res.ok) throw new Error("Server rejected save");
    console.log("Successfully synced players with Excel database.");
  } catch (e) {
    console.error("Failed to sync players with Excel:", e.message);
  }
}

async function saveMatchesToServer() {
  try {
    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(matches)
    });
    if (!res.ok) throw new Error("Server rejected save");
    console.log("Successfully synced matches with Excel database.");
  } catch (e) {
    console.error("Failed to sync matches with Excel:", e.message);
  }
}

async function saveTrainingsToServer() {
  try {
    const res = await fetch("/api/trainings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trainings)
    });
    if (!res.ok) throw new Error("Server rejected save");
    console.log("Successfully synced trainings with Excel database.");
  } catch (e) {
    console.error("Failed to sync trainings with Excel:", e.message);
  }
}

function savePlayersToStorage() {
  localStorage.setItem("dk_players", JSON.stringify(players));
  savePlayersToServer();
}

function saveMatchesToStorage() {
  localStorage.setItem("dk_matches", JSON.stringify(matches));
  saveMatchesToServer();
}

function saveTrainingsToStorage() {
  localStorage.setItem("dk_trainings", JSON.stringify(trainings));
  saveTrainingsToServer();
}

// Link range slider inputs to display values
function setupSliders() {
  const sliders = [
    { input: attrPace, val: valPace },
    { input: attrPower, val: valPower },
    { input: attrControl, val: valControl },
    { input: attrDefense, val: valDefense },
    { input: attrStamina, val: valStamina },
    { input: attrTactics, val: valTactics },
    { input: trainingIntensityInput, val: valIntensity },
    { input: trainingScoreInput, val: valTrainingScore },
    { input: trainingBeforeLevelInput, val: valBeforeLevel },
    { input: trainingAfterLevelInput, val: valAfterLevel }
  ];

  sliders.forEach(s => {
    if (s.input && s.val) {
      s.input.addEventListener("input", () => {
        s.val.textContent = s.input.value;
      });
    }
  });
}

// --- DASHBOARD RENDER ---
function updateDashboard() {
  // 1. Total players
  statTotalPlayers.textContent = players.length;

  // 2. Active, injured, inactive counts
  const activeCount = players.filter(p => p.status === "active").length;
  const injuredCount = players.filter(p => p.status === "injured").length;
  const inactiveCount = players.filter(p => p.status === "inactive").length;
  
  statActivePlayers.textContent = activeCount;
  statInjuredText.textContent = `บาดเจ็บ ${injuredCount}, ไม่พร้อมเล่น ${inactiveCount}`;

  // 3. Total Matches Logged
  statTotalMatches.textContent = matches.length;

  // 4. Team Average Win Rate
  let totalWon = 0;
  let totalPlayed = 0;
  
  players.forEach(p => {
    totalWon += Number(p.matchesWon || 0);
    totalPlayed += Number(p.matchesPlayed || 0);
  });

  const avgWinRate = totalPlayed > 0 ? Math.round((totalWon / totalPlayed) * 100) : 0;
  statAvgWinRate.textContent = `${avgWinRate}%`;

  // Find Top Player (highest win rate with at least 5 matches played, or just maximum played if no one has 5)
  const ratedPlayers = players
    .filter(p => p.matchesPlayed > 0)
    .map(p => ({
      name: p.name,
      played: p.matchesPlayed,
      rate: (p.matchesWon / p.matchesPlayed) * 100
    }));

  if (ratedPlayers.length > 0) {
    // Sort by win rate desc, then by matches played desc
    ratedPlayers.sort((a, b) => b.rate - a.rate || b.played - a.played);
    const top = ratedPlayers[0];
    statTopPlayerText.textContent = `อันดับ 1: ${top.name} (${top.rate.toFixed(1)}% อัตราชนะ)`;
  } else {
    statTopPlayerText.textContent = "ยังไม่มีบันทึกข้อมูลผู้เล่น";
  }
}

// --- TABLE RENDER ---
function renderTable() {
  const query = searchInput.value.toLowerCase().trim();
  const skill = filterSkill.value;
  const style = filterStyle.value;
  const hand = filterHand.value;
  const status = filterStatus.value;

  // Filter Players
  let filteredPlayers = players.filter(player => {
    // Search filter
    const matchesSearch = 
      player.name.toLowerCase().includes(query) || 
      (player.phone && player.phone.includes(query)) ||
      (player.email && player.email.toLowerCase().includes(query)) ||
      (player.notes && player.notes.toLowerCase().includes(query));

    // Dropdown filters
    const matchesSkill = !skill || player.skill === skill;
    const matchesStyle = !style || player.style === style;
    const matchesHand = !hand || player.hand === hand;
    const matchesStatus = !status || player.status === status;

    return matchesSearch && matchesSkill && matchesStyle && matchesHand && matchesStatus;
  });

  // Sort Players
  filteredPlayers.sort((a, b) => {
    let comparison = 0;
    
    if (sortColumn === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortColumn === "skill") {
      comparison = SKILL_RANKS[a.skill] - SKILL_RANKS[b.skill];
    } else if (sortColumn === "style") {
      comparison = a.style.localeCompare(b.style);
    } else if (sortColumn === "hand") {
      comparison = a.hand.localeCompare(b.hand);
    } else if (sortColumn === "matches") {
      comparison = a.matchesPlayed - b.matchesPlayed;
    } else if (sortColumn === "winrate") {
      const rateA = a.matchesPlayed > 0 ? (a.matchesWon / a.matchesPlayed) : 0;
      const rateB = b.matchesPlayed > 0 ? (b.matchesWon / b.matchesPlayed) : 0;
      comparison = rateA - rateB;
    } else if (sortColumn === "status") {
      comparison = STATUS_RANKS[a.status] - STATUS_RANKS[b.status];
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Render rows
  playerTableBody.innerHTML = "";

  if (filteredPlayers.length === 0) {
    tableEmptyState.style.display = "block";
    return;
  }

  tableEmptyState.style.display = "none";

  filteredPlayers.forEach(player => {
    const winRate = player.matchesPlayed > 0 ? Math.round((player.matchesWon / player.matchesPlayed) * 100) : 0;
    const initials = player.name
      .split(" ")
      .map(n => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    const tr = document.createElement("tr");
    tr.id = `row-${player.id}`;
    tr.innerHTML = `
      <td>
        <div class="player-identity">
          <div class="player-avatar">${initials}</div>
          <div class="player-details">
            <span class="player-name">${escapeHTML(player.name)}</span>
            <span class="player-contact">${escapeHTML(player.phone || player.email || 'ไม่มีข้อมูลติดต่อ')}</span>
          </div>
        </div>
      </td>
      <td>
        <span class="badge badge-skill-${player.skill}">${SKILL_LABELS[player.skill] || player.skill}</span>
      </td>
      <td>
        <span class="badge badge-style-${player.style}">${STYLE_LABELS[player.style] || player.style}</span>
      </td>
      <td>
        <span class="badge-hand badge-hand-${player.hand}">${player.hand === 'ambi' ? 'สองข้าง' : player.hand === 'left' ? 'ซ้าย' : 'ขวา'}</span>
      </td>
      <td>
        <strong>${player.matchesWon}</strong> / ${player.matchesPlayed}
        <div style="font-size: 0.7rem; color: var(--text-dark);">
          แพ้: ${player.matchesPlayed - player.matchesWon}
        </div>
      </td>
      <td class="winrate-cell">
        <div class="winrate-num">${winRate}%</div>
        <div class="winrate-track">
          <div class="winrate-fill" style="width: ${winRate}%"></div>
        </div>
      </td>
      <td>
        <span class="badge badge-status-${player.status}">${STATUS_LABELS[player.status] || player.status}</span>
      </td>
      <td>
        <div class="table-actions">
          <button class="action-icon-btn btn-profile-player" data-id="${player.id}" title="View Player Profile Card">
            <svg viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </button>
          <button class="action-icon-btn btn-edit-player" data-id="${player.id}" title="Edit Player">
            <svg viewBox="0 0 24 24">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </button>
          <button class="action-icon-btn btn-delete-player" data-id="${player.id}" title="Delete Player">
            <svg viewBox="0 0 24 24">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </td>
    `;
    playerTableBody.appendChild(tr);
  });

  // Attach action button event listeners
  document.querySelectorAll(".btn-profile-player").forEach(btn => {
    btn.addEventListener("click", () => openProfileModal(btn.dataset.id));
  });

  document.querySelectorAll(".btn-edit-player").forEach(btn => {
    btn.addEventListener("click", () => openPlayerModal(btn.dataset.id));
  });

  document.querySelectorAll(".btn-delete-player").forEach(btn => {
    btn.addEventListener("click", () => handleDeletePlayer(btn.dataset.id));
  });
}

// --- MODAL ACTIONS ---
function openPlayerModal(id = null) {
  playerForm.reset();
  
  if (id) {
    const player = players.find(p => p.id === id);
    if (!player) return;

    playerModalTitle.textContent = "Edit Player Info";
    editPlayerId.value = player.id;
    playerNameInput.value = player.name;
    playerPhoneInput.value = player.phone || "";
    playerEmailInput.value = player.email || "";
    playerSkillSelect.value = player.skill;
    playerStyleSelect.value = player.style;
    playerHandSelect.value = player.hand;
    playerStatusSelect.value = player.status;
    playerWonInput.value = player.matchesWon || 0;
    playerPlayedInput.value = player.matchesPlayed || 0;
    playerNotesInput.value = player.notes || "";

    // Set attribute values
    const attr = player.attributes || { pace: 70, power: 70, control: 70, defense: 70, stamina: 70, tactics: 70 };
    attrPace.value = attr.pace;
    valPace.textContent = attr.pace;
    attrPower.value = attr.power;
    valPower.textContent = attr.power;
    attrControl.value = attr.control;
    valControl.textContent = attr.control;
    attrDefense.value = attr.defense;
    valDefense.textContent = attr.defense;
    attrStamina.value = attr.stamina;
    valStamina.textContent = attr.stamina;
    attrTactics.value = attr.tactics;
    valTactics.textContent = attr.tactics;
  } else {
    playerModalTitle.textContent = "Add New Player";
    editPlayerId.value = "";
    playerWonInput.value = 0;
    playerPlayedInput.value = 0;

    // Set defaults
    attrPace.value = 70; valPace.textContent = 70;
    attrPower.value = 70; valPower.textContent = 70;
    attrControl.value = 70; valControl.textContent = 70;
    attrDefense.value = 70; valDefense.textContent = 70;
    attrStamina.value = 70; valStamina.textContent = 70;
    attrTactics.value = 70; valTactics.textContent = 70;
  }

  playerModal.classList.add("active");
  playerModal.setAttribute("aria-hidden", "false");
  playerNameInput.focus();
}

function closePlayerModal() {
  playerModal.classList.remove("active");
  playerModal.setAttribute("aria-hidden", "true");
  playerForm.reset();
}

function handleSavePlayer(e) {
  e.preventDefault();
  
  const id = editPlayerId.value;
  const name = playerNameInput.value.trim();
  const phone = playerPhoneInput.value.trim();
  const email = playerEmailInput.value.trim();
  const skill = playerSkillSelect.value;
  const style = playerStyleSelect.value;
  const hand = playerHandSelect.value;
  const status = playerStatusSelect.value;
  const won = parseInt(playerWonInput.value) || 0;
  const played = parseInt(playerPlayedInput.value) || 0;
  const notes = playerNotesInput.value.trim();

  // Range attributes
  const pace = parseInt(attrPace.value) || 70;
  const power = parseInt(attrPower.value) || 70;
  const control = parseInt(attrControl.value) || 70;
  const defense = parseInt(attrDefense.value) || 70;
  const stamina = parseInt(attrStamina.value) || 70;
  const tactics = parseInt(attrTactics.value) || 70;

  if (!name) {
    showToast("กรุณากรอกชื่อผู้เล่น", "error");
    return;
  }

  if (won > played) {
    showToast("จำนวนแมตช์ที่ชนะจะมากกว่าจำนวนแมตช์ทั้งหมดที่เล่นไม่ได้!", "error");
    return;
  }

  if (id) {
    // Edit existing
    const index = players.findIndex(p => p.id === id);
    if (index !== -1) {
      players[index] = {
        ...players[index],
        name,
        phone,
        email,
        skill,
        style,
        hand,
        status,
        matchesWon: won,
        matchesPlayed: played,
        notes,
        attributes: { pace, power, control, defense, stamina, tactics }
      };
      showToast(`อัปเดตข้อมูลผู้เล่นเรียบร้อย: ${name}`);
    }
  } else {
    // Add new
    const newPlayer = {
      id: "p-" + Date.now(),
      name,
      phone,
      email,
      skill,
      style,
      hand,
      status,
      matchesWon: won,
      matchesPlayed: played,
      notes,
      createdAt: new Date().toISOString(),
      attributes: { pace, power, control, defense, stamina, tactics }
    };
    players.push(newPlayer);
    showToast(`เพิ่มผู้เล่นใหม่เรียบร้อย: ${name}`, "success");
  }

  savePlayersToStorage();
  closePlayerModal();
  updateDashboard();
  renderTable();
}

function handleDeletePlayer(id) {
  const player = players.find(p => p.id === id);
  if (!player) return;

  if (confirm(`คุณแน่ใจหรือไม่ที่จะลบ ${player.name} ออกจากตาราง?`)) {
    players = players.filter(p => p.id !== id);
    savePlayersToStorage();
    showToast(`ลบผู้เล่นเรียบร้อย: ${player.name}`);
    updateDashboard();
    renderTable();
  }
}

// --- RECORD MATCH DIALOG ---
function openMatchModal() {
  matchForm.reset();

  matchPlayer1Select.innerHTML = '<option value="">-- เลือกผู้เล่น A --</option>';
  matchPlayer2Select.innerHTML = '<option value="">-- เลือกผู้เล่น B --</option>';

  const sortedPlayers = [...players].sort((a, b) => a.name.localeCompare(b.name));

  sortedPlayers.forEach(p => {
    const opt1 = document.createElement("option");
    opt1.value = p.id;
    opt1.textContent = `${p.name} (${SKILL_LABELS[p.skill] || p.skill})`;
    matchPlayer1Select.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = p.id;
    opt2.textContent = `${p.name} (${SKILL_LABELS[p.skill] || p.skill})`;
    matchPlayer2Select.appendChild(opt2);
  });

  // Make sure they cannot choose the same player
  matchPlayer1Select.addEventListener("change", () => {
    const p1 = matchPlayer1Select.value;
    Array.from(matchPlayer2Select.options).forEach(opt => {
      opt.disabled = opt.value === p1 && p1 !== "";
    });
  });

  matchPlayer2Select.addEventListener("change", () => {
    const p2 = matchPlayer2Select.value;
    Array.from(matchPlayer1Select.options).forEach(opt => {
      opt.disabled = opt.value === p2 && p2 !== "";
    });
  });

  matchModal.classList.add("active");
  matchModal.setAttribute("aria-hidden", "false");
}

function closeMatchModal() {
  matchModal.classList.remove("active");
  matchModal.setAttribute("aria-hidden", "true");
  matchForm.reset();
}

function handleSaveMatch(e) {
  e.preventDefault();

  const p1Id = matchPlayer1Select.value;
  const p2Id = matchPlayer2Select.value;
  const score1 = parseInt(matchScore1Input.value);
  const score2 = parseInt(matchScore2Input.value);
  const notes = matchNotesInput.value.trim();

  if (!p1Id || !p2Id) {
    showToast("กรุณาเลือกผู้เล่นทั้งสองคน", "error");
    return;
  }

  if (p1Id === p2Id) {
    showToast("ผู้เล่น A และผู้เล่น B ต้องไม่ใช่คนเดียวกัน", "error");
    return;
  }

  if (isNaN(score1) || isNaN(score2) || score1 < 0 || score2 < 0) {
    showToast("กรุณากรอกคะแนนที่ถูกต้อง", "error");
    return;
  }

  if (score1 === score2) {
    showToast("การแข่งขันแบดมินตันไม่สามารถจบลงด้วยผลเสมอได้!", "error");
    return;
  }

  const p1 = players.find(p => p.id === p1Id);
  const p2 = players.find(p => p.id === p2Id);

  if (!p1 || !p2) {
    showToast("ไม่พบข้อมูลผู้เล่นที่เลือก", "error");
    return;
  }

  const winnerId = score1 > score2 ? p1Id : p2Id;
  const winnerName = score1 > score2 ? p1.name : p2.name;

  // Update Player Stats
  p1.matchesPlayed = (p1.matchesPlayed || 0) + 1;
  p2.matchesPlayed = (p2.matchesPlayed || 0) + 1;

  if (winnerId === p1Id) {
    p1.matchesWon = (p1.matchesWon || 0) + 1;
  } else {
    p2.matchesWon = (p2.matchesWon || 0) + 1;
  }

  // Create Match Record
  const newMatch = {
    id: "m-" + Date.now(),
    player1Id: p1Id,
    player2Id: p2Id,
    score1,
    score2,
    winnerId,
    notes,
    date: new Date().toISOString()
  };

  matches.push(newMatch);

  // Save to LocalStorage
  savePlayersToStorage();
  saveMatchesToStorage();

  closeMatchModal();
  updateDashboard();
  renderTable();

  // Also refresh calendar if active
  if (typeof renderCalendar === "function") {
    renderCalendar();
    if (selectedDate) renderDayEvents(selectedDate);
  }

  showToast(`บันทึกผลการแข่งขันแล้ว! ${winnerName} ชนะ ${Math.max(score1, score2)}-${Math.min(score1, score2)}`, "success");
}

// --- PLAYER PROFILE DIALOG LOGIC ---
function openProfileModal(id) {
  const player = players.find(p => p.id === id);
  if (!player) return;

  const attr = player.attributes || { pace: 70, power: 70, control: 70, defense: 70, stamina: 70, tactics: 70 };
  
  // Calculate OVR (average of attributes)
  const ovr = Math.round((attr.pace + attr.power + attr.control + attr.defense + attr.stamina + attr.tactics) / 6);

  // Map tier styling to Card OVR
  profileFutCard.className = "fut-card";
  if (ovr >= 80) {
    profileFutCard.classList.add("tier-elite");
  } else if (ovr >= 70) {
    profileFutCard.classList.add("tier-advanced");
  } else {
    profileFutCard.classList.add("tier-intermediate");
  }

  // Bind FUT Card Fields
  profName.textContent = player.name;
  profOvr.textContent = ovr;
  
  let styleLabel = "ALL";
  if (player.style === "singles") styleLabel = "SGL";
  if (player.style === "doubles") styleLabel = "DBL";
  if (player.style === "mixed") styleLabel = "MXD";
  profStyle.textContent = styleLabel;
  profHand.textContent = player.hand === "right" ? "R" : player.hand === "left" ? "L" : "A";

  // Bind Stats numbers
  profPac.textContent = attr.pace;
  profPwr.textContent = attr.power;
  profCtl.textContent = attr.control;
  profDef.textContent = attr.defense;
  profSta.textContent = attr.stamina;
  profTac.textContent = attr.tactics;

  // Bind Details Panel
  profMatchesPlayed.textContent = player.matchesPlayed;
  profMatchesWon.textContent = player.matchesWon;
  const winRate = player.matchesPlayed > 0 ? Math.round((player.matchesWon / player.matchesPlayed) * 100) : 0;
  profWinRate.textContent = `${winRate}%`;
  profRemarks.textContent = player.notes || "ไม่มีบันทึกข้อความเพิ่มเติม";

  // Render recent matches (form dots)
  renderRecentForm(player.id);

  // Draw attributes Radar/Spider Chart
  drawRadarChart(attr.pace, attr.power, attr.control, attr.defense, attr.stamina, attr.tactics);

  profileModal.classList.add("active");
  profileModal.setAttribute("aria-hidden", "false");
}

function closeProfileModal() {
  profileModal.classList.remove("active");
  profileModal.setAttribute("aria-hidden", "true");
}

// Render dynamic recent win/loss form circles
function renderRecentForm(playerId) {
  profRecentForm.innerHTML = "";
  
  // Find matches involving this player, sorted by date desc
  const playerMatches = matches
    .filter(m => m.player1Id === playerId || m.player2Id === playerId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5); // Take last 5

  if (playerMatches.length === 0) {
    profRecentForm.innerHTML = '<span style="color: var(--text-dark); font-size: 0.85rem;">ไม่มีบันทึกการแข่งเมื่อเร็วๆ นี้</span>';
    return;
  }

  // Iterate backwards to render chronological W/L (older on left, newest on right)
  playerMatches.reverse().forEach(m => {
    const dot = document.createElement("span");
    const isWinner = m.winnerId === playerId;
    dot.className = `form-dot ${isWinner ? 'form-dot-win' : 'form-dot-loss'}`;
    dot.textContent = isWinner ? 'W' : 'L';
    
    // Add tooltip details
    const opponentId = m.player1Id === playerId ? m.player2Id : m.player1Id;
    const opponent = players.find(p => p.id === opponentId);
    const oppName = opponent ? opponent.name : "คู่แข่งที่ไม่ทราบชื่อ";
    const scoreText = m.player1Id === playerId ? `${m.score1}-${m.score2}` : `${m.score2}-${m.score1}`;
    
    dot.title = `${isWinner ? 'ชนะ' : 'แพ้'} เจอกับ ${oppName} (${scoreText}) เมื่อ ${new Date(m.date).toLocaleDateString('th-TH')}`;
    profRecentForm.appendChild(dot);
  });
}

// SVG Spider Web Radar Chart Renderer
function drawRadarChart(pace, power, control, defense, stamina, tactics) {
  const angles = [
    -Math.PI / 2,     // PAC (Top)
    -Math.PI / 6,     // PWR (Top-Right)
    Math.PI / 6,      // CTL (Bottom-Right)
    Math.PI / 2,      // DEF (Bottom)
    5 * Math.PI / 6,  // STA (Bottom-Left)
    -5 * Math.PI / 6  // TAC (Top-Left)
  ];
  
  const maxRadius = 70;
  const cx = 100;
  const cy = 100;

  // 1. Draw Background grid hexagons
  let gridMarkup = "";
  for (let step = 1; step <= 5; step++) {
    const r = (maxRadius / 5) * step;
    const points = angles.map(angle => {
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    gridMarkup += `<polygon class="radar-grid" points="${points}" />`;
  }

  // 2. Draw Spokes / Axis lines
  let axisMarkup = "";
  angles.forEach(angle => {
    const x = cx + maxRadius * Math.cos(angle);
    const y = cy + maxRadius * Math.sin(angle);
    axisMarkup += `<line class="radar-axis" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" />`;
  });

  // 3. Draw Player Attributes polygon
  const stats = [pace, power, control, defense, stamina, tactics];
  const playerPoints = angles.map((angle, idx) => {
    const r = maxRadius * (stats[idx] / 100);
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const playerPolygon = `<polygon class="radar-polygon" points="${playerPoints}" />`;

  // 4. Draw labels text (PAC, PWR, CTL, DEF, STA, TAC)
  const labels = ["PAC", "PWR", "CTL", "DEF", "STA", "TAC"];
  let labelMarkup = "";
  angles.forEach((angle, idx) => {
    const r = maxRadius + 14;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    
    // Choose correct text-anchor and offset depending on side
    let anchor = "middle";
    let dy = "3px";
    
    if (Math.abs(Math.cos(angle)) > 0.1) {
      anchor = Math.cos(angle) > 0 ? "start" : "end";
    }
    if (angle === Math.PI / 2) dy = "8px";   // straight down
    if (angle === -Math.PI / 2) dy = "-2px"; // straight up
    
    labelMarkup += `<text class="radar-label" x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" dy="${dy}">${labels[idx]}</text>`;
  });

  // Inject markup
  radarSvg.innerHTML = gridMarkup + axisMarkup + playerPolygon + labelMarkup;
}

// --- CSV IMPORT / EXPORT ---
function handleExportCSV() {
  if (players.length === 0) {
    showToast("ไม่มีข้อมูลผู้เล่นที่จะส่งออก", "error");
    return;
  }

  let csvRows = [];
  csvRows.push("Name,Phone,Email,Skill,PlayStyle,Hand,Status,MatchesWon,MatchesPlayed,Notes,Pace,Power,Control,Defense,Stamina,Tactics");

  players.forEach(p => {
    const attr = p.attributes || { pace: 70, power: 70, control: 70, defense: 70, stamina: 70, tactics: 70 };
    const row = [
      escapeCsvField(p.name),
      escapeCsvField(p.phone || ""),
      escapeCsvField(p.email || ""),
      escapeCsvField(p.skill),
      escapeCsvField(p.style),
      escapeCsvField(p.hand),
      escapeCsvField(p.status),
      p.matchesWon || 0,
      p.matchesPlayed || 0,
      escapeCsvField(p.notes || ""),
      attr.pace || 70,
      attr.power || 70,
      attr.control || 70,
      attr.defense || 70,
      attr.stamina || 70,
      attr.tactics || 70
    ];
    csvRows.push(row.join(","));
  });

  const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
  const encodedUri = encodeURI(csvContent);
  
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `dk_knight_roster_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("ส่งออกไฟล์ CSV เรียบร้อยแล้ว", "success");
}

function handleImportCSV(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const content = evt.target.result;
    const lines = content.split(/\r?\n/);
    
    if (lines.length <= 1) {
      showToast("ไฟล์ CSV ไม่มีข้อมูล", "error");
      return;
    }

    const headerRow = lines[0].toLowerCase();
    if (!headerRow.includes("name") || !headerRow.includes("skill") || !headerRow.includes("status")) {
      showToast("รูปแบบไฟล์ CSV ไม่ถูกต้อง คอลัมน์ที่จำเป็นไม่ครบถ้วน (Name, Skill, Status)", "error");
      return;
    }

    let importedCount = 0;
    let updatedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const fields = parseCsvLine(line);
      if (fields.length < 3) continue;

      const name = fields[0]?.trim();
      const phone = fields[1]?.trim() || "";
      const email = fields[2]?.trim() || "";
      const skill = (fields[3]?.trim().toLowerCase() || "intermediate");
      const style = (fields[4]?.trim().toLowerCase() || "all");
      const hand = (fields[5]?.trim().toLowerCase() || "right");
      const status = (fields[6]?.trim().toLowerCase() || "active");
      const won = parseInt(fields[7]) || 0;
      const played = parseInt(fields[8]) || 0;
      const notes = fields[9]?.trim() || "";
      
      // Parse attributes if present, default to 70 if not
      const pace = parseInt(fields[10]) || 70;
      const power = parseInt(fields[11]) || 70;
      const control = parseInt(fields[12]) || 70;
      const defense = parseInt(fields[13]) || 70;
      const stamina = parseInt(fields[14]) || 70;
      const tactics = parseInt(fields[15]) || 70;

      if (!name) continue;

      const existingPlayer = players.find(p => p.name.toLowerCase() === name.toLowerCase());

      if (existingPlayer) {
        existingPlayer.phone = phone;
        existingPlayer.email = email;
        existingPlayer.skill = ["novice", "beginner", "intermediate", "advanced", "elite"].includes(skill) ? skill : "intermediate";
        existingPlayer.style = ["singles", "doubles", "mixed", "all"].includes(style) ? style : "all";
        existingPlayer.hand = ["right", "left", "ambi"].includes(hand) ? hand : "right";
        existingPlayer.status = ["active", "injured", "inactive"].includes(status) ? status : "active";
        existingPlayer.matchesWon = won;
        existingPlayer.matchesPlayed = played;
        existingPlayer.notes = notes;
        existingPlayer.attributes = { pace, power, control, defense, stamina, tactics };
        updatedCount++;
      } else {
        const newPlayer = {
          id: "p-" + (Date.now() + i),
          name,
          phone,
          email,
          skill: ["novice", "beginner", "intermediate", "advanced", "elite"].includes(skill) ? skill : "intermediate",
          style: ["singles", "doubles", "mixed", "all"].includes(style) ? style : "all",
          hand: ["right", "left", "ambi"].includes(hand) ? hand : "right",
          status: ["active", "injured", "inactive"].includes(status) ? status : "active",
          matchesWon: won,
          matchesPlayed: played,
          notes,
          createdAt: new Date().toISOString(),
          attributes: { pace, power, control, defense, stamina, tactics }
        };
        players.push(newPlayer);
        importedCount++;
      }
    }

    savePlayersToStorage();
    updateDashboard();
    renderTable();
    showToast(`นำเข้าข้อมูลจาก CSV สำเร็จ! เพิ่มผู้เล่นใหม่ ${importedCount} คน และอัปเดตผู้เล่นเดิม ${updatedCount} คน`, "success");
    csvFileInput.value = "";
  };

  reader.readAsText(file);
}

// --- UTILITY HELPERS ---
function escapeHTML(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeCsvField(field) {
  let f = String(field);
  if (f.includes(",") || f.includes('"') || f.includes("\n") || f.includes("\r")) {
    f = f.replace(/"/g, '""');
    return `"${f}"`;
  }
  return f;
}

function parseCsvLine(line) {
  let fields = [];
  let currentField = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      fields.push(currentField);
      currentField = "";
    } else {
      currentField += char;
    }
  }
  fields.push(currentField);
  return fields;
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button style="background:none; border:none; color:inherit; font-size:1.1rem; cursor:pointer;" onclick="this.parentElement.remove()">&times;</button>
  `;
  
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = "slideIn 0.3s forwards reverse ease-in";
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// --- TAB CONTROLS LOGIC ---
function setupTabs() {
  tabRoster.addEventListener("click", () => {
    tabRoster.classList.add("active");
    tabCalendar.classList.remove("active");
    viewRoster.style.display = "block";
    viewCalendar.style.display = "none";
  });

  tabCalendar.addEventListener("click", () => {
    tabCalendar.classList.add("active");
    tabRoster.classList.remove("active");
    viewRoster.style.display = "none";
    viewCalendar.style.display = "block";
    renderCalendar();
    renderDayEvents(selectedDate);
  });
}

// --- CALENDAR RENDER LOGIC ---
function renderCalendar() {
  calendarGrid.innerHTML = "";
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  calendarMonthTitle.textContent = `${THAI_MONTHS[month]} ${year + 543}`;
  
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();
  
  // Render previous month days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = prevMonthTotalDays - i;
    const cell = document.createElement("div");
    cell.className = "calendar-day-cell other-month";
    cell.innerHTML = `<span class="calendar-day-num">${dayNum}</span>`;
    calendarGrid.appendChild(cell);
  }
  
  // Render current month days
  for (let day = 1; day <= totalDays; day++) {
    const cellDate = new Date(year, month, day);
    const cell = document.createElement("div");
    cell.className = "calendar-day-cell";
    
    if (cellDate.toDateString() === new Date().toDateString()) {
      cell.classList.add("today");
    }
    
    if (cellDate.toDateString() === selectedDate.toDateString()) {
      cell.classList.add("selected");
    }
    
    cell.innerHTML = `
      <span class="calendar-day-num">${day}</span>
      <div class="calendar-dots"></div>
    `;
    
    const dayDotsContainer = cell.querySelector(".calendar-dots");
    const dayMatches = matches.filter(m => new Date(m.date).toDateString() === cellDate.toDateString());
    const dayTrainings = trainings.filter(t => new Date(t.date).toDateString() === cellDate.toDateString());
    
    dayMatches.forEach(() => {
      const dot = document.createElement("span");
      dot.className = "dot dot-match";
      dot.title = "มีการแข่งขัน";
      dayDotsContainer.appendChild(dot);
    });
    
    dayTrainings.forEach(() => {
      const dot = document.createElement("span");
      dot.className = "dot dot-training";
      dot.title = "มีการฝึกซ้อม";
      dayDotsContainer.appendChild(dot);
    });
    
    cell.addEventListener("click", () => {
      document.querySelectorAll(".calendar-day-cell.selected").forEach(c => c.classList.remove("selected"));
      cell.classList.add("selected");
      selectedDate = cellDate;
      renderDayEvents(selectedDate);
    });
    
    calendarGrid.appendChild(cell);
  }
  
  // Render next month days to fill grid
  const renderedCells = firstDayIndex + totalDays;
  const remainingCells = 42 - renderedCells;
  const cellsToRender = remainingCells >= 0 ? remainingCells : (remainingCells + 7);
  
  for (let day = 1; day <= cellsToRender; day++) {
    const cell = document.createElement("div");
    cell.className = "calendar-day-cell other-month";
    cell.innerHTML = `<span class="calendar-day-num">${day}</span>`;
    calendarGrid.appendChild(cell);
  }
}

// --- DAY EVENTS SIDEBAR LOGIC ---
function renderDayEvents(date) {
  selectedDateTitle.textContent = `กิจกรรมประจำวันที่ ${date.getDate()} ${THAI_MONTHS[date.getMonth()]} ${date.getFullYear() + 543}`;
  dayEventsList.innerHTML = "";
  
  const dayMatches = matches.filter(m => new Date(m.date).toDateString() === date.toDateString());
  const dayTrainings = trainings.filter(t => new Date(t.date).toDateString() === date.toDateString());
  
  if (dayMatches.length === 0 && dayTrainings.length === 0) {
    dayEventsList.innerHTML = `
      <div class="no-events-placeholder">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <p>ไม่มีกิจกรรมในวันนี้</p>
      </div>
    `;
    return;
  }
  
  // Render Matches
  dayMatches.forEach(m => {
    const p1 = players.find(p => p.id === m.player1Id) || { name: "ไม่ทราบชื่อ" };
    const p2 = players.find(p => p.id === m.player2Id) || { name: "ไม่ทราบชื่อ" };
    const isWinnerP1 = m.winnerId === m.player1Id;
    
    const eventCard = document.createElement("div");
    eventCard.className = "event-card event-match";
    eventCard.innerHTML = `
      <div class="event-info">
        <span class="event-badge">MATCH / การแข่งขัน</span>
        <span class="event-title">${p1.name} VS ${p2.name}</span>
        <span class="event-details">ผลแข่ง: ${isWinnerP1 ? p1.name : p2.name} ชนะ | โน้ต: ${escapeHTML(m.notes || 'ไม่มี')}</span>
      </div>
      <div class="event-score-bubble">
        ${m.score1} - ${m.score2}
      </div>
    `;
    dayEventsList.appendChild(eventCard);
  });
  
  // Render Trainings
  dayTrainings.forEach(t => {
    const player = players.find(p => p.id === t.playerId) || { name: "ไม่ทราบชื่อ" };
    
    const eventCard = document.createElement("div");
    eventCard.className = "event-card event-training";
    eventCard.innerHTML = `
      <div class="event-info">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 4px;">
          <span class="event-badge">TRAINING / การฝึกซ้อม</span>
          <div style="display:flex; gap:6px;">
            <button class="action-icon-btn btn-edit-training" data-id="${t.id}" title="แก้ไขการซ้อม" style="width:24px; height:24px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); cursor: pointer; display: flex; align-items: center; justify-content: center;">
              ✏️
            </button>
            <button class="action-icon-btn btn-delete-training" data-id="${t.id}" title="ลบการซ้อม" style="width:24px; height:24px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); cursor: pointer; display: flex; align-items: center; justify-content: center;">
              🗑️
            </button>
          </div>
        </div>
        <span class="event-title">ซ้อม: ${player.name}</span>
        <span class="event-details">
          <strong>หัวข้อ:</strong> ${escapeHTML(t.topic)}<br>
          <strong>ผู้ฝึกสอน:</strong> ${escapeHTML(t.coach)} | <strong>เวลา:</strong> ${t.duration} นาที<br>
          <strong>ความเข้มข้น:</strong> ${t.intensity}/5 | <strong>ฝีมือ:</strong> ${t.beforeLevel} ➔ ${t.afterLevel}<br>
          <strong>คำแนะนำโค้ช:</strong> ${escapeHTML(t.feedback || 'ไม่มี')}<br>
          <strong>การบ้าน:</strong> ${escapeHTML(t.homework || 'ไม่มี')}
        </span>
      </div>
      <div class="event-score-bubble" style="margin-left: 10px;">
        ${t.score}/10 คะแนน
      </div>
    `;
    
    eventCard.querySelector(".btn-edit-training").addEventListener("click", (e) => {
      e.stopPropagation();
      openTrainingModal(t.id);
    });
    
    eventCard.querySelector(".btn-delete-training").addEventListener("click", (e) => {
      e.stopPropagation();
      handleDeleteTraining(t.id);
    });
    
    dayEventsList.appendChild(eventCard);
  });
}

// Helper to format Date object into YYYY-MM-DD in local time
function formatLocalDate(date) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// --- TRAINING MODAL LOGIC ---
function openTrainingModal(id = null) {
  trainingForm.reset();
  
  trainingPlayerSelect.innerHTML = '<option value="">-- เลือกนักกีฬา --</option>';
  const sortedPlayers = [...players].sort((a, b) => a.name.localeCompare(b.name));
  sortedPlayers.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.name} (${SKILL_LABELS[p.skill] || p.skill})`;
    trainingPlayerSelect.appendChild(opt);
  });
  
  if (id) {
    const t = trainings.find(session => session.id === id);
    if (!t) return;
    
    trainingModalTitle.textContent = "แก้ไขบันทึกการซ้อม";
    editTrainingId.value = t.id;
    trainingPlayerSelect.value = t.playerId;
    
    trainingDateInput.value = formatLocalDate(t.date);
    
    trainingCoachInput.value = t.coach || "Coach A";
    trainingDurationInput.value = t.duration || 60;
    trainingTopicInput.value = t.topic || "";
    
    trainingIntensityInput.value = t.intensity || 3;
    valIntensity.textContent = t.intensity || 3;
    
    trainingScoreInput.value = t.score || 7;
    valTrainingScore.textContent = t.score || 7;
    
    trainingBeforeLevelInput.value = t.beforeLevel || 5;
    valBeforeLevel.textContent = t.beforeLevel || 5;
    
    trainingAfterLevelInput.value = t.afterLevel || 6;
    valAfterLevel.textContent = t.afterLevel || 6;
    
    trainingAttendanceSelect.value = t.attendanceStatus || "Present";
    
    if (t.nextActionDate) {
      trainingNextDateInput.value = formatLocalDate(t.nextActionDate);
    } else {
      trainingNextDateInput.value = "";
    }
    
    trainingFeedbackInput.value = t.feedback || "";
    trainingHomeworkInput.value = t.homework || "";
    trainingImprovementInput.value = t.improvementNote || "";
  } else {
    trainingModalTitle.textContent = "บันทึกตารางซ้อม";
    editTrainingId.value = "";
    
    trainingDateInput.value = formatLocalDate(selectedDate);
    
    trainingCoachInput.value = "Coach A";
    trainingDurationInput.value = 60;
    
    trainingIntensityInput.value = 3; valIntensity.textContent = 3;
    trainingScoreInput.value = 7; valTrainingScore.textContent = 7;
    trainingBeforeLevelInput.value = 5; valBeforeLevel.textContent = 5;
    trainingAfterLevelInput.value = 6; valAfterLevel.textContent = 6;
    
    trainingAttendanceSelect.value = "Present";
    trainingNextDateInput.value = "";
  }
  
  trainingModal.classList.add("active");
  trainingModal.setAttribute("aria-hidden", "false");
}

function closeTrainingModal() {
  trainingModal.classList.remove("active");
  trainingModal.setAttribute("aria-hidden", "true");
  trainingForm.reset();
}

function handleSaveTraining(e) {
  e.preventDefault();
  
  const id = editTrainingId.value;
  const playerId = trainingPlayerSelect.value;
  const dateStr = trainingDateInput.value;
  const coach = trainingCoachInput.value.trim();
  const topic = trainingTopicInput.value.trim();
  const duration = parseInt(trainingDurationInput.value) || 60;
  
  const intensity = parseInt(trainingIntensityInput.value) || 3;
  const score = parseInt(trainingScoreInput.value) || 7;
  const beforeLevel = parseInt(trainingBeforeLevelInput.value) || 5;
  const afterLevel = parseInt(trainingAfterLevelInput.value) || 6;
  
  const attendanceStatus = trainingAttendanceSelect.value;
  const nextActionDate = trainingNextDateInput.value ? new Date(trainingNextDateInput.value).toISOString() : "";
  const feedback = trainingFeedbackInput.value.trim();
  const homework = trainingHomeworkInput.value.trim();
  const improvementNote = trainingImprovementInput.value.trim();
  
  if (!playerId) {
    showToast("กรุณาเลือกนักกีฬา", "error");
    return;
  }
  
  if (!dateStr) {
    showToast("กรุณากรอกวันที่ฝึกซ้อม", "error");
    return;
  }
  
  if (!topic) {
    showToast("กรุณากรอกหัวข้อที่ซ้อม", "error");
    return;
  }
  
  const dateISO = new Date(dateStr).toISOString();
  
  if (id) {
    const index = trainings.findIndex(t => t.id === id);
    if (index !== -1) {
      trainings[index] = {
        ...trainings[index],
        playerId,
        date: dateISO,
        coach,
        topic,
        duration,
        intensity,
        score,
        beforeLevel,
        afterLevel,
        attendanceStatus,
        nextActionDate,
        feedback,
        homework,
        improvementNote
      };
      showToast("อัปเดตข้อมูลตารางซ้อมเสร็จสิ้น");
    }
  } else {
    const newSession = {
      id: "t-" + Date.now(),
      playerId,
      date: dateISO,
      coach,
      topic,
      duration,
      intensity,
      score,
      beforeLevel,
      afterLevel,
      attendanceStatus,
      nextActionDate,
      feedback,
      homework,
      improvementNote
    };
    trainings.push(newSession);
    showToast("บันทึกตารางซ้อมเรียบร้อยแล้ว", "success");
  }
  
  saveTrainingsToStorage();
  closeTrainingModal();
  renderCalendar();
  renderDayEvents(selectedDate);
}

function handleDeleteTraining(id) {
  const t = trainings.find(session => session.id === id);
  if (!t) return;
  
  const player = players.find(p => p.id === t.playerId) || { name: "นักกีฬา" };
  
  if (confirm(`คุณต้องการลบตารางซ้อมของ ${player.name} ในหัวข้อ "${t.topic}" หรือไม่?`)) {
    trainings = trainings.filter(session => session.id !== id);
    saveTrainingsToStorage();
    showToast("ลบตารางซ้อมเรียบร้อยแล้ว");
    renderCalendar();
    renderDayEvents(selectedDate);
  }
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
  searchInput.addEventListener("input", renderTable);
  filterSkill.addEventListener("change", renderTable);
  filterStyle.addEventListener("change", renderTable);
  filterHand.addEventListener("change", renderTable);
  filterStatus.addEventListener("change", renderTable);

  tableHeaders.forEach(th => {
    th.addEventListener("click", () => {
      const col = th.dataset.sort;
      if (sortColumn === col) {
        sortDirection = sortDirection === "asc" ? "desc" : "asc";
      } else {
        sortColumn = col;
        sortDirection = "asc";
      }

      tableHeaders.forEach(header => {
        header.classList.remove("sort-active", "sort-desc");
        if (header.dataset.sort === sortColumn) {
          header.classList.add("sort-active");
          if (sortDirection === "desc") {
            header.classList.add("sort-desc");
          }
        }
      });

      renderTable();
    });
  });

  // Player Form Trigger
  btnAddPlayer.addEventListener("click", () => openPlayerModal());
  btnCancelPlayer.addEventListener("click", closePlayerModal);
  btnClosePlayerModal.addEventListener("click", closePlayerModal);
  btnSavePlayer.addEventListener("click", handleSavePlayer);

  // Match Form Trigger
  btnRecordMatch.addEventListener("click", openMatchModal);
  btnCancelMatch.addEventListener("click", closeMatchModal);
  btnCloseMatchModal.addEventListener("click", closeMatchModal);
  btnSaveMatch.addEventListener("click", handleSaveMatch);

  // Player Profile Modal Trigger
  btnCloseProfileModal.addEventListener("click", closeProfileModal);
  btnCloseProfile.addEventListener("click", closeProfileModal);

  // CSV Trigger
  btnExportCsv.addEventListener("click", handleExportCSV);
  csvFileInput.addEventListener("change", handleImportCSV);

  // Tab click listeners
  setupTabs();
  
  // Calendar Navigation
  btnPrevMonth.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });
  
  btnNextMonth.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });
  
  // Activity Dropdown
  btnAddActivity.addEventListener("click", (e) => {
    e.stopPropagation();
    activityDropdown.classList.toggle("show");
  });
  
  // Close dropdown when clicking outside
  document.addEventListener("click", () => {
    activityDropdown.classList.remove("show");
  });
  
  menuRecordMatch.addEventListener("click", (e) => {
    e.preventDefault();
    activityDropdown.classList.remove("show");
    openMatchModal();
  });
  
  menuRecordTraining.addEventListener("click", (e) => {
    e.preventDefault();
    activityDropdown.classList.remove("show");
    openTrainingModal();
  });
  
  // Training Modal triggers
  btnCancelTraining.addEventListener("click", closeTrainingModal);
  btnCloseTrainingModal.addEventListener("click", closeTrainingModal);
  btnSaveTraining.addEventListener("click", handleSaveTraining);

  // Theme Toggle Trigger
  if (btnThemeToggle) {
    btnThemeToggle.addEventListener("click", () => {
      const isLight = document.body.classList.toggle("light-mode");
      localStorage.setItem("dk_theme", isLight ? "light" : "dark");
      btnThemeToggle.textContent = isLight ? "🌙" : "☀️";
      showToast(isLight ? "เปิดใช้งานโหมดสว่าง" : "เปิดใช้งานโหมดมืด", "success");
    });
  }

  // Click outside to close modals
  window.addEventListener("click", (e) => {
    if (e.target === playerModal) closePlayerModal();
    if (e.target === matchModal) closeMatchModal();
    if (e.target === profileModal) closeProfileModal();
    if (e.target === trainingModal) closeTrainingModal();
  });
}

// Start application
document.addEventListener("DOMContentLoaded", initApp);
if (document.readyState === "complete" || document.readyState === "interactive") {
  initApp();
}
