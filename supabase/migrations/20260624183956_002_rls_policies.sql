-- Profiles RLS Policies
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  WITH CHECK (auth.uid() = id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "delete_profile" ON profiles FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Departments RLS Policies (all authenticated can read)
CREATE POLICY "select_departments" ON departments FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_departments" ON departments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "update_departments" ON departments FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "delete_departments" ON departments FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Academic Years RLS Policies
CREATE POLICY "select_academic_years" ON academic_years FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_academic_years" ON academic_years FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "update_academic_years" ON academic_years FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "delete_academic_years" ON academic_years FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Semesters RLS Policies
CREATE POLICY "select_semesters" ON semesters FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_semesters" ON semesters FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "update_semesters" ON semesters FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "delete_semesters" ON semesters FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Programs RLS Policies
CREATE POLICY "select_programs" ON programs FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_programs" ON programs FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "update_programs" ON programs FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "delete_programs" ON programs FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Subjects RLS Policies
CREATE POLICY "select_subjects" ON subjects FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_subjects" ON subjects FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "update_subjects" ON subjects FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "delete_subjects" ON subjects FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Students RLS Policies
CREATE POLICY "select_own_student" ON students FOR SELECT
  TO authenticated USING (
    profile_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'lecturer')));

CREATE POLICY "insert_students" ON students FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "update_students" ON students FOR UPDATE
  TO authenticated USING (
    profile_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  WITH CHECK (
    profile_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "delete_students" ON students FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Lecturers RLS Policies
CREATE POLICY "select_lecturers" ON lecturers FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_lecturers" ON lecturers FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "update_lecturers" ON lecturers FOR UPDATE
  TO authenticated USING (
    profile_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  WITH CHECK (
    profile_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "delete_lecturers" ON lecturers FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Class Sections RLS Policies
CREATE POLICY "select_class_sections" ON class_sections FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_class_sections" ON class_sections FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "update_class_sections" ON class_sections FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM lecturers l 
      JOIN profiles p ON l.profile_id = p.id 
      WHERE p.id = auth.uid() AND l.id = class_sections.lecturer_id)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  WITH CHECK (
    EXISTS (SELECT 1 FROM lecturers l 
      JOIN profiles p ON l.profile_id = p.id 
      WHERE p.id = auth.uid() AND l.id = class_sections.lecturer_id)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "delete_class_sections" ON class_sections FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Class Schedules RLS Policies
CREATE POLICY "select_class_schedules" ON class_schedules FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_class_schedules" ON class_schedules FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'lecturer')));

CREATE POLICY "update_class_schedules" ON class_schedules FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'lecturer')))
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'lecturer')));

CREATE POLICY "delete_class_schedules" ON class_schedules FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'lecturer')));

-- Enrollments RLS Policies
CREATE POLICY "select_enrollments" ON enrollments FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM students WHERE id = enrollments.student_id AND profile_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'lecturer')));

CREATE POLICY "insert_enrollments" ON enrollments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM students WHERE profile_id = auth.uid() AND id = enrollments.student_id)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "update_enrollments" ON enrollments FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'lecturer')))
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'lecturer')));

CREATE POLICY "delete_enrollments" ON enrollments FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM students WHERE profile_id = auth.uid() AND id = enrollments.student_id)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Attendance RLS Policies
CREATE POLICY "select_attendance" ON attendance FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM enrollments e 
      JOIN students s ON e.student_id = s.id 
      WHERE e.id = attendance.enrollment_id AND s.profile_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'lecturer')));

CREATE POLICY "insert_attendance" ON attendance FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'lecturer')));

CREATE POLICY "update_attendance" ON attendance FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'lecturer')))
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'lecturer')));

CREATE POLICY "delete_attendance" ON attendance FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- QR Attendance Sessions RLS Policies
CREATE POLICY "select_qr_sessions" ON qr_attendance_sessions FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_qr_sessions" ON qr_attendance_sessions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'lecturer')));

CREATE POLICY "update_qr_sessions" ON qr_attendance_sessions FOR UPDATE
  TO authenticated USING (
    created_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  WITH CHECK (
    created_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "delete_qr_sessions" ON qr_attendance_sessions FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- QR Attendance Records RLS Policies
CREATE POLICY "select_qr_records" ON qr_attendance_records FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_qr_records" ON qr_attendance_records FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "delete_qr_records" ON qr_attendance_records FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Assignments RLS Policies
CREATE POLICY "select_assignments" ON assignments FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_assignments" ON assignments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'lecturer')));

CREATE POLICY "update_assignments" ON assignments FOR UPDATE
  TO authenticated USING (
    created_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  WITH CHECK (
    created_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "delete_assignments" ON assignments FOR DELETE
  TO authenticated USING (
    created_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Assignment Submissions RLS Policies
CREATE POLICY "select_submissions" ON assignment_submissions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM students WHERE profile_id = auth.uid() AND id = assignment_submissions.student_id)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'lecturer')));

CREATE POLICY "insert_submissions" ON assignment_submissions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM students WHERE profile_id = auth.uid()));

CREATE POLICY "update_submissions" ON assignment_submissions FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'lecturer')))
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'lecturer')));

CREATE POLICY "delete_submissions" ON assignment_submissions FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Exams RLS Policies
CREATE POLICY "select_exams" ON exams FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_exams" ON exams FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'lecturer')));

CREATE POLICY "update_exams" ON exams FOR UPDATE
  TO authenticated USING (
    created_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  WITH CHECK (
    created_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "delete_exams" ON exams FOR DELETE
  TO authenticated USING (
    created_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Exam Questions RLS Policies
CREATE POLICY "select_exam_questions" ON exam_questions FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_exam_questions" ON exam_questions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'lecturer')));

CREATE POLICY "update_exam_questions" ON exam_questions FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'lecturer')))
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'lecturer')));

CREATE POLICY "delete_exam_questions" ON exam_questions FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'lecturer')));

-- Exam Results RLS Policies
CREATE POLICY "select_exam_results" ON exam_results FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM students WHERE profile_id = auth.uid() AND id = exam_results.student_id)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'lecturer')));

CREATE POLICY "insert_exam_results" ON exam_results FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "update_exam_results" ON exam_results FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'lecturer')))
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'lecturer')));

CREATE POLICY "delete_exam_results" ON exam_results FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Study Materials RLS Policies
CREATE POLICY "select_study_materials" ON study_materials FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_study_materials" ON study_materials FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'lecturer')));

CREATE POLICY "update_study_materials" ON study_materials FOR UPDATE
  TO authenticated USING (
    uploader_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  WITH CHECK (
    uploader_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "delete_study_materials" ON study_materials FOR DELETE
  TO authenticated USING (
    uploader_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Announcements RLS Policies
CREATE POLICY "select_announcements" ON announcements FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_announcements" ON announcements FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "update_announcements" ON announcements FOR UPDATE
  TO authenticated USING (
    author_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  WITH CHECK (
    author_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "delete_announcements" ON announcements FOR DELETE
  TO authenticated USING (
    author_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Notifications RLS Policies
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "insert_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "update_notifications" ON notifications FOR UPDATE
  TO authenticated USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "delete_notifications" ON notifications FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- Tuition Fees RLS Policies
CREATE POLICY "select_tuition_fees" ON tuition_fees FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_tuition_fees" ON tuition_fees FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "update_tuition_fees" ON tuition_fees FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "delete_tuition_fees" ON tuition_fees FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Student Tuition RLS Policies
CREATE POLICY "select_student_tuition" ON student_tuition FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM students WHERE profile_id = auth.uid() AND id = student_tuition.student_id)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "insert_student_tuition" ON student_tuition FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "update_student_tuition" ON student_tuition FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "delete_student_tuition" ON student_tuition FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Payments RLS Policies
CREATE POLICY "select_payments" ON payments FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM student_tuition st
      JOIN students s ON st.student_id = s.id
      WHERE st.id = payments.student_tuition_id AND s.profile_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "insert_payments" ON payments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "update_payments" ON payments FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "delete_payments" ON payments FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Activity Logs RLS Policies
CREATE POLICY "select_activity_logs" ON activity_logs FOR SELECT
  TO authenticated USING (user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "insert_activity_logs" ON activity_logs FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "delete_activity_logs" ON activity_logs FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Settings RLS Policies
CREATE POLICY "select_settings" ON settings FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_settings" ON settings FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "update_settings" ON settings FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'))
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- AI Chat Sessions RLS Policies
CREATE POLICY "select_own_ai_sessions" ON ai_chat_sessions FOR SELECT
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "insert_ai_sessions" ON ai_chat_sessions FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_ai_sessions" ON ai_chat_sessions FOR UPDATE
  TO authenticated USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "delete_ai_sessions" ON ai_chat_sessions FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- AI Chat Messages RLS Policies
CREATE POLICY "select_own_ai_messages" ON ai_chat_messages FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM ai_chat_sessions WHERE id = ai_chat_messages.session_id AND user_id = auth.uid()));

CREATE POLICY "insert_ai_messages" ON ai_chat_messages FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM ai_chat_sessions WHERE id = ai_chat_messages.session_id AND user_id = auth.uid()));

CREATE POLICY "delete_ai_messages" ON ai_chat_messages FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM ai_chat_sessions WHERE id = ai_chat_messages.session_id AND user_id = auth.uid()));