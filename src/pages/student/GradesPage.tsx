import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import {
  TrendingUp,
  Award,
  BookOpen,
  Search,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

interface CourseGrade {
  id: string;
  subject: {
    name: string;
    code: string;
    credits: number;
  };
  midterm_grade: number | null;
  final_grade: number | null;
  letter_grade: string | null;
}

export default function StudentGradesPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [grades, setGrades] = useState<CourseGrade[]>([]);
  const [loading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [semesterGPA] = useState(3.45);
  const [cumulativeGPA] = useState(3.52);
  const [totalCredits] = useState(96);
  const [earnedCredits] = useState(86);

  useEffect(() => {
    fetchGrades();
  }, [profile]);

  const fetchGrades = async () => {
    if (!profile) return;

    try {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (student) {
        const { data, error } = await supabase
          .from('enrollments')
          .select(`
            *,
            class_section:class_sections(
              subject:subjects(*)
            )
          `)
          .eq('student_id', student.id);

        if (error) throw error;
        setGrades(data || []);
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
    } finally {
      // setLoading(false) is not needed as loading state is now constant
    }
  };

  const gpaTrend = [
    { semester: 'S1 2023', gpa: 3.2 },
    { semester: 'S2 2023', gpa: 3.5 },
    { semester: 'S1 2024', gpa: 3.4 },
    { semester: 'S2 2024', gpa: 3.52 },
  ];

  const gradeDistribution = [
    { grade: 'A', count: 8, color: '#10B981' },
    { grade: 'B', count: 12, color: '#3B82F6' },
    { grade: 'C', count: 6, color: '#F59E0B' },
    { grade: 'D', count: 2, color: '#EF4444' },
    { grade: 'F', count: 1, color: '#991B1B' },
  ];

  const filteredGrades = grades.filter((grade) =>
    grade.subject?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    grade.subject?.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLetterGradeColor = (letterGrade: string | null) => {
    if (!letterGrade) return 'default';
    if (letterGrade.startsWith('A')) return 'success';
    if (letterGrade.startsWith('B')) return 'primary';
    if (letterGrade.startsWith('C')) return 'warning';
    if (letterGrade.startsWith('D')) return 'danger';
    return 'danger';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p>{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('students.viewGrades')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('grades.transcript')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card gradient>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('grades.semesterGPA')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {semesterGPA.toFixed(2)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card gradient>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('grades.cumulativeGPA')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {cumulativeGPA.toFixed(2)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card gradient>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('students.credits')} ({t('grades.gradePoints')})
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalCredits}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card gradient>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('students.credits')} {t('grades.graded').toLowerCase()}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {earnedCredits}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('grades.semesterGPA')} {t('dashboard.recentActivity').toLowerCase()}
            </h2>
          </CardHeader>
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={gpaTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="semester" stroke="#9CA3AF" fontSize={12} />
                  <YAxis domain={[0, 4]} stroke="#9CA3AF" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#F9FAFB',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="gpa"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, fill: '#3B82F6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('grades.letterGrade')} {t('admin.report').toLowerCase()}
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
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {gradeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder={t('search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
              />
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {filteredGrades.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredGrades.map((grade, index) => (
                <div key={grade.id} className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0 text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {grade.subject?.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {grade.subject?.code} • {grade.subject?.credits} {t('courses.credits')}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400">{t('grades.midterm')}</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {grade.midterm_grade ?? '-'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400">{t('grades.final')}</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {grade.final_grade ?? '-'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400">{t('grades.letterGrade')}</p>
                      <Badge variant={getLetterGradeColor(grade.letter_grade)} size="lg">
                        {grade.letter_grade || '-'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">{t('noData')}</p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
