import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './i18n';

import Layout from './components/Layout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import StudentCoursesPage from './pages/student/CoursesPage';
import StudentSchedulePage from './pages/student/SchedulePage';
import StudentGradesPage from './pages/student/GradesPage';
import StudentAttendancePage from './pages/student/AttendancePage';
import LecturerAttendancePage from './pages/lecturer/AttendancePage';
import AdminStudentsPage from './pages/admin/StudentsPage';
import AIAssistantPage from './pages/AIAssistantPage';
import AnnouncementsPage from './pages/AnnouncementsPage';

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  roles?: ('student' | 'lecturer' | 'admin' | 'super_admin')[];
}> = ({ children, roles }) => {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (profile) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Student Routes */}
        <Route
          path="student/courses"
          element={
            <ProtectedRoute roles={['student']}>
              <StudentCoursesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="student/schedule"
          element={
            <ProtectedRoute roles={['student']}>
              <StudentSchedulePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="student/grades"
          element={
            <ProtectedRoute roles={['student']}>
              <StudentGradesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="student/attendance"
          element={
            <ProtectedRoute roles={['student']}>
              <StudentAttendancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="student/payments"
          element={
            <ProtectedRoute roles={['student']}>
              <StudentGradesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="student/assignments"
          element={
            <ProtectedRoute roles={['student']}>
              <StudentGradesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="student/materials"
          element={
            <ProtectedRoute roles={['student']}>
              <StudentGradesPage />
            </ProtectedRoute>
          }
        />

        {/* Lecturer Routes */}
        <Route
          path="lecturer/courses"
          element={
            <ProtectedRoute roles={['lecturer']}>
              <StudentCoursesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="lecturer/students"
          element={
            <ProtectedRoute roles={['lecturer']}>
              <AdminStudentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="lecturer/grades"
          element={
            <ProtectedRoute roles={['lecturer']}>
              <StudentGradesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="lecturer/attendance"
          element={
            <ProtectedRoute roles={['lecturer']}>
              <LecturerAttendancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="lecturer/assignments"
          element={
            <ProtectedRoute roles={['lecturer']}>
              <StudentGradesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="lecturer/materials"
          element={
            <ProtectedRoute roles={['lecturer']}>
              <StudentGradesPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="admin/students"
          element={
            <ProtectedRoute roles={['admin', 'super_admin']}>
              <AdminStudentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/lecturers"
          element={
            <ProtectedRoute roles={['admin', 'super_admin']}>
              <AdminStudentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/departments"
          element={
            <ProtectedRoute roles={['admin', 'super_admin']}>
              <AdminStudentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/courses"
          element={
            <ProtectedRoute roles={['admin', 'super_admin']}>
              <AdminStudentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/academic-years"
          element={
            <ProtectedRoute roles={['admin', 'super_admin']}>
              <AdminStudentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/payments"
          element={
            <ProtectedRoute roles={['admin', 'super_admin']}>
              <StudentGradesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/reports"
          element={
            <ProtectedRoute roles={['admin', 'super_admin']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/settings"
          element={
            <ProtectedRoute roles={['super_admin']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Shared Routes */}
        <Route path="exams" element={<StudentGradesPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="notifications" element={<AnnouncementsPage />} />
        <Route path="ai-assistant" element={<AIAssistantPage />} />
        <Route path="profile" element={<StudentGradesPage />} />
        <Route path="settings" element={<StudentGradesPage />} />
        <Route path="help" element={<StudentGradesPage />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
