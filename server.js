const express = require('express');
const cors = require('cors');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const EXCEL_FILE = path.join(__dirname, 'dk_knight_data.xlsx');

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Helpers for excel dates (Excel dates are floats representing days since 1900-01-01)
function excelDateToISO(excelDate) {
  if (!excelDate) return new Date().toISOString();
  if (typeof excelDate === 'string') return new Date(excelDate).toISOString();
  // Adjust for timezone offset and base date
  const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
  return date.toISOString();
}

function isoToExcelDate(isoString) {
  if (!isoString) return null;
  const date = new Date(isoString);
  const time = date.getTime();
  return (time / (86400 * 1000)) + 25569;
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Clear sheet rows from a starting row index (0-indexed) to avoid trailing rows from previous writes
function clearSheetRowsFrom(sheet, startRowIndex) {
  if (!sheet || !sheet['!ref']) return;
  const range = XLSX.utils.decode_range(sheet['!ref']);
  if (startRowIndex > range.e.r) return;
  
  for (let r = startRowIndex; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r, c });
      delete sheet[cellAddress];
    }
  }
  range.e.r = startRowIndex - 1;
  sheet['!ref'] = XLSX.utils.encode_range(range);
}

// GET API to read players, matches, and training logs from Excel
app.get('/api/data', (req, res) => {
  try {
    if (!fs.existsSync(EXCEL_FILE)) {
      return res.status(404).json({ error: "Excel database file not found" });
    }

    const workbook = XLSX.readFile(EXCEL_FILE);
    
    // 1. Read Members Sheet
    const membersSheet = workbook.Sheets['Members'];
    if (!membersSheet) throw new Error("Members sheet not found");
    const membersRaw = XLSX.utils.sheet_to_json(membersSheet, { header: 1 });
    const memberHeaders = membersRaw[3] || [];
    const membersData = [];
    for (let i = 4; i < membersRaw.length; i++) {
      const row = membersRaw[i];
      if (!row || row.length === 0 || !row[0]) continue;
      const member = {};
      memberHeaders.forEach((header, idx) => {
        member[header] = row[idx] !== undefined ? row[idx] : null;
      });
      membersData.push(member);
    }

    // 2. Read Skill Assessments Sheet
    const skillSheet = workbook.Sheets['Skill_Assessment'];
    const skillsMap = {};
    if (skillSheet) {
      const skillRaw = XLSX.utils.sheet_to_json(skillSheet, { header: 1 });
      const skillHeaders = skillRaw[3] || [];
      for (let i = 4; i < skillRaw.length; i++) {
        const row = skillRaw[i];
        if (!row || row.length === 0 || !row[2]) continue; // Column 2 is Player_ID
        const skillObj = {};
        skillHeaders.forEach((header, idx) => {
          skillObj[header] = row[idx] !== undefined ? row[idx] : null;
        });
        skillsMap[skillObj.Player_ID] = skillObj;
      }
    }

    // 3. Read Match Logs Sheet
    const matchSheet = workbook.Sheets['Match_Log'];
    const matchesData = [];
    if (matchSheet) {
      const matchRaw = XLSX.utils.sheet_to_json(matchSheet, { header: 1 });
      const matchHeaders = matchRaw[3] || [];
      for (let i = 4; i < matchRaw.length; i++) {
        const row = matchRaw[i];
        if (!row || row.length === 0 || !row[0]) continue; // Column 0 is Match_ID
        const match = {};
        matchHeaders.forEach((header, idx) => {
          match[header] = row[idx] !== undefined ? row[idx] : null;
        });
        matchesData.push(match);
      }
    }

    // 4. Read Training Logs Sheet
    const trainingSheet = workbook.Sheets['Training_Log'];
    const trainingData = [];
    if (trainingSheet) {
      const trainingRaw = XLSX.utils.sheet_to_json(trainingSheet, { header: 1 });
      const trainingHeaders = trainingRaw[3] || [];
      for (let i = 4; i < trainingRaw.length; i++) {
        const row = trainingRaw[i];
        if (!row || row.length === 0 || !row[0]) continue; // Column 0 is Training_ID
        const training = {};
        trainingHeaders.forEach((header, idx) => {
          training[header] = row[idx] !== undefined ? row[idx] : null;
        });
        trainingData.push(training);
      }
    }

    // Calculate dynamic stats from matches list
    const playerStats = {};
    membersData.forEach(m => {
      playerStats[m.Player_ID] = { won: 0, played: 0 };
    });

    matchesData.forEach(m => {
      const pA = m.Player_A_ID;
      const pB = m.Player_B_ID;
      const winner = m.Winner_ID;

      if (playerStats[pA]) {
        playerStats[pA].played++;
        if (winner === pA) playerStats[pA].won++;
      }
      if (playerStats[pB]) {
        playerStats[pB].played++;
        if (winner === pB) playerStats[pB].won++;
      }
    });

    // Map membersData to UI Players
    const uiPlayers = membersData.map(m => {
      const skillObj = skillsMap[m.Player_ID] || {};
      
      const attributes = {
        pace: Math.round((Number(skillObj.Footwork) || 7) * 10),
        power: Math.round((Number(skillObj.Smash) || 7) * 10),
        control: Math.round((Number(skillObj.Net_Play) || 7) * 10),
        defense: Math.round((Number(skillObj.Defense) || 7) * 10),
        stamina: Math.round((Number(skillObj.Stamina) || 7) * 10),
        tactics: Math.round((Number(skillObj.Tactics) || 7) * 10)
      };

      const stats = playerStats[m.Player_ID] || { won: 0, played: 0 };

      return {
        id: m.Player_ID,
        name: m.Full_Name,
        phone: m.Phone || '',
        email: m.Email || '',
        skill: (m.Skill_Level || 'intermediate').toLowerCase(),
        style: (m.Play_Style || 'all').toLowerCase(),
        hand: (m.Hand || 'right').toLowerCase(),
        status: (m.Status || 'active').toLowerCase(),
        matchesWon: stats.won,
        matchesPlayed: stats.played,
        notes: m.Coach_Notes || '',
        createdAt: m.Created_At ? excelDateToISO(m.Created_At) : new Date().toISOString(),
        attributes
      };
    });

    // Map matchesData to UI Matches
    const uiMatches = uiMatchesFromExcel(matchesData);

    // Map trainingData to UI Trainings
    const uiTrainings = trainingData.map(t => ({
      id: t.Training_ID,
      date: t.Date ? excelDateToISO(t.Date) : new Date().toISOString(),
      playerId: t.Player_ID,
      coach: t.Coach || '',
      topic: t.Topic || '',
      duration: Number(t.Duration_Min) || 0,
      intensity: Number(t.Intensity_1_5) || 3,
      score: Number(t.Score_1_10) || 7,
      feedback: t.Coach_Feedback || '',
      homework: t.Homework || '',
      nextActionDate: t.Next_Action_Date ? excelDateToISO(t.Next_Action_Date) : '',
      attendanceStatus: t.Attendance_Status || 'Present',
      beforeLevel: Number(t.Before_Level) || 5,
      afterLevel: Number(t.After_Level) || 6,
      improvementNote: t.Improvement_Note || ''
    }));

    res.json({ players: uiPlayers, matches: uiMatches, trainings: uiTrainings });
  } catch (error) {
    console.error("Read Error:", error);
    res.status(500).json({ error: "Failed to read Excel database: " + error.message });
  }
});

function uiMatchesFromExcel(matchesData) {
  return matchesData.map(m => {
    let setsA = 0;
    let setsB = 0;
    
    [m.Score_Set_1, m.Score_Set_2, m.Score_Set_3].forEach(set => {
      if (set && typeof set === 'string' && set.includes('-')) {
        const parts = set.split('-');
        const ptsA = parseInt(parts[0]) || 0;
        const ptsB = parseInt(parts[1]) || 0;
        if (ptsA > ptsB) setsA++;
        else if (ptsB > ptsA) setsB++;
      }
    });
    
    if (setsA === 0 && setsB === 0) {
      if (m.Winner_ID === m.Player_A_ID) {
        setsA = 2; setsB = 0;
      } else {
        setsA = 0; setsB = 2;
      }
    }

    return {
      id: m.Match_ID,
      player1Id: m.Player_A_ID,
      player2Id: m.Player_B_ID,
      score1: setsA,
      score2: setsB,
      winnerId: m.Winner_ID,
      notes: m.Coach_Note || m.Key_Mistake || '',
      date: m.Date ? excelDateToISO(m.Date) : new Date().toISOString()
    };
  });
}

// POST API to update players in Excel
app.post('/api/players', (req, res) => {
  try {
    const players = req.body;
    if (!Array.isArray(players)) {
      return res.status(400).json({ error: "Invalid players list" });
    }

    const workbook = XLSX.readFile(EXCEL_FILE);
    
    // 1. Overwrite Members Sheet starting at Row 5 (origin A5)
    const membersSheet = workbook.Sheets['Members'];
    if (!membersSheet) throw new Error("Members sheet not found in Excel");

    clearSheetRowsFrom(membersSheet, 4);

    const playerRows = [];
    players.forEach(p => {
      playerRows.push([
        p.id,
        p.name,
        p.name.split(' ')[0] || '', // Nickname
        p.phone || '',
        p.email || '',
        isoToExcelDate(p.createdAt),
        capitalize(p.status),
        capitalize(p.skill),
        capitalize(p.style),
        capitalize(p.hand),
        null, // Birth Date
        null, // Age
        null, // Dominant Position
        null, // Strengths
        null, // Weaknesses
        p.notes || '',
        '', // Photo URL
        '', // Emergency Contact
        isoToExcelDate(p.createdAt),
        isoToExcelDate(new Date().toISOString()),
        1 // Active Flag
      ]);
    });
    XLSX.utils.sheet_add_aoa(membersSheet, playerRows, { origin: 'A5' });

    // 2. Overwrite Skill Assessment Sheet
    const skillSheet = workbook.Sheets['Skill_Assessment'];
    if (skillSheet) {
      clearSheetRowsFrom(skillSheet, 4);
      const skillRows = [];
      players.forEach((p, idx) => {
        const attr = p.attributes || { pace: 70, power: 70, control: 70, defense: 70, stamina: 70, tactics: 70 };
        const footwork = Math.round((attr.pace || 70) / 10);
        const smash = Math.round((attr.power || 70) / 10);
        const netPlay = Math.round((attr.control || 70) / 10);
        const defense = Math.round((attr.defense || 70) / 10);
        const stamina = Math.round((attr.stamina || 70) / 10);
        const tactics = Math.round((attr.tactics || 70) / 10);
        const overall = (footwork + smash + netPlay + defense + stamina + tactics) / 6;

        skillRows.push([
          `A${String(idx + 1).padStart(3, '0')}`,
          isoToExcelDate(new Date().toISOString()),
          p.id,
          p.name,
          footwork,
          6, // Serve
          smash,
          defense,
          netPlay, // Drive
          netPlay, // Net Play
          tactics,
          stamina,
          7, // Teamwork
          Math.round(overall * 10) / 10,
          'Coach A',
          p.notes || ''
        ]);
      });
      XLSX.utils.sheet_add_aoa(skillSheet, skillRows, { origin: 'A5' });
    }

    XLSX.writeFile(workbook, EXCEL_FILE);
    res.json({ message: "Excel Members & Skills updated successfully" });
  } catch (error) {
    console.error("Write Error:", error);
    res.status(500).json({ error: "Failed to write players to Excel: " + error.message });
  }
});

// POST API to update matches in Excel
app.post('/api/matches', (req, res) => {
  try {
    const matches = req.body;
    if (!Array.isArray(matches)) {
      return res.status(400).json({ error: "Invalid matches list" });
    }

    const workbook = XLSX.readFile(EXCEL_FILE);
    const matchSheet = workbook.Sheets['Match_Log'];
    if (!matchSheet) throw new Error("Match_Log sheet not found in Excel");

    clearSheetRowsFrom(matchSheet, 4);

    const matchRows = [];
    matches.forEach(m => {
      let set1 = '';
      let set2 = '';
      let set3 = '';
      
      if (m.score1 === 2 && m.score2 === 0) {
        set1 = '21-15';
        set2 = '21-15';
      } else if (m.score1 === 0 && m.score2 === 2) {
        set1 = '15-21';
        set2 = '15-21';
      } else if (m.score1 === 2 && m.score2 === 1) {
        set1 = '21-18';
        set2 = '19-21';
        set3 = '21-15';
      } else if (m.score1 === 1 && m.score2 === 2) {
        set1 = '18-21';
        set2 = '21-19';
        set3 = '15-21';
      } else {
        set1 = `${m.score1}-${m.score2}`;
      }

      const resultA = m.winnerId === m.player1Id ? 'Win' : 'Loss';
      const resultB = m.winnerId === m.player2Id ? 'Win' : 'Loss';

      matchRows.push([
        m.id,
        isoToExcelDate(m.date),
        'Singles',
        m.player1Id,
        '', // Player A Name
        m.player2Id,
        '', // Player B Name
        '', // Partner A
        '', // Partner B
        set1,
        set2,
        set3,
        m.winnerId,
        resultA,
        resultB,
        '', // Key Mistake
        m.notes || '', // Coach Note
        isoToExcelDate(m.date),
        isoToExcelDate(new Date().toISOString()),
        '' // Video URL
      ]);
    });
    XLSX.utils.sheet_add_aoa(matchSheet, matchRows, { origin: 'A5' });

    XLSX.writeFile(workbook, EXCEL_FILE);
    res.json({ message: "Excel Match Logs updated successfully" });
  } catch (error) {
    console.error("Write Error:", error);
    res.status(500).json({ error: "Failed to write matches to Excel: " + error.message });
  }
});

// POST API to update training sessions in Excel
app.post('/api/trainings', (req, res) => {
  try {
    const trainings = req.body;
    if (!Array.isArray(trainings)) {
      return res.status(400).json({ error: "Invalid trainings list" });
    }

    const workbook = XLSX.readFile(EXCEL_FILE);
    const trainingSheet = workbook.Sheets['Training_Log'];
    if (!trainingSheet) throw new Error("Training_Log sheet not found in Excel");

    clearSheetRowsFrom(trainingSheet, 4);

    const trainingRows = [];
    trainings.forEach(t => {
      trainingRows.push([
        t.id,
        isoToExcelDate(t.date),
        t.playerId,
        '', // Player Name (Excel side auto-resolves or ignores)
        t.coach || 'Coach A',
        t.topic || '',
        t.duration || 60,
        t.intensity || 3,
        t.score || 7,
        t.topic || '', // Focus Point
        t.feedback || '',
        t.homework || '',
        t.nextActionDate ? isoToExcelDate(t.nextActionDate) : null,
        t.attendanceStatus || 'Present',
        t.beforeLevel || 5,
        t.afterLevel || 6,
        t.improvementNote || '',
        isoToExcelDate(t.date),
        isoToExcelDate(new Date().toISOString())
      ]);
    });
    XLSX.utils.sheet_add_aoa(trainingSheet, trainingRows, { origin: 'A5' });

    XLSX.writeFile(workbook, EXCEL_FILE);
    res.json({ message: "Excel Training Logs updated successfully" });
  } catch (error) {
    console.error("Write Error:", error);
    res.status(500).json({ error: "Failed to write trainings to Excel: " + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`DK-Knight Badminton server running at http://localhost:${PORT}`);
});
