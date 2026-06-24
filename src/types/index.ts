export type UserRole = 'student' | 'lecturer' | 'admin' | 'super_admin';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';
export type Gender = 'male' | 'female';
export type DegreeLevel = 'bachelor' | 'master' | 'phd' | 'diploma';
export type LecturerTitle = 'assistant_professor' | 'associate_professor' | 'professor' | 'lecturer' | 'instructor';
export type StudentStatus = 'active' | 'on_leave' | 'graduated' | 'suspended' | 'withdrawn';
export type LecturerStatus = 'active' | 'on_leave' | 'retired' | 'terminated';
export type ClassSectionStatus = 'planned' | 'open' | 'closed' | 'cancelled';
export type EnrollmentStatus = 'registered' | 'dropped' | 'withdrawn' | 'completed';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type AssignmentSubmissionStatus = 'submitted' | 'late' | 'graded' | 'returned';
export type ExamType = 'midterm' | 'final' | 'quiz' | 'makeup';
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
export type TuitionStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'waived';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'online';
export type NotificationType = 'academic' | 'financial' | 'general' | 'urgent';
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TargetAudience = 'all' | 'students' | 'lecturers' | 'department';

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  date_of_birth?: string;
  gender?: Gender;
  address?: string;
  profile_image_url?: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  name_ku?: string;
  name_ar?: string;
  code: string;
  description?: string;
  head_of_department_id?: string;
  created_at: string;
}

export interface AcademicYear {
  id: string;
  year: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface Semester {
  id: string;
  academic_year_id: string;
  name: string;
  name_ku?: string;
  name_ar?: string;
  start_date: string;
  end_date: string;
  registration_deadline?: string;
  is_current: boolean;
}

export interface Program {
  id: string;
  name: string;
  name_ku?: string;
  name_ar?: string;
  code: string;
  department_id: string;
  duration_years: number;
  degree_level: DegreeLevel;
  total_credits?: number;
  description?: string;
}

export interface Subject {
  id: string;
  name: string;
  name_ku?: string;
  name_ar?: string;
  code: string;
  credits: number;
  program_id: string;
  department_id: string;
  semester_number?: number;
  description?: string;
  is_elective: boolean;
}

export interface Student {
  id: string;
  profile_id: string;
  student_number: string;
  program_id: string;
  admission_date: string;
  current_semester: number;
  status: StudentStatus;
  advisor_id?: string;
  profile?: Profile;
  program?: Program;
}

export interface Lecturer {
  id: string;
  profile_id: string;
  employee_id: string;
  department_id: string;
  title?: LecturerTitle;
  specialization?: string;
  hire_date: string;
  status: LecturerStatus;
  office_location?: string;
  profile?: Profile;
  department?: Department;
}

export interface ClassSection {
  id: string;
  subject_id: string;
  semester_id: string;
  lecturer_id: string;
  section_number: number;
  schedule?: string;
  room?: string;
  capacity: number;
  enrolled_count: number;
  status: ClassSectionStatus;
  subject?: Subject;
  lecturer_info?: Lecturer;
}

export interface ClassSchedule {
  id: string;
  class_section_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room?: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  class_section_id: string;
  enrollment_date: string;
  status: EnrollmentStatus;
  midterm_grade?: number;
  final_grade?: number;
  letter_grade?: string;
  class_section?: ClassSection;
}

export interface Attendance {
  id: string;
  enrollment_id: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
  recorded_by?: string;
}

export interface QRAttendanceSession {
  id: string;
  class_section_id: string;
  date: string;
  qr_code: string;
  valid_until: string;
  created_by: string;
  is_active: boolean;
}

export interface QRAttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  scanned_at: string;
}

export interface Assignment {
  id: string;
  class_section_id: string;
  title: string;
  title_ku?: string;
  title_ar?: string;
  description?: string;
  max_score: number;
  due_date: string;
  created_by: string;
  created_at: string;
  allow_late_submission: boolean;
  late_penalty: number;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  submitted_at: string;
  file_url?: string;
  text_content?: string;
  score?: number;
  feedback?: string;
  graded_by?: string;
  graded_at?: string;
  status: AssignmentSubmissionStatus;
}

export interface Exam {
  id: string;
  class_section_id: string;
  title: string;
  title_ku?: string;
  title_ar?: string;
  exam_type: ExamType;
  date: string;
  duration_minutes: number;
  total_marks: number;
  room?: string;
  instructions?: string;
  is_online: boolean;
  created_by: string;
}

export interface ExamQuestion {
  id: string;
  exam_id: string;
  question_text: string;
  question_type: QuestionType;
  options?: Record<string, string>;
  correct_answer?: string;
  points: number;
  order_number: number;
}

export interface ExamResult {
  id: string;
  exam_id: string;
  student_id: string;
  score?: number;
  answers?: Record<string, unknown>;
  submitted_at?: string;
  graded_by?: string;
  graded_at?: string;
}

export interface StudyMaterial {
  id: string;
  class_section_id: string;
  uploader_id: string;
  title: string;
  title_ku?: string;
  title_ar?: string;
  description?: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  download_count: number;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  title_ku?: string;
  title_ar?: string;
  content: string;
  content_ku?: string;
  content_ar?: string;
  author_id: string;
  target_audience: TargetAudience;
  department_id?: string;
  priority: AnnouncementPriority;
  published_at: string;
  expires_at?: string;
  is_pinned: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
  action_url?: string;
}

export interface TuitionFee {
  id: string;
  program_id: string;
  semester_id: string;
  amount: number;
  currency: string;
  due_date: string;
  late_fee: number;
}

export interface StudentTuition {
  id: string;
  student_id: string;
  tuition_fee_id: string;
  amount_due: number;
  amount_paid: number;
  status: TuitionStatus;
  due_date: string;
  waived: boolean;
  waiver_reason?: string;
}

export interface Payment {
  id: string;
  student_tuition_id: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference_number?: string;
  receipt_number?: string;
  recorded_by?: string;
  notes?: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AIChatSession {
  id: string;
  user_id: string;
  title?: string;
  created_at: string;
  updated_at: string;
}

export interface AIChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalLecturers: number;
  totalCourses: number;
  totalDepartments: number;
  activeEnrollments: number;
  upcomingAssignments: number;
  pendingGrades: number;
  attendanceRate: number;
}

export interface CourseGrade {
  subject: Subject;
  midterm?: number;
  final?: number;
  letterGrade?: string;
  credits: number;
}

export interface GPACalculation {
  semesterGPA: number;
  cumulativeGPA: number;
  totalCredits: number;
  earnedCredits: number;
}

export type Language = 'en' | 'ku' | 'ar';
export type Theme = 'light' | 'dark';

export interface AppSettings {
  language: Language;
  theme: Theme;
  universityName: string;
  universityLogo?: string;
}
