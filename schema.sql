-- ==========================================================
-- Student Attendance Management System
-- Relational Database Schema & Seed Data (PostgreSQL / MySQL compatible)
-- ==========================================================

-- 1. Create Enums / Types (PostgreSQL syntax)
-- Note: In MySQL, use VARCHAR with CHECK constraints or ENUM()
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('instructor', 'registrar');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN
        CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_status') THEN
        CREATE TYPE student_status AS ENUM ('Active', 'Inactive', 'Transferred');
    END IF;
END $$;

-- ----------------------------------------------------------
-- Table: users
-- Stores instructors, registrars, and system administrators
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('instructor', 'registrar')),
    title VARCHAR(100),
    department VARCHAR(100),
    email VARCHAR(120) UNIQUE NOT NULL,
    mobile_number VARCHAR(50),
    employee_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------
-- Table: classes
-- Stores academic sections, grade levels, rooms, and advisers
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS classes (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,               -- e.g. 'Grade 10 - Rizal'
    grade_level VARCHAR(50) NOT NULL,         -- e.g. 'Grade 10'
    section VARCHAR(50) NOT NULL,             -- e.g. 'Rizal'
    academic_year VARCHAR(20) NOT NULL,       -- e.g. '2025-2026'
    room VARCHAR(50),                         -- e.g. 'Room 201 (Main Wing)'
    adviser VARCHAR(120),                     -- e.g. 'Prof. Elena Vance'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_class_section UNIQUE (grade_level, section, academic_year)
);

-- ----------------------------------------------------------
-- Table: subjects
-- Stores curriculum course subjects, units, and departments
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS subjects (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,         -- e.g. 'BIO-101'
    name VARCHAR(150) NOT NULL,               -- e.g. 'General Biology & Ecology'
    department VARCHAR(100) NOT NULL,         -- e.g. 'Natural Sciences'
    units INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------
-- Table: students
-- Stores student directory and class assignments
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(64) PRIMARY KEY,
    student_number VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'STD-2026-0101'
    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80) NOT NULL,
    middle_name VARCHAR(80),
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    class_id VARCHAR(64) NOT NULL,
    email VARCHAR(120),
    guardian_name VARCHAR(120),
    guardian_phone VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Transferred')),
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_students_class FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- ----------------------------------------------------------
-- Table: attendance_records
-- Represents a single attendance session submitted by an instructor
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance_records (
    id VARCHAR(64) PRIMARY KEY,
    class_id VARCHAR(64) NOT NULL,
    subject_id VARCHAR(64) NOT NULL,
    attendance_date DATE NOT NULL,
    time_slot VARCHAR(50),                     -- e.g. '08:00 AM - 09:30 AM'
    recorded_by_user_id VARCHAR(64) NOT NULL,
    recorded_by_name VARCHAR(120) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_record_class FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_record_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_record_user FOREIGN KEY (recorded_by_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT uq_class_subject_date UNIQUE (class_id, subject_id, attendance_date)
);

-- ----------------------------------------------------------
-- Table: attendance_entries
-- Individual student status within an attendance session
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance_entries (
    id BIGSERIAL PRIMARY KEY,
    attendance_record_id VARCHAR(64) NOT NULL,
    student_id VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    remarks VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_entry_record FOREIGN KEY (attendance_record_id) REFERENCES attendance_records(id) ON DELETE CASCADE,
    CONSTRAINT fk_entry_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT uq_record_student UNIQUE (attendance_record_id, student_id)
);

-- ==========================================================
-- INDEXES FOR FAST QUERYING AND AUDITING
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_class_subject ON attendance_records(class_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_attendance_entries_student ON attendance_entries(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_entries_status ON attendance_entries(status);

-- ==========================================================
-- SEED DATA
-- ==========================================================

-- 1. Insert Initial Users
INSERT INTO users (id, username, password_hash, full_name, role, title, department, email)
VALUES 
  ('user-inst-1', 'instructor', 'password123', 'Prof. Elena Vance', 'instructor', 'Senior Faculty Instructor', 'Department of Natural Sciences', 'elena.vance@oakridge.edu'),
  ('user-inst-2', 'instructor2', 'password123', 'Mr. Arthur Morales', 'instructor', 'Mathematics Instructor', 'Department of Mathematics', 'arthur.morales@oakridge.edu'),
  ('user-reg-1', 'registrar', 'password123', 'Dr. Evelyn Reed', 'registrar', 'Head Registrar & Records Officer', 'Office of the Registrar', 'registrar@oakridge.edu')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Classes
INSERT INTO classes (id, name, grade_level, section, academic_year, room, adviser)
VALUES 
  ('cls-1', 'Grade 10 - Rizal', 'Grade 10', 'Rizal', '2025-2026', 'Room 201 (Main Wing)', 'Prof. Elena Vance'),
  ('cls-2', 'Grade 10 - Bonifacio', 'Grade 10', 'Bonifacio', '2025-2026', 'Room 204 (East Hall)', 'Mr. Arthur Morales'),
  ('cls-3', 'Grade 11 - STEM Alpha', 'Grade 11', 'STEM Alpha', '2025-2026', 'Science Lab 3', 'Dr. Evelyn Reed'),
  ('cls-4', 'Grade 12 - ABM Omega', 'Grade 12', 'ABM Omega', '2025-2026', 'Business Hall 102', 'Ms. Clara Salazar')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Subjects
INSERT INTO subjects (id, code, name, department, units)
VALUES
  ('sub-1', 'BIO-101', 'General Biology & Ecology', 'Natural Sciences', 3),
  ('sub-2', 'MTH-201', 'Advanced Algebra & Functions', 'Mathematics', 4),
  ('sub-3', 'PHY-102', 'General Physics I', 'Natural Sciences', 3),
  ('sub-4', 'ENG-104', 'Academic Writing & Literature', 'Humanities', 3),
  ('sub-5', 'CSC-110', 'Introduction to Computer Science', 'Information Technology', 3)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Students
INSERT INTO students (id, student_number, first_name, last_name, middle_name, gender, class_id, email, guardian_name, guardian_phone, status, enrollment_date)
VALUES
  ('std-1', 'STD-2026-0101', 'Marcus', 'Aquino', 'Dela Cruz', 'Male', 'cls-1', 'marcus.aquino@student.oakridge.edu', 'Roberto Aquino', '+1 (555) 234-5678', 'Active', '2025-08-15'),
  ('std-2', 'STD-2026-0102', 'Sophia', 'Castillo', 'Reyes', 'Female', 'cls-1', 'sophia.castillo@student.oakridge.edu', 'Maria Castillo', '+1 (555) 345-6789', 'Active', '2025-08-15'),
  ('std-3', 'STD-2026-0103', 'Liam', 'Del Rosario', 'Santos', 'Male', 'cls-1', 'liam.delrosario@student.oakridge.edu', 'Grace Del Rosario', '+1 (555) 456-7890', 'Active', '2025-08-16'),
  ('std-4', 'STD-2026-0104', 'Emma', 'Garcia', 'Luna', 'Female', 'cls-1', 'emma.garcia@student.oakridge.edu', 'Carlos Garcia', '+1 (555) 567-8901', 'Active', '2025-08-16'),
  ('std-5', 'STD-2026-0105', 'Noah', 'Mendoza', 'Torres', 'Male', 'cls-1', 'noah.mendoza@student.oakridge.edu', 'Patricia Mendoza', '+1 (555) 678-9012', 'Active', '2025-08-17'),
  ('std-6', 'STD-2026-0106', 'Isabella', 'Navarro', 'Flores', 'Female', 'cls-1', 'isabella.navarro@student.oakridge.edu', 'Diego Navarro', '+1 (555) 789-0123', 'Active', '2025-08-17'),
  ('std-7', 'STD-2026-0201', 'Ethan', 'Perez', 'Gomez', 'Male', 'cls-2', 'ethan.perez@student.oakridge.edu', 'Angela Perez', '+1 (555) 890-1234', 'Active', '2025-08-18'),
  ('std-8', 'STD-2026-0202', 'Ava', 'Ramirez', 'Diaz', 'Female', 'cls-2', 'ava.ramirez@student.oakridge.edu', 'Manuel Ramirez', '+1 (555) 901-2345', 'Active', '2025-08-18'),
  ('std-9', 'STD-2026-0203', 'Lucas', 'Soriano', 'Villanueva', 'Male', 'cls-2', 'lucas.soriano@student.oakridge.edu', 'Carmen Soriano', '+1 (555) 012-3456', 'Active', '2025-08-19'),
  ('std-10', 'STD-2026-0301', 'Benjamin', 'Tan', 'Lim', 'Male', 'cls-3', 'benjamin.tan@student.oakridge.edu', 'Howard Tan', '+1 (555) 123-4560', 'Active', '2025-08-20'),
  ('std-11', 'STD-2026-0302', 'Chloe', 'Valdez', 'Alcantara', 'Female', 'cls-3', 'chloe.valdez@student.oakridge.edu', 'Theresa Valdez', '+1 (555) 234-5671', 'Active', '2025-08-20'),
  ('std-12', 'STD-2026-0303', 'Daniel', 'Yu', 'Chua', 'Male', 'cls-3', 'daniel.yu@student.oakridge.edu', 'Winston Yu', '+1 (555) 345-6782', 'Active', '2025-08-21')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Sample Attendance Record
INSERT INTO attendance_records (id, class_id, subject_id, attendance_date, time_slot, recorded_by_user_id, recorded_by_name, notes)
VALUES 
  ('att-rec-1', 'cls-1', 'sub-1', CURRENT_DATE, '08:00 AM - 09:30 AM', 'user-inst-1', 'Prof. Elena Vance', 'Laboratory session on Cell Structure.')
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Attendance Entries for the Record
INSERT INTO attendance_entries (attendance_record_id, student_id, status, remarks)
VALUES
  ('att-rec-1', 'std-1', 'present', NULL),
  ('att-rec-1', 'std-2', 'present', NULL),
  ('att-rec-1', 'std-3', 'late', 'Bus breakdown delay'),
  ('att-rec-1', 'std-4', 'present', NULL),
  ('att-rec-1', 'std-5', 'absent', 'Unexcused'),
  ('att-rec-1', 'std-6', 'present', NULL)
ON CONFLICT (attendance_record_id, student_id) DO NOTHING;

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR SUPABASE
-- Ensures the application can read, insert, update, and delete
-- ==========================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_entries ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow public access for app demo" ON users;
    DROP POLICY IF EXISTS "Allow public access for app demo" ON classes;
    DROP POLICY IF EXISTS "Allow public access for app demo" ON subjects;
    DROP POLICY IF EXISTS "Allow public access for app demo" ON students;
    DROP POLICY IF EXISTS "Allow public access for app demo" ON attendance_records;
    DROP POLICY IF EXISTS "Allow public access for app demo" ON attendance_entries;
END $$;

CREATE POLICY "Allow public access for app demo" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access for app demo" ON classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access for app demo" ON subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access for app demo" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access for app demo" ON attendance_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access for app demo" ON attendance_entries FOR ALL USING (true) WITH CHECK (true);

