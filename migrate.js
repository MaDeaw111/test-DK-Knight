const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const EXCEL_FILE = path.join(__dirname, 'dk_knight_data.xlsx');
const SEED_FILE = path.join(__dirname, 'seed.sql');

function excelDateToISO(excelDate) {
  if (!excelDate) return null;
  if (typeof excelDate === 'string') {
    try {
      return new Date(excelDate).toISOString();
    } catch (e) {
      return excelDate;
    }
  }
  if (typeof excelDate === 'number') {
    try {
      // Excel dates are days since 1900-01-01
      const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
      return date.toISOString();
    } catch (e) {
      return null;
    }
  }
  return null;
}

function escapeSql(val) {
  if (val === null || val === undefined || val === '') return 'NULL';
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 1 : 0;
  return `'${String(val).replace(/'/g, "''")}'`;
}

try {
  if (!fs.existsSync(EXCEL_FILE)) {
    console.error("Excel file not found at:", EXCEL_FILE);
    process.exit(1);
  }

  const workbook = XLSX.readFile(EXCEL_FILE);
  let sqlContent = `-- Seed data generated from ${path.basename(EXCEL_FILE)}\n\n`;

  // Helper to read rows starting at row index 4 (0-indexed) mapping headers at row index 3
  function getSheetData(sheetName) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      console.warn(`Sheet ${sheetName} not found.`);
      return [];
    }
    const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const headers = raw[3];
    if (!headers) {
      console.warn(`Headers not found in row 3 of sheet ${sheetName}.`);
      return [];
    }
    
    const data = [];
    for (let i = 4; i < raw.length; i++) {
      const row = raw[i];
      if (!row || row.length === 0 || !row[0]) continue; // Skip empty rows or rows with empty primary key
      const obj = {};
      headers.forEach((header, idx) => {
        if (header) {
          obj[header.trim()] = row[idx] !== undefined ? row[idx] : null;
        }
      });
      data.push(obj);
    }
    return data;
  }

  // 1. Members -> players table
  const members = getSheetData('Members');
  sqlContent += `-- Players\n`;
  members.forEach(m => {
    const id = m.Player_ID;
    const name = m.Full_Name;
    const nickname = m.Nickname;
    const phone = m.Phone;
    const email = m.Email;
    const dateJoined = excelDateToISO(m.Date_Joined);
    const status = m.Status;
    const skillLevel = m.Skill_Level;
    const playStyle = m.Play_Style;
    const hand = m.Hand;
    const birthDate = excelDateToISO(m.Birth_Date);
    const age = m.Age ? parseInt(m.Age) : null;
    const dominantPosition = m.Dominant_Position;
    const strengths = m.Strengths;
    const weaknesses = m.Weaknesses;
    const notes = m.Coach_Notes;
    const photoUrl = m.Photo_URL;
    const emergencyContact = m.Emergency_Contact;
    const createdAt = excelDateToISO(m.Created_At) || new Date().toISOString();
    const updatedAt = excelDateToISO(m.Updated_At) || new Date().toISOString();
    const activeFlag = m.Active_Flag !== null && m.Active_Flag !== undefined ? parseInt(m.Active_Flag) : 1;

    sqlContent += `INSERT INTO players (id, name, nickname, phone, email, date_joined, status, skill_level, play_style, hand, birth_date, age, dominant_position, strengths, weaknesses, notes, photo_url, emergency_contact, created_at, updated_at, active_flag) VALUES (${escapeSql(id)}, ${escapeSql(name)}, ${escapeSql(nickname)}, ${escapeSql(phone)}, ${escapeSql(email)}, ${escapeSql(dateJoined)}, ${escapeSql(status)}, ${escapeSql(skillLevel)}, ${escapeSql(playStyle)}, ${escapeSql(hand)}, ${escapeSql(birthDate)}, ${escapeSql(age)}, ${escapeSql(dominantPosition)}, ${escapeSql(strengths)}, ${escapeSql(weaknesses)}, ${escapeSql(notes)}, ${escapeSql(photoUrl)}, ${escapeSql(emergencyContact)}, ${escapeSql(createdAt)}, ${escapeSql(updatedAt)}, ${escapeSql(activeFlag)});\n`;
  });
  sqlContent += `\n`;

  // 2. Skill_Assessment -> skill_assessments table
  const skillAssessments = getSheetData('Skill_Assessment');
  sqlContent += `-- Skill Assessments\n`;
  skillAssessments.forEach(s => {
    const assessmentId = s.Assessment_ID;
    const date = excelDateToISO(s.Date);
    const playerId = s.Player_ID;
    const playerName = s.Player_Name;
    const footwork = s.Footwork ? parseInt(s.Footwork) : null;
    const serve = s.Serve ? parseInt(s.Serve) : null;
    const smash = s.Smash ? parseInt(s.Smash) : null;
    const defense = s.Defense ? parseInt(s.Defense) : null;
    const drive = s.Drive ? parseInt(s.Drive) : null;
    const netPlay = s.Net_Play ? parseInt(s.Net_Play) : null;
    const tactics = s.Tactics ? parseInt(s.Tactics) : null;
    const stamina = s.Stamina ? parseInt(s.Stamina) : null;
    const teamwork = s.Teamwork ? parseInt(s.Teamwork) : null;
    const overallScore = s.Overall_Score ? parseFloat(s.Overall_Score) : null;
    const assessor = s.Assessor;
    const notes = s.Notes;

    sqlContent += `INSERT INTO skill_assessments (assessment_id, date, player_id, player_name, footwork, serve, smash, defense, drive, net_play, tactics, stamina, teamwork, overall_score, assessor, notes) VALUES (${escapeSql(assessmentId)}, ${escapeSql(date)}, ${escapeSql(playerId)}, ${escapeSql(playerName)}, ${escapeSql(footwork)}, ${escapeSql(serve)}, ${escapeSql(smash)}, ${escapeSql(defense)}, ${escapeSql(drive)}, ${escapeSql(netPlay)}, ${escapeSql(tactics)}, ${escapeSql(stamina)}, ${escapeSql(teamwork)}, ${escapeSql(overallScore)}, ${escapeSql(assessor)}, ${escapeSql(notes)});\n`;
  });
  sqlContent += `\n`;

  // 3. Match_Log -> matches table
  const matches = getSheetData('Match_Log');
  sqlContent += `-- Matches\n`;
  matches.forEach(m => {
    const id = m.Match_ID;
    const date = excelDateToISO(m.Date);
    const matchType = m.Match_Type || 'Singles';
    const playerAId = m.Player_A_ID;
    const playerAName = m.Player_A_Name;
    const playerBId = m.Player_B_ID;
    const playerBName = m.Player_B_Name;
    const partnerAId = m.Partner_A_ID;
    const partnerBId = m.Partner_B_ID;
    const scoreSet1 = m.Score_Set_1;
    const scoreSet2 = m.Score_Set_2;
    const scoreSet3 = m.Score_Set_3;
    const winnerId = m.Winner_ID;
    const resultA = m.Result_A;
    const resultB = m.Result_B;
    const keyMistake = m.Key_Mistake;
    const coachNote = m.Coach_Note;
    const createdAt = excelDateToISO(m.Created_At) || new Date().toISOString();
    const updatedAt = excelDateToISO(m.Updated_At) || new Date().toISOString();
    const videoUrl = m.Video_URL;

    sqlContent += `INSERT INTO matches (id, date, match_type, player_a_id, player_a_name, player_b_id, player_b_name, partner_a_id, partner_b_id, score_set_1, score_set_2, score_set_3, winner_id, result_a, result_b, key_mistake, coach_note, created_at, updated_at, video_url) VALUES (${escapeSql(id)}, ${escapeSql(date)}, ${escapeSql(matchType)}, ${escapeSql(playerAId)}, ${escapeSql(playerAName)}, ${escapeSql(playerBId)}, ${escapeSql(playerBName)}, ${escapeSql(partnerAId)}, ${escapeSql(partnerBId)}, ${escapeSql(scoreSet1)}, ${escapeSql(scoreSet2)}, ${escapeSql(scoreSet3)}, ${escapeSql(winnerId)}, ${escapeSql(resultA)}, ${escapeSql(resultB)}, ${escapeSql(keyMistake)}, ${escapeSql(coachNote)}, ${escapeSql(createdAt)}, ${escapeSql(updatedAt)}, ${escapeSql(videoUrl)});\n`;
  });
  sqlContent += `\n`;

  // 4. Training_Log -> trainings table
  const trainings = getSheetData('Training_Log');
  sqlContent += `-- Trainings\n`;
  trainings.forEach(t => {
    const id = t.Training_ID;
    const date = excelDateToISO(t.Date);
    const playerId = t.Player_ID;
    const playerName = t.Player_Name;
    const coach = t.Coach;
    const topic = t.Topic;
    const durationMin = t.Duration_Min ? parseInt(t.Duration_Min) : null;
    const intensity15 = t.Intensity_1_5 ? parseInt(t.Intensity_1_5) : null;
    const score110 = t.Score_1_10 ? parseInt(t.Score_1_10) : null;
    const focusPoint = t.Focus_Point;
    const coachFeedback = t.Coach_Feedback;
    const homework = t.Homework;
    const nextActionDate = excelDateToISO(t.Next_Action_Date);
    const attendanceStatus = t.Attendance_Status;
    const beforeLevel = t.Before_Level ? parseInt(t.Before_Level) : null;
    const afterLevel = t.After_Level ? parseInt(t.After_Level) : null;
    const improvementNote = t.Improvement_Note;
    const createdAt = excelDateToISO(t.Created_At) || new Date().toISOString();
    const updatedAt = excelDateToISO(t.Updated_At) || new Date().toISOString();

    sqlContent += `INSERT INTO trainings (id, date, player_id, player_name, coach, topic, duration_min, intensity_1_5, score_1_10, focus_point, coach_feedback, homework, next_action_date, attendance_status, before_level, after_level, improvement_note, created_at, updated_at) VALUES (${escapeSql(id)}, ${escapeSql(date)}, ${escapeSql(playerId)}, ${escapeSql(playerName)}, ${escapeSql(coach)}, ${escapeSql(topic)}, ${escapeSql(durationMin)}, ${escapeSql(intensity15)}, ${escapeSql(score110)}, ${escapeSql(focusPoint)}, ${escapeSql(coachFeedback)}, ${escapeSql(homework)}, ${escapeSql(nextActionDate)}, ${escapeSql(attendanceStatus)}, ${escapeSql(beforeLevel)}, ${escapeSql(afterLevel)}, ${escapeSql(improvementNote)}, ${escapeSql(createdAt)}, ${escapeSql(updatedAt)});\n`;
  });

  fs.writeFileSync(SEED_FILE, sqlContent, 'utf8');
  console.log(`Success! Generated seed SQL file at: ${SEED_FILE}`);
} catch (e) {
  console.error("Migration script failed:", e);
}
