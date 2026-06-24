-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female')),
  address TEXT,
  profile_image_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('student', 'lecturer', 'admin', 'super_admin')) DEFAULT 'student',
  status TEXT CHECK (status IN ('active', 'inactive', 'suspended', 'pending')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ku TEXT,
  name_ar TEXT,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  head_of_department_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Academic Years
CREATE TABLE academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT FALSE
);

-- Semesters
CREATE TABLE semesters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ku TEXT,
  name_ar TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  registration_deadline DATE,
  is_current BOOLEAN DEFAULT FALSE
);

-- Programs/Courses (Degree programs)
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ku TEXT,
  name_ar TEXT,
  code TEXT UNIQUE NOT NULL,
  department_id UUID REFERENCES departments(id),
  duration_years INTEGER NOT NULL,
  degree_level TEXT CHECK (degree_level IN ('bachelor', 'master', 'phd', 'diploma')) DEFAULT 'bachelor',
  total_credits INTEGER,
  description TEXT
);

-- Subjects/Courses
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ku TEXT,
  name_ar TEXT,
  code TEXT UNIQUE NOT NULL,
  credits INTEGER NOT NULL,
  program_id UUID REFERENCES programs(id),
  department_id UUID REFERENCES departments(id),
  semester_number INTEGER,
  description TEXT,
  is_elective BOOLEAN DEFAULT FALSE
);

-- Lecturers (create before students since they're referenced)
CREATE TABLE lecturers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE NOT NULL,
  department_id UUID REFERENCES departments(id),
  title TEXT CHECK (title IN ('assistant_professor', 'associate_professor', 'professor', 'lecturer', 'instructor')),
  specialization TEXT,
  hire_date DATE NOT NULL,
  status TEXT CHECK (status IN ('active', 'on_leave', 'retired', 'terminated')) DEFAULT 'active',
  office_location TEXT
);

-- Students
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  student_number TEXT UNIQUE NOT NULL,
  program_id UUID REFERENCES programs(id),
  admission_date DATE NOT NULL,
  current_semester INTEGER DEFAULT 1,
  status TEXT CHECK (status IN ('active', 'on_leave', 'graduated', 'suspended', 'withdrawn')) DEFAULT 'active',
  advisor_id UUID REFERENCES lecturers(id)
);

-- Class Sections (Course Offerings)
CREATE TABLE class_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id),
  semester_id UUID REFERENCES semesters(id),
  lecturer_id UUID REFERENCES lecturers(id),
  section_number INTEGER NOT NULL,
  schedule TEXT,
  room TEXT,
  capacity INTEGER DEFAULT 50,
  enrolled_count INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('planned', 'open', 'closed', 'cancelled')) DEFAULT 'open'
);

-- Class Schedule Times
CREATE TABLE class_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_section_id UUID REFERENCES class_sections(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT
);

-- Enrollments
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  class_section_id UUID REFERENCES class_sections(id) ON DELETE CASCADE,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status TEXT CHECK (status IN ('registered', 'dropped', 'withdrawn', 'completed')) DEFAULT 'registered',
  midterm_grade NUMERIC(5,2),
  final_grade NUMERIC(5,2),
  letter_grade TEXT,
  UNIQUE(student_id, class_section_id)
);

-- Attendance
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('present', 'absent', 'late', 'excused')) DEFAULT 'present',
  notes TEXT,
  recorded_by UUID REFERENCES profiles(id),
  UNIQUE(enrollment_id, date)
);

-- QR Attendance Sessions
CREATE TABLE qr_attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_section_id UUID REFERENCES class_sections(id),
  date DATE NOT NULL,
  qr_code TEXT NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- QR Attendance Records
CREATE TABLE qr_attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES qr_attendance_sessions(id),
  student_id UUID REFERENCES students(id),
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignments
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_section_id UUID REFERENCES class_sections(id),
  title TEXT NOT NULL,
  title_ku TEXT,
  title_ar TEXT,
  description TEXT,
  max_score NUMERIC(5,2) DEFAULT 100,
  due_date TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  allow_late_submission BOOLEAN DEFAULT FALSE,
  late_penalty NUMERIC(5,2) DEFAULT 10
);

-- Assignment Submissions
CREATE TABLE assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  file_url TEXT,
  text_content TEXT,
  score NUMERIC(5,2),
  feedback TEXT,
  graded_by UUID REFERENCES profiles(id),
  graded_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('submitted', 'late', 'graded', 'returned')) DEFAULT 'submitted',
  UNIQUE(assignment_id, student_id)
);

-- Exams
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_section_id UUID REFERENCES class_sections(id),
  title TEXT NOT NULL,
  title_ku TEXT,
  title_ar TEXT,
  exam_type TEXT CHECK (exam_type IN ('midterm', 'final', 'quiz', 'makeup')) NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  total_marks NUMERIC(5,2) DEFAULT 100,
  room TEXT,
  instructions TEXT,
  is_online BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id)
);

-- Online Exam Questions
CREATE TABLE exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay')) NOT NULL,
  options JSONB,
  correct_answer TEXT,
  points NUMERIC(5,2) NOT NULL,
  order_number INTEGER NOT NULL
);

-- Exam Results
CREATE TABLE exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id),
  score NUMERIC(5,2),
  answers JSONB,
  submitted_at TIMESTAMPTZ,
  graded_by UUID REFERENCES profiles(id),
  graded_at TIMESTAMPTZ,
  UNIQUE(exam_id, student_id)
);

-- Study Materials
CREATE TABLE study_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_section_id UUID REFERENCES class_sections(id),
  uploader_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  title_ku TEXT,
  title_ar TEXT,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcements
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_ku TEXT,
  title_ar TEXT,
  content TEXT NOT NULL,
  content_ku TEXT,
  content_ar TEXT,
  author_id UUID REFERENCES profiles(id),
  target_audience TEXT CHECK (target_audience IN ('all', 'students', 'lecturers', 'department')) DEFAULT 'all',
  department_id UUID REFERENCES departments(id),
  priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  published_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_pinned BOOLEAN DEFAULT FALSE
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('academic', 'financial', 'general', 'urgent')) DEFAULT 'general',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  action_url TEXT
);

-- Tuition and Payments
CREATE TABLE tuition_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id),
  semester_id UUID REFERENCES semesters(id),
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  due_date DATE NOT NULL,
  late_fee NUMERIC(10,2) DEFAULT 0
);

-- Student Tuition Records
CREATE TABLE student_tuition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  tuition_fee_id UUID REFERENCES tuition_fees(id),
  amount_due NUMERIC(10,2) NOT NULL,
  amount_paid NUMERIC(10,2) DEFAULT 0,
  status TEXT CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'waived')) DEFAULT 'pending',
  due_date DATE NOT NULL,
  waived BOOLEAN DEFAULT FALSE,
  waiver_reason TEXT
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_tuition_id UUID REFERENCES student_tuition(id),
  amount NUMERIC(10,2) NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'online')),
  reference_number TEXT,
  receipt_number TEXT,
  recorded_by UUID REFERENCES profiles(id),
  notes TEXT
);

-- Activity Log
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Messages (AI Chat History)
CREATE TABLE ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tuition_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_tuition ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;