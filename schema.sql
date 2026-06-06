-- Create Players Table
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nickname TEXT,
  phone TEXT,
  email TEXT,
  date_joined TEXT,
  status TEXT,
  skill_level TEXT,
  play_style TEXT,
  hand TEXT,
  birth_date TEXT,
  age INTEGER,
  dominant_position TEXT,
  strengths TEXT,
  weaknesses TEXT,
  notes TEXT,
  photo_url TEXT,
  emergency_contact TEXT,
  created_at TEXT,
  updated_at TEXT,
  active_flag INTEGER DEFAULT 1
);

-- Create Skill Assessments Table
CREATE TABLE IF NOT EXISTS skill_assessments (
  assessment_id TEXT PRIMARY KEY,
  date TEXT,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  player_name TEXT,
  footwork INTEGER,
  serve INTEGER,
  smash INTEGER,
  defense INTEGER,
  drive INTEGER,
  net_play INTEGER,
  tactics INTEGER,
  stamina INTEGER,
  teamwork INTEGER,
  overall_score REAL,
  assessor TEXT,
  notes TEXT
);

-- Create Matches Table
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  match_type TEXT DEFAULT 'Singles',
  player_a_id TEXT REFERENCES players(id),
  player_a_name TEXT,
  player_b_id TEXT REFERENCES players(id),
  player_b_name TEXT,
  partner_a_id TEXT,
  partner_b_id TEXT,
  score_set_1 TEXT,
  score_set_2 TEXT,
  score_set_3 TEXT,
  winner_id TEXT REFERENCES players(id),
  result_a TEXT,
  result_b TEXT,
  key_mistake TEXT,
  coach_note TEXT,
  created_at TEXT,
  updated_at TEXT,
  video_url TEXT
);

-- Create Trainings Table
CREATE TABLE IF NOT EXISTS trainings (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  player_id TEXT REFERENCES players(id),
  player_name TEXT,
  coach TEXT,
  topic TEXT,
  duration_min INTEGER,
  intensity_1_5 INTEGER,
  score_1_10 INTEGER,
  focus_point TEXT,
  coach_feedback TEXT,
  homework TEXT,
  next_action_date TEXT,
  attendance_status TEXT,
  before_level INTEGER,
  after_level INTEGER,
  improvement_note TEXT,
  created_at TEXT,
  updated_at TEXT
);
