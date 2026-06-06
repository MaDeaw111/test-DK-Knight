import * as XLSX from 'xlsx';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Add CORS support for local development and options preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders()
      });
    }

    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(url.pathname, request, env);
    }

    // Serve static assets (built-in Cloudflare Worker Assets fallback)
    return env.ASSETS.fetch(request);
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

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
      // Excel dates represent days since 1900-01-01
      const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
      return date.toISOString();
    } catch (e) {
      return null;
    }
  }
  return null;
}

function isoToExcelDate(isoString) {
  if (!isoString) return null;
  try {
    const date = new Date(isoString);
    const time = date.getTime();
    return (time / (86400 * 1000)) + 25569;
  } catch (e) {
    return null;
  }
}

async function handleApiRequest(pathname, request, env) {
  if (pathname === '/api/data' && request.method === 'GET') {
    return getData(env);
  } else if (pathname === '/api/players' && request.method === 'POST') {
    return savePlayers(request, env);
  } else if (pathname === '/api/matches' && request.method === 'POST') {
    return saveMatches(request, env);
  } else if (pathname === '/api/trainings' && request.method === 'POST') {
    return saveTrainings(request, env);
  } else if (pathname === '/api/export' && request.method === 'GET') {
    return exportExcel(env);
  } else if (pathname === '/api/import' && request.method === 'POST') {
    return importExcel(request, env);
  }

  return new Response(JSON.stringify({ error: "Endpoint not found" }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
  });
}

// GET /api/data
async function getData(env) {
  try {
    const playersQuery = env.DB.prepare("SELECT * FROM players").all();
    const skillsQuery = env.DB.prepare("SELECT * FROM skill_assessments ORDER BY date DESC").all();
    const matchesQuery = env.DB.prepare("SELECT * FROM matches").all();
    const trainingsQuery = env.DB.prepare("SELECT * FROM trainings").all();

    const [playersRes, skillsRes, matchesRes, trainingsRes] = await Promise.all([
      playersQuery,
      skillsQuery,
      matchesQuery,
      trainingsQuery
    ]);

    const membersData = playersRes.results || [];
    const skillAssessments = skillsRes.results || [];
    const matchesData = matchesRes.results || [];
    const trainingData = trainingsRes.results || [];

    // Map skills by player_id (latest assessment first)
    const skillsMap = {};
    for (const s of skillAssessments) {
      if (!skillsMap[s.player_id]) {
        skillsMap[s.player_id] = s;
      }
    }

    // Calculate player stats from matches
    const playerStats = {};
    membersData.forEach(m => {
      playerStats[m.id] = { won: 0, played: 0 };
    });

    matchesData.forEach(m => {
      const pA = m.player_a_id;
      const pB = m.player_b_id;
      const winner = m.winner_id;

      if (playerStats[pA]) {
        playerStats[pA].played++;
        if (winner === pA) playerStats[pA].won++;
      }
      if (playerStats[pB]) {
        playerStats[pB].played++;
        if (winner === pB) playerStats[pB].won++;
      }
    });

    const uiPlayers = membersData.map(m => {
      const skillObj = skillsMap[m.id] || {};
      const attributes = {
        pace: Math.round((Number(skillObj.footwork) || 7) * 10),
        power: Math.round((Number(skillObj.smash) || 7) * 10),
        control: Math.round((Number(skillObj.net_play) || 7) * 10),
        defense: Math.round((Number(skillObj.defense) || 7) * 10),
        stamina: Math.round((Number(skillObj.stamina) || 7) * 10),
        tactics: Math.round((Number(skillObj.tactics) || 7) * 10)
      };

      const stats = playerStats[m.id] || { won: 0, played: 0 };

      return {
        id: m.id,
        name: m.name,
        phone: m.phone || '',
        email: m.email || '',
        skill: (m.skill_level || 'intermediate').toLowerCase(),
        style: (m.play_style || 'all').toLowerCase(),
        hand: (m.hand || 'right').toLowerCase(),
        status: (m.status || 'active').toLowerCase(),
        matchesWon: stats.won,
        matchesPlayed: stats.played,
        notes: m.notes || '',
        createdAt: m.created_at || new Date().toISOString(),
        attributes
      };
    });

    // Map matches
    const uiMatches = matchesData.map(m => {
      let setsA = 0;
      let setsB = 0;
      
      [m.score_set_1, m.score_set_2, m.score_set_3].forEach(set => {
        if (set && typeof set === 'string' && set.includes('-')) {
          const parts = set.split('-');
          const ptsA = parseInt(parts[0]) || 0;
          const ptsB = parseInt(parts[1]) || 0;
          if (ptsA > ptsB) setsA++;
          else if (ptsB > ptsA) setsB++;
        }
      });
      
      if (setsA === 0 && setsB === 0) {
        if (m.winner_id === m.player_a_id) {
          setsA = 2; setsB = 0;
        } else {
          setsA = 0; setsB = 2;
        }
      }

      return {
        id: m.id,
        player1Id: m.player_a_id,
        player2Id: m.player_b_id,
        score1: setsA,
        score2: setsB,
        winnerId: m.winner_id,
        notes: m.coach_note || m.key_mistake || '',
        date: m.date || new Date().toISOString()
      };
    });

    // Map trainings
    const uiTrainings = trainingData.map(t => ({
      id: t.id,
      date: t.date || new Date().toISOString(),
      playerId: t.player_id,
      coach: t.coach || '',
      topic: t.topic || '',
      duration: Number(t.duration_min) || 0,
      intensity: Number(t.intensity_1_5) || 3,
      score: Number(t.score_1_10) || 7,
      feedback: t.coach_feedback || '',
      homework: t.homework || '',
      nextActionDate: t.next_action_date || '',
      attendanceStatus: t.attendance_status || 'Present',
      beforeLevel: Number(t.before_level) || 5,
      afterLevel: Number(t.after_level) || 6,
      improvementNote: t.improvement_note || ''
    }));

    return new Response(JSON.stringify({ players: uiPlayers, matches: uiMatches, trainings: uiTrainings }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });
  }
}

// POST /api/players
async function savePlayers(request, env) {
  try {
    const players = await request.json();
    if (!Array.isArray(players)) {
      return new Response(JSON.stringify({ error: "Invalid players list" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
      });
    }

    const statements = [];

    // Prepare insertions
    players.forEach((p, idx) => {
      statements.push(
        env.DB.prepare(`
          INSERT INTO players (id, name, nickname, phone, email, date_joined, status, skill_level, play_style, hand, notes, created_at, updated_at, active_flag)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            nickname = excluded.nickname,
            phone = excluded.phone,
            email = excluded.email,
            status = excluded.status,
            skill_level = excluded.skill_level,
            play_style = excluded.play_style,
            hand = excluded.hand,
            notes = excluded.notes,
            updated_at = excluded.updated_at,
            active_flag = excluded.active_flag
        `).bind(
          p.id,
          p.name,
          p.name.split(' ')[0] || '',
          p.phone || '',
          p.email || '',
          p.createdAt || new Date().toISOString(),
          capitalize(p.status),
          capitalize(p.skill),
          capitalize(p.style),
          capitalize(p.hand),
          p.notes || '',
          p.createdAt || new Date().toISOString(),
          new Date().toISOString(),
          p.status === 'inactive' ? 0 : 1
        )
      );

      // Skills assessment
      const attr = p.attributes || { pace: 70, power: 70, control: 70, defense: 70, stamina: 70, tactics: 70 };
      const footwork = Math.round((attr.pace || 70) / 10);
      const smash = Math.round((attr.power || 70) / 10);
      const netPlay = Math.round((attr.control || 70) / 10);
      const defense = Math.round((attr.defense || 70) / 10);
      const stamina = Math.round((attr.stamina || 70) / 10);
      const tactics = Math.round((attr.tactics || 70) / 10);
      const overall = (footwork + smash + netPlay + defense + stamina + tactics) / 6;
      const overallScore = Math.round(overall * 10) / 10;
      const assessmentId = `ASSET_${p.id}`;

      statements.push(
        env.DB.prepare(`
          INSERT INTO skill_assessments (assessment_id, date, player_id, footwork, serve, smash, defense, drive, net_play, tactics, stamina, teamwork, overall_score, assessor, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(assessment_id) DO UPDATE SET
            date = excluded.date,
            footwork = excluded.footwork,
            smash = excluded.smash,
            defense = excluded.defense,
            drive = excluded.drive,
            net_play = excluded.net_play,
            tactics = excluded.tactics,
            stamina = excluded.stamina,
            overall_score = excluded.overall_score,
            notes = excluded.notes
        `).bind(
          assessmentId,
          new Date().toISOString(),
          p.id,
          footwork,
          6, // serve
          smash,
          defense,
          netPlay, // drive
          netPlay, // net_play
          tactics,
          stamina,
          7, // teamwork
          overallScore,
          'Coach A',
          p.notes || ''
        )
      );
    });

    // Deletion of missing players and their skills
    if (players.length > 0) {
      const placeholders = players.map(() => '?').join(',');
      const ids = players.map(p => p.id);
      statements.push(
        env.DB.prepare(`DELETE FROM players WHERE id NOT IN (${placeholders})`).bind(...ids)
      );
      statements.push(
        env.DB.prepare(`DELETE FROM skill_assessments WHERE player_id NOT IN (${placeholders})`).bind(...ids)
      );
    } else {
      statements.push(env.DB.prepare(`DELETE FROM players`));
      statements.push(env.DB.prepare(`DELETE FROM skill_assessments`));
    }

    await env.DB.batch(statements);

    return new Response(JSON.stringify({ message: "Players & Skills updated successfully" }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });
  }
}

// POST /api/matches
async function saveMatches(request, env) {
  try {
    const matches = await request.json();
    if (!Array.isArray(matches)) {
      return new Response(JSON.stringify({ error: "Invalid matches list" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
      });
    }

    const statements = [];

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

      statements.push(
        env.DB.prepare(`
          INSERT INTO matches (id, date, match_type, player_a_id, player_b_id, score_set_1, score_set_2, score_set_3, winner_id, result_a, result_b, coach_note, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            date = excluded.date,
            player_a_id = excluded.player_a_id,
            player_b_id = excluded.player_b_id,
            score_set_1 = excluded.score_set_1,
            score_set_2 = excluded.score_set_2,
            score_set_3 = excluded.score_set_3,
            winner_id = excluded.winner_id,
            result_a = excluded.result_a,
            result_b = excluded.result_b,
            coach_note = excluded.coach_note,
            updated_at = excluded.updated_at
        `).bind(
          m.id,
          m.date || new Date().toISOString(),
          'Singles',
          m.player1Id,
          m.player2Id,
          set1,
          set2,
          set3,
          m.winnerId,
          resultA,
          resultB,
          m.notes || '',
          m.date || new Date().toISOString(),
          new Date().toISOString()
        )
      );
    });

    if (matches.length > 0) {
      const placeholders = matches.map(() => '?').join(',');
      const ids = matches.map(m => m.id);
      statements.push(
        env.DB.prepare(`DELETE FROM matches WHERE id NOT IN (${placeholders})`).bind(...ids)
      );
    } else {
      statements.push(env.DB.prepare(`DELETE FROM matches`));
    }

    await env.DB.batch(statements);

    return new Response(JSON.stringify({ message: "Match Logs updated successfully" }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });
  }
}

// POST /api/trainings
async function saveTrainings(request, env) {
  try {
    const trainings = await request.json();
    if (!Array.isArray(trainings)) {
      return new Response(JSON.stringify({ error: "Invalid trainings list" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
      });
    }

    const statements = [];

    trainings.forEach(t => {
      statements.push(
        env.DB.prepare(`
          INSERT INTO trainings (id, date, player_id, coach, topic, duration_min, intensity_1_5, score_1_10, focus_point, coach_feedback, homework, next_action_date, attendance_status, before_level, after_level, improvement_note, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            date = excluded.date,
            player_id = excluded.player_id,
            coach = excluded.coach,
            topic = excluded.topic,
            duration_min = excluded.duration_min,
            intensity_1_5 = excluded.intensity_1_5,
            score_1_10 = excluded.score_1_10,
            focus_point = excluded.focus_point,
            coach_feedback = excluded.coach_feedback,
            homework = excluded.homework,
            next_action_date = excluded.next_action_date,
            attendance_status = excluded.attendance_status,
            before_level = excluded.before_level,
            after_level = excluded.after_level,
            improvement_note = excluded.improvement_note,
            updated_at = excluded.updated_at
        `).bind(
          t.id,
          t.date || new Date().toISOString(),
          t.playerId,
          t.coach || 'Coach A',
          t.topic || '',
          t.duration || 60,
          t.intensity || 3,
          t.score || 7,
          t.topic || '',
          t.feedback || '',
          t.homework || '',
          t.nextActionDate || null,
          t.attendanceStatus || 'Present',
          t.beforeLevel || 5,
          t.afterLevel || 6,
          t.improvementNote || '',
          t.date || new Date().toISOString(),
          new Date().toISOString()
        )
      );
    });

    if (trainings.length > 0) {
      const placeholders = trainings.map(() => '?').join(',');
      const ids = trainings.map(t => t.id);
      statements.push(
        env.DB.prepare(`DELETE FROM trainings WHERE id NOT IN (${placeholders})`).bind(...ids)
      );
    } else {
      statements.push(env.DB.prepare(`DELETE FROM trainings`));
    }

    await env.DB.batch(statements);

    return new Response(JSON.stringify({ message: "Training Logs updated successfully" }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });
  }
}

function buildSheet(title, desc, headers, rows) {
  const aoa = [
    [title],
    [desc],
    [],
    headers,
    ...rows
  ];
  return XLSX.utils.aoa_to_sheet(aoa);
}

// GET /api/export
async function exportExcel(env) {
  try {
    const playersQuery = env.DB.prepare("SELECT * FROM players").all();
    const skillsQuery = env.DB.prepare("SELECT * FROM skill_assessments").all();
    const matchesQuery = env.DB.prepare("SELECT * FROM matches").all();
    const trainingsQuery = env.DB.prepare("SELECT * FROM trainings").all();

    const [playersRes, skillsRes, matchesRes, trainingsRes] = await Promise.all([
      playersQuery,
      skillsQuery,
      matchesQuery,
      trainingsQuery
    ]);

    const wb = XLSX.utils.book_new();

    // 1. Members
    const membersRows = (playersRes.results || []).map(p => [
      p.id,
      p.name,
      p.nickname || '',
      p.phone || '',
      p.email || '',
      isoToExcelDate(p.date_joined),
      p.status || 'Active',
      p.skill_level || 'Intermediate',
      p.play_style || 'All',
      p.hand || 'Right',
      isoToExcelDate(p.birth_date),
      p.age,
      p.dominant_position || '',
      p.strengths || '',
      p.weaknesses || '',
      p.notes || '',
      p.photo_url || '',
      p.emergency_contact || '',
      isoToExcelDate(p.created_at),
      isoToExcelDate(p.updated_at),
      p.active_flag
    ]);
    const membersHeaders = [
      'Player_ID', 'Full_Name', 'Nickname', 'Phone', 'Email', 'Date_Joined', 'Status', 
      'Skill_Level', 'Play_Style', 'Hand', 'Birth_Date', 'Age', 'Dominant_Position', 
      'Strengths', 'Weaknesses', 'Coach_Notes', 'Photo_URL', 'Emergency_Contact', 
      'Created_At', 'Updated_At', 'Active_Flag'
    ];
    const membersSheet = buildSheet(
      "Members Master Data", 
      "ฐานข้อมูลสมาชิกหลัก สำหรับเชื่อมกับ Front end และใช้ Player_ID อ้างอิงทุกชีต", 
      membersHeaders, 
      membersRows
    );
    XLSX.utils.book_append_sheet(wb, membersSheet, "Members");

    // 2. Skill_Assessment
    const skillRows = (skillsRes.results || []).map(s => [
      s.assessment_id,
      isoToExcelDate(s.date),
      s.player_id,
      s.player_name || '',
      s.footwork,
      s.serve || 6,
      s.smash,
      s.defense,
      s.drive || 6,
      s.net_play,
      s.tactics,
      s.stamina,
      s.teamwork || 7,
      s.overall_score,
      s.assessor || 'Coach A',
      s.notes || ''
    ]);
    const skillHeaders = [
      'Assessment_ID', 'Date', 'Player_ID', 'Player_Name', 'Footwork', 'Serve', 
      'Smash', 'Defense', 'Drive', 'Net_Play', 'Tactics', 'Stamina', 'Teamwork', 
      'Overall_Score', 'Assessor', 'Notes'
    ];
    const skillSheet = buildSheet(
      "Skill Assessment",
      "คะแนนทักษะรายสมาชิก ใช้ทำ radar chart/front-end profile card",
      skillHeaders,
      skillRows
    );
    XLSX.utils.book_append_sheet(wb, skillSheet, "Skill_Assessment");

    // 3. Match_Log
    const matchRows = (matchesRes.results || []).map(m => [
      m.id,
      isoToExcelDate(m.date),
      m.match_type || 'Singles',
      m.player_a_id,
      m.player_a_name || '',
      m.player_b_id,
      m.player_b_name || '',
      m.partner_a_id || '',
      m.partner_b_id || '',
      m.score_set_1 || '',
      m.score_set_2 || '',
      m.score_set_3 || '',
      m.winner_id,
      m.result_a || '',
      m.result_b || '',
      m.key_mistake || '',
      m.coach_note || '',
      isoToExcelDate(m.created_at),
      isoToExcelDate(m.updated_at),
      m.video_url || ''
    ]);
    const matchHeaders = [
      'Match_ID', 'Date', 'Match_Type', 'Player_A_ID', 'Player_A_Name', 'Player_B_ID', 
      'Player_B_Name', 'Partner_A_ID', 'Partner_B_ID', 'Score_Set_1', 'Score_Set_2', 
      'Score_Set_3', 'Winner_ID', 'Result_A', 'Result_B', 'Key_Mistake', 'Coach_Note', 
      'Created_At', 'Updated_At', 'Video_URL'
    ];
    const matchSheet = buildSheet(
      "Match Log",
      "บันทึกผลการแข่ง/ซ้อม match simulation เพื่อคำนวณ win rate",
      matchHeaders,
      matchRows
    );
    XLSX.utils.book_append_sheet(wb, matchSheet, "Match_Log");

    // 4. Training_Log
    const trainingRows = (trainingsRes.results || []).map(t => [
      t.id,
      isoToExcelDate(t.date),
      t.player_id,
      t.player_name || '',
      t.coach || 'Coach A',
      t.topic || '',
      t.duration_min || 60,
      t.intensity_1_5 || 3,
      t.score_1_10 || 7,
      t.focus_point || '',
      t.coach_feedback || '',
      t.homework || '',
      isoToExcelDate(t.next_action_date),
      t.attendance_status || 'Present',
      t.before_level || 5,
      t.after_level || 6,
      t.improvement_note || '',
      isoToExcelDate(t.created_at),
      isoToExcelDate(t.updated_at)
    ]);
    const trainingHeaders = [
      'Training_ID', 'Date', 'Player_ID', 'Player_Name', 'Coach', 'Topic', 'Duration_Min', 
      'Intensity_1_5', 'Score_1_10', 'Focus_Point', 'Coach_Feedback', 'Homework', 
      'Next_Action_Date', 'Attendance_Status', 'Before_Level', 'After_Level', 
      'Improvement_Note', 'Created_At', 'Updated_At'
    ];
    const trainingSheet = buildSheet(
      "Training Log",
      "บันทึกการสอน/ฝึกซ้อมรายครั้ง เชื่อม Player_ID กับ Members",
      trainingHeaders,
      trainingRows
    );
    XLSX.utils.book_append_sheet(wb, trainingSheet, "Training_Log");

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    return new Response(wbout, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="dk_knight_data.xlsx"',
        ...corsHeaders()
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });
  }
}

function getImportData(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const headers = raw[3];
  if (!headers) return [];

  const data = [];
  for (let i = 4; i < raw.length; i++) {
    const row = raw[i];
    if (!row || row.length === 0 || !row[0]) continue;
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

// POST /api/import
async function importExcel(request, env) {
  try {
    let arrayBuffer;
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      if (!file) {
        return new Response(JSON.stringify({ error: "Missing file field in form-data" }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() }
        });
      }
      arrayBuffer = await file.arrayBuffer();
    } else {
      arrayBuffer = await request.arrayBuffer();
    }

    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
    const statements = [];

    // Parse sheets
    const members = getImportData(workbook, 'Members');
    const skillAssessments = getImportData(workbook, 'Skill_Assessment');
    const matches = getImportData(workbook, 'Match_Log');
    const trainings = getImportData(workbook, 'Training_Log');

    // Delete existing
    statements.push(env.DB.prepare("DELETE FROM skill_assessments"));
    statements.push(env.DB.prepare("DELETE FROM players"));
    statements.push(env.DB.prepare("DELETE FROM matches"));
    statements.push(env.DB.prepare("DELETE FROM trainings"));

    // Insert players
    members.forEach(m => {
      statements.push(
        env.DB.prepare(`
          INSERT INTO players (id, name, nickname, phone, email, date_joined, status, skill_level, play_style, hand, birth_date, age, dominant_position, strengths, weaknesses, notes, photo_url, emergency_contact, created_at, updated_at, active_flag)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          m.Player_ID,
          m.Full_Name,
          m.Nickname || '',
          m.Phone || '',
          m.Email || '',
          excelDateToISO(m.Date_Joined),
          m.Status || 'Active',
          m.Skill_Level || 'Intermediate',
          m.Play_Style || 'All',
          m.Hand || 'Right',
          excelDateToISO(m.Birth_Date),
          m.Age ? parseInt(m.Age) : null,
          m.Dominant_Position || '',
          m.Strengths || '',
          m.Weaknesses || '',
          m.Coach_Notes || '',
          m.Photo_URL || '',
          m.Emergency_Contact || '',
          excelDateToISO(m.Created_At) || new Date().toISOString(),
          excelDateToISO(m.Updated_At) || new Date().toISOString(),
          m.Active_Flag !== null && m.Active_Flag !== undefined ? parseInt(m.Active_Flag) : 1
        )
      );
    });

    // Insert skill assessments
    skillAssessments.forEach(s => {
      statements.push(
        env.DB.prepare(`
          INSERT INTO skill_assessments (assessment_id, date, player_id, player_name, footwork, serve, smash, defense, drive, net_play, tactics, stamina, teamwork, overall_score, assessor, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          s.Assessment_ID,
          excelDateToISO(s.Date),
          s.Player_ID,
          s.Player_Name || '',
          s.Footwork ? parseInt(s.Footwork) : null,
          s.Serve ? parseInt(s.Serve) : null,
          s.Smash ? parseInt(s.Smash) : null,
          s.Defense ? parseInt(s.Defense) : null,
          s.Drive ? parseInt(s.Drive) : null,
          s.Net_Play ? parseInt(s.Net_Play) : null,
          s.Tactics ? parseInt(s.Tactics) : null,
          s.Stamina ? parseInt(s.Stamina) : null,
          s.Teamwork ? parseInt(s.Teamwork) : null,
          s.Overall_Score ? parseFloat(s.Overall_Score) : null,
          s.Assessor || 'Coach A',
          s.Notes || ''
        )
      );
    });

    // Insert matches
    matches.forEach(m => {
      statements.push(
        env.DB.prepare(`
          INSERT INTO matches (id, date, match_type, player_a_id, player_a_name, player_b_id, player_b_name, partner_a_id, partner_b_id, score_set_1, score_set_2, score_set_3, winner_id, result_a, result_b, key_mistake, coach_note, created_at, updated_at, video_url)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          m.Match_ID,
          excelDateToISO(m.Date),
          m.Match_Type || 'Singles',
          m.Player_A_ID,
          m.Player_A_Name || '',
          m.Player_B_ID,
          m.Player_B_Name || '',
          m.Partner_A_ID || '',
          m.Partner_B_ID || '',
          m.Score_Set_1 || '',
          m.Score_Set_2 || '',
          m.Score_Set_3 || '',
          m.Winner_ID,
          m.Result_A || '',
          m.Result_B || '',
          m.Key_Mistake || '',
          m.Coach_Note || '',
          excelDateToISO(m.Created_At) || new Date().toISOString(),
          excelDateToISO(m.Updated_At) || new Date().toISOString(),
          m.Video_URL || ''
        )
      );
    });

    // Insert trainings
    trainings.forEach(t => {
      statements.push(
        env.DB.prepare(`
          INSERT INTO trainings (id, date, player_id, player_name, coach, topic, duration_min, intensity_1_5, score_1_10, focus_point, coach_feedback, homework, next_action_date, attendance_status, before_level, after_level, improvement_note, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          t.Training_ID,
          excelDateToISO(t.Date),
          t.Player_ID,
          t.Player_Name || '',
          t.Coach || 'Coach A',
          t.Topic || '',
          t.Duration_Min ? parseInt(t.Duration_Min) : null,
          t.Intensity_1_5 ? parseInt(t.Intensity_1_5) : null,
          t.Score_1_10 ? parseInt(t.Score_1_10) : null,
          t.Focus_Point || '',
          t.Coach_Feedback || '',
          t.Homework || '',
          excelDateToISO(t.Next_Action_Date),
          t.Attendance_Status || 'Present',
          t.Before_Level ? parseInt(t.Before_Level) : null,
          t.After_Level ? parseInt(t.After_Level) : null,
          t.Improvement_Note || '',
          excelDateToISO(t.Created_At) || new Date().toISOString(),
          excelDateToISO(t.Updated_At) || new Date().toISOString()
        )
      );
    });

    await env.DB.batch(statements);

    return new Response(JSON.stringify({ message: "Imported Excel data successfully and replaced D1 database content!" }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });
  }
}
