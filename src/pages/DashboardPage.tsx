import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { StatBadge } from '../components/ui/Badge';
import { supabase } from '../lib/supabase';
import {
  Users,
  GraduationCap,
  BookOpen,
  Building2,
  FileCheck,
  FileText,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

interface DashboardStats {
  totalStudents: number;
  totalLecturers: number;
  totalCourses: number;
  totalDepartments: number;
  activeEnrollments: number;
  upcomingAssignments: number;
  pendingGrades: number;
  attendanceRate: number;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  created_at: string;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalLecturers: 0,
    totalCourses: 0,
    totalDepartments: 0,
    activeEnrollments: 0,
    upcomingAssignments: 0,
    pendingGrades: 0,
    attendanceRate: 0,
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      const { data: studentsData } = await supabase.from('students').select('id', { count: 'exact', head: true });
      const { data: lecturersData } = await supabase.from('lecturers').select('id', { count: 'exact', head: true });
      const { data: subjectsData } = await supabase.from('subjects').select('id', { count: 'exact', head: true });
      const { data: departmentsData } = await supabase.from('departments').select('id', { count: 'exact', head: true });
      const { data: enrollmentsData } = await supabase.from('enrollments').select('id', { count: 'exact', head: true });

      setStats({
        totalStudents: studentsData?.length || 0,
        totalLecturers: lecturersData?.length || 0,
        totalCourses: subjectsData?.length || 0,
        totalDepartments: departmentsData?.length || 0,
        activeEnrollments: enrollmentsData?.length || 0,
        upcomingAssignments: 5,
        pendingGrades: 12,
        attendanceRate: 92.5,
      });

      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(5);

      if (announcementsData) {
        setAnnouncements(announcementsData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const enrollmentData = [
    { month: 'Sep', students: 120 },
    { month: 'Oct', students: 145 },
    { month: 'Nov', students: 132 },
    { month: 'Dec', students: 168 },
    { month: 'Jan', students: 156 },
    { month: 'Feb', students: 189 },
    { month: 'Mar', students: 201 },
  ];

  const departmentData = [
    { name: 'Computer Science', value: 350, color: '#3B82F6' },
    { name: 'Engineering', value: 280, color: '#10B981' },
    { name: 'Business', value: 220, color: '#F59E0B' },
    { name: 'Medicine', value: 180, color: '#EF4444' },
    { name: 'Law', value: 150, color: '#8B5CF6' },
  ];

  const gradeDistribution = [
    { grade: 'A', count: 145 },
    { grade: 'B', count: 230 },
    { grade: 'C', count: 180 },
    { grade: 'D', count: 95 },
    { grade: 'F', count: 50 },
  ];

  const quickActions = {
    student: [
      { label: t('students.enroll'), icon: BookOpen, path: '/student/courses', color: 'blue' },
      { label: t('students.viewGrades'), icon: FileCheck, path: '/student/grades', color: 'green' },
      { label: t('attendance.scanQR'), icon: FileCheck, path: '/student/attendance', color: 'purple' },
      { label: t('payments.makePayment'), icon: DollarSign, path: '/student/payments', color: 'yellow' },
    ],
    lecturer: [
      { label: t('lecturers.gradeStudents'), icon: FileCheck, path: '/lecturer/grades', color: 'blue' },
      { label: t('lecturers.takeAttendance'), icon: FileCheck, path: '/lecturer/attendance', color: 'green' },
      { label: t('lecturers.uploadMaterials'), icon: FileText, path: '/lecturer/materials', color: 'purple' },
      { label: t('lecturers.createAssignment'), icon: FileText, path: '/lecturer/assignments', color: 'yellow' },
    ],
    admin: [
      { label: t('students.title'), icon: Users, path: '/admin/students', color: 'blue' },
      { label: t('lecturers.title'), icon: GraduationCap, path: '/admin/lecturers', color: 'green' },
      { label: t('courses.title'), icon: BookOpen, path: '/admin/courses', color: 'purple' },
      { label: t('admin.reports'), icon: TrendingUp, path: '/admin/reports', color: 'yellow' },
    ],
    super_admin: [
      { label: t('admin.users'), icon: Users, path: '/admin/users', color: 'blue' },
      { label: t('admin.systemSettings'), icon: Building2, path: '/admin/settings', color: 'green' },
      { label: t('admin.report'), icon: TrendingUp, path: '/admin/reports', color: 'purple' },
      { label: t('admin.auditLog'), icon: AlertCircle, path: '/admin/audit', color: 'yellow' },
    ],
  };

  const userQuickActions = profile?.role ? quickActions[profile.role] || [] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.welcome')}, {profile?.first_name}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('dashboard.recentActivity')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">{t('success')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatBadge
          value={stats.totalStudents}
          label={t('dashboard.totalStudents')}
          icon={<Users className="w-6 h-6" />}
          color="blue"
          trend="up"
          trendValue="12%"
        />
        <StatBadge
          value={stats.totalLecturers}
          label={t('dashboard.totalLecturers')}
          icon={<GraduationCap className="w-6 h-6" />}
          color="green"
          trend="up"
          trendValue="5%"
        />
        <StatBadge
          value={stats.totalCourses}
          label={t('dashboard.totalCourses')}
          icon={<BookOpen className="w-6 h-6" />}
          color="purple"
        />
        <StatBadge
          value={stats.attendanceRate}
          label={`${t('dashboard.attendanceRate')} (%)`}
          icon={<FileCheck className="w-6 h-6" />}
          color="cyan"
          trend="up"
          trendValue="2.5%"
        />
      </div>

      {userQuickActions.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('dashboard.quickActions')}
            </h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {userQuickActions.map((action, index) => {
                const colorClasses = {
                  blue: 'from-blue-500 to-blue-600',
                  green: 'from-green-500 to-green-600',
                  purple: 'from-purple-500 to-purple-600',
                  yellow: 'from-yellow-500 to-yellow-600',
                  red: 'from-red-500 to-red-600',
                };
                return (
                  <Link key={index} to={action.path}>
                    <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[action.color as keyof typeof colorClasses]} flex items-center justify-center text-white`}>
                        <action.icon className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                        {action.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('students.title')} {t('dashboard.recentActivity')}
              </h2>
            </CardHeader>
            <CardBody>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={enrollmentData}>
                    <defs>
                      <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                    <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#F9FAFB',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="students"
                      stroke="#3B82F6"
                      fillOpacity={1}
                      fill="url(#colorStudents)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('students.title')} by {t('nav.departments')}
            </h2>
          </CardHeader>
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#F9FAFB',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('grades.gradeReport')} {t('grades.title')}
              </h2>
            </CardHeader>
            <CardBody>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                    <XAxis dataKey="grade" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#F9FAFB',
                      }}
                    />
                    <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('dashboard.announcements')}
              </h2>
              <Link to="/announcements" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500">
                {t('courses.viewAll') || 'View All'}
              </Link>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {announcements.length > 0 ? (
                announcements.map((announcement) => (
                  <div key={announcement.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                        announcement.priority === 'urgent' ? 'bg-red-500' :
                        announcement.priority === 'high' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {announcement.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {announcement.content}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          {new Date(announcement.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  {t('noData')}
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('dashboard.todaySchedule')}
            </h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {[
                { time: '08:00 - 09:30', subject: 'Introduction to Computer Science', room: 'Room 101', type: 'Lecture' },
                { time: '10:00 - 11:30', subject: 'Data Structures', room: 'Room 205', type: 'Lecture' },
                { time: '14:00 - 16:00', subject: 'Database Systems', room: 'Lab 3', type: 'Lab' },
              ].map((schedule, index) => (
                <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {schedule.subject}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {schedule.room} • {schedule.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {schedule.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('dashboard.deadlineAlerts')}
            </h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {[
                { title: 'Data Structures Assignment', due: 'In 2 days', type: 'assignment', urgent: true },
                { title: 'Database Project Submission', due: 'In 5 days', type: 'project', urgent: false },
                { title: 'Computer Networks Quiz', due: 'In 1 week', type: 'exam', urgent: false },
              ].map((deadline, index) => (
                <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                    deadline.type === 'assignment' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                    deadline.type === 'project' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                    'bg-gradient-to-br from-yellow-500 to-yellow-600'
                  }`}>
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {deadline.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {deadline.due}
                    </p>
                  </div>
                  {deadline.urgent && (
                    <span className="px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-full">
                      Urgent
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
