-- ============================================================================
-- LEARNLY PRO — Relational SQL Database Schema & Seed Data (SQLite / MySQL / PostgreSQL)
-- ============================================================================

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'teacher')),
  role_title VARCHAR(120) NOT NULL,
  phone VARCHAR(40) DEFAULT '+1 (555) 204-8190',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_name VARCHAR(100) NOT NULL,
  grade_level VARCHAR(40) NOT NULL,
  term VARCHAR(40) DEFAULT 'FALL 2026',
  class_count INTEGER DEFAULT 1,
  progress_pct INTEGER DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  theme_color VARCHAR(20) DEFAULT 'purple',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  course_name VARCHAR(100) NOT NULL,
  grade_level VARCHAR(40) NOT NULL,
  attendance_pct INTEGER DEFAULT 100 CHECK (attendance_pct BETWEEN 0 AND 100),
  letter_grade VARCHAR(10) DEFAULT 'A',
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title VARCHAR(140) NOT NULL,
  subject VARCHAR(80) NOT NULL,
  grade_level VARCHAR(40) NOT NULL,
  start_time VARCHAR(10) NOT NULL,
  room VARCHAR(60) NOT NULL,
  theme_color VARCHAR(20) DEFAULT 'purple',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title VARCHAR(150) NOT NULL,
  course_name VARCHAR(100) NOT NULL,
  grade_level VARCHAR(40) NOT NULL,
  due_date VARCHAR(40) NOT NULL,
  status VARCHAR(25) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In progress', 'Completed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_name VARCHAR(100) NOT NULL,
  assessment_title VARCHAR(140) NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audience VARCHAR(60) NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  published_label VARCHAR(40) DEFAULT 'JUST NOW',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Initial Seed Data
-- ============================================================================

INSERT OR IGNORE INTO users (id, username, email, password_hash, full_name, role, role_title, phone) VALUES
  (1, 'admin', 'admin@learnly.edu', 'Admin@123', 'Olivia Martin', 'admin', 'Mathematics & Science Teacher · System Administrator', '+1 (555) 204-8190'),
  (2, 'teacher', 'olivia.martin@learnly.edu', 'Teacher@123', 'Olivia Martin', 'teacher', 'Mathematics & Science Teacher · Senior Faculty', '+1 (555) 204-8190');

INSERT OR IGNORE INTO courses (id, course_name, grade_level, term, class_count, progress_pct, theme_color) VALUES
  (1, 'Mathematics', 'Grade 9', 'FALL 2026', 2, 72, 'purple'),
  (2, 'Biology', 'Grade 10', 'FALL 2026', 1, 58, 'orange'),
  (3, 'Creative Writing', 'Grade 8', 'FALL 2026', 1, 84, 'blue'),
  (4, 'Physics', 'Grade 10', 'FALL 2026', 1, 46, 'purple'),
  (5, 'World History', 'Grade 8', 'FALL 2026', 1, 63, 'orange'),
  (6, 'Computer Science', 'Grade 9', 'FALL 2026', 1, 35, 'blue');

INSERT OR IGNORE INTO students (id, full_name, email, course_name, grade_level, attendance_pct, letter_grade, avatar_url) VALUES
  (1, 'Emma Wilson', 'emma.wilson@email.com', 'Mathematics', 'Grade 9A', 96, 'A', 'https://i.pravatar.cc/80?img=47'),
  (2, 'Noah Thomas', 'noah.thomas@email.com', 'Biology', 'Grade 10B', 89, 'B+', 'https://i.pravatar.cc/80?img=12'),
  (3, 'Ava Patel', 'ava.patel@email.com', 'Creative Writing', 'Grade 8A', 92, 'A−', 'https://i.pravatar.cc/80?img=44'),
  (4, 'Liam Anderson', 'liam.anderson@email.com', 'Mathematics', 'Grade 9B', 78, 'C+', 'https://i.pravatar.cc/80?img=60'),
  (5, 'Mia Chen', 'mia.chen@email.com', 'Mathematics', 'Grade 9A', 94, 'A', 'https://i.pravatar.cc/80?img=32'),
  (6, 'Ethan Brooks', 'ethan.brooks@email.com', 'Biology', 'Grade 10B', 87, 'B', 'https://i.pravatar.cc/80?img=11'),
  (7, 'Sophia Garcia', 'sophia.garcia@email.com', 'Creative Writing', 'Grade 8A', 98, 'A', 'https://i.pravatar.cc/80?img=45'),
  (8, 'Jackson Reed', 'jackson.reed@email.com', 'Mathematics', 'Grade 9B', 82, 'B−', 'https://i.pravatar.cc/80?img=14'),
  (9, 'Isabella Moore', 'isabella.moore@email.com', 'Biology', 'Grade 10B', 91, 'A−', 'https://i.pravatar.cc/80?img=49'),
  (10, 'Lucas Kim', 'lucas.kim@email.com', 'Mathematics', 'Grade 9A', 89, 'B+', 'https://i.pravatar.cc/80?img=68');

INSERT OR IGNORE INTO schedule (id, title, subject, grade_level, start_time, room, theme_color) VALUES
  (1, 'Introduction to Algebra', 'Mathematics', 'Grade 9A', '09:00', 'Room 204', 'purple'),
  (2, 'Biology: Cell Structure', 'Science', 'Grade 10B', '10:30', 'Lab 03', 'orange'),
  (3, 'Creative Writing', 'English', 'Grade 8A', '13:00', 'Room 108', 'blue'),
  (4, 'Geometry Essentials', 'Mathematics', 'Grade 9B', '14:30', 'Room 204', 'green');

INSERT OR IGNORE INTO assignments (id, title, course_name, grade_level, due_date, status) VALUES
  (1, 'Algebra problem set', 'Mathematics', 'Grade 9A', 'Nov 24, 2026', 'Pending'),
  (2, 'Cell structure worksheet', 'Biology', 'Grade 10B', 'Nov 26, 2026', 'In progress'),
  (3, 'My favorite story', 'English', 'Grade 8A', 'Nov 30, 2026', 'Pending');

INSERT OR IGNORE INTO results (id, student_name, assessment_title, score, avatar_url) VALUES
  (1, 'Emma Wilson', 'Algebra quiz', 92, 'https://i.pravatar.cc/80?img=47'),
  (2, 'Noah Thomas', 'Cell biology test', 84, 'https://i.pravatar.cc/80?img=12'),
  (3, 'Ava Patel', 'Writing assignment', 96, 'https://i.pravatar.cc/80?img=44');

INSERT OR IGNORE INTO announcements (id, audience, title, message, published_label) VALUES
  (1, 'SCHOOL-WIDE', 'Parent-teacher conference week is coming up!', 'Sign up for your preferred time slots by Friday, November 27. The scheduling link has been sent to all families.', '2 HOURS AGO'),
  (2, 'ACADEMIC NEWS', 'Science fair registration is open', 'Students can register their project teams with the science department by the end of this week.', 'YESTERDAY'),
  (3, 'TEACHING UPDATE', 'Midterm progress reports are available', 'Review your class reports and share any follow-up notes with families before Friday.', 'MONDAY');
