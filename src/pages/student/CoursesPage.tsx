import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, EmptyState } from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';
import {
  BookOpen,
  Search,
  Filter,
  Clock,
  MapPin,
  Users,
  GraduationCap,
} from 'lucide-react';
import type { ClassSection, Subject, Enrollment } from '../../types';

interface CourseWithDetails extends ClassSection {
  subject: Subject;
  enrolled?: boolean;
}

export default function StudentCoursesPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [courses, setCourses] = useState<CourseWithDetails[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithDetails | null>(null);
  const [currentPage] = useState(1);

  useEffect(() => {
    fetchCourses();
    fetchEnrollments();
  }, [profile]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('class_sections')
        .select(`
          *,
          subject:subjects(*)
        `)
        .eq('status', 'open');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchEnrollments = async () => {
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
              *,
              subject:subjects(*)
            )
          `)
          .eq('student_id', student.id);

        if (error) throw error;
        setEnrollments(data || []);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!selectedCourse || !profile) return;

    try {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (student) {
        const { error } = await supabase.from('enrollments').insert({
          student_id: student.id,
          class_section_id: selectedCourse.id,
        });

        if (error) throw error;

        setShowEnrollModal(false);
        fetchCourses();
        fetchEnrollments();
      }
    } catch (error) {
      console.error('Error enrolling:', error);
    }
  };

  const filteredCourses = courses.filter((course) =>
    course.subject?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.subject?.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const enrolledCourseIds = enrollments.map((e) => e.class_section_id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('students.myCourses')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('courses.title')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('courses.enrolled')}
              </h2>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {enrollments.length > 0 ? (
                  enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {enrollment.class_section?.subject?.name || 'Course'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {enrollment.class_section?.subject?.code}
                          </p>
                        </div>
                        <Badge variant="success" size="sm">
                          {t('students.active')}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    {t('noData')}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-2">
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
                <Button icon={<Filter className="w-4 h-4" />} variant="outline">
                  {t('filter')}
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {loading ? (
                <div className="p-8 text-center">{t('loading')}</div>
              ) : filteredCourses.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('courses.courseCode')}</TableHead>
                      <TableHead>{t('courses.courseName')}</TableHead>
                      <TableHead>{t('courses.credits')}</TableHead>
                      <TableHead>{t('courses.section')}</TableHead>
                      <TableHead>{t('courses.room')}</TableHead>
                      <TableHead>{t('courses.enrolled')}/{t('courses.capacity')}</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCourses.slice((currentPage - 1) * 10, currentPage * 10).map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-mono text-blue-600 dark:text-blue-400">
                          {course.subject?.code}
                        </TableCell>
                        <TableCell className="font-medium">
                          {course.subject?.name}
                        </TableCell>
                        <TableCell>{course.subject?.credits}</TableCell>
                        <TableCell>{course.section_number}</TableCell>
                        <TableCell>{course.room || '-'}</TableCell>
                        <TableCell>
                          <span className={`${(course.enrolled_count / course.capacity) > 0.9 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                            {course.enrolled_count}/{course.capacity}
                          </span>
                        </TableCell>
                        <TableCell>
                          {enrolledCourseIds.includes(course.id) ? (
                            <Badge variant="success" size="sm">
                              {t('courses.enrolled')}
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedCourse(course);
                                setShowEnrollModal(true);
                              }}
                              disabled={course.enrolled_count >= course.capacity}
                            >
                              {t('students.enroll')}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  icon={<BookOpen className="w-8 h-8" />}
                  title={t('noData')}
                  description={`${t('search')} "${searchTerm}"`}
                />
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showEnrollModal}
        onClose={() => setShowEnrollModal(false)}
        title={t('students.enroll')}
        size="sm"
      >
        {selectedCourse && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {selectedCourse.subject?.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedCourse.subject?.code}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <GraduationCap className="w-4 h-4" />
                  <span>{selectedCourse.subject?.credits} {t('courses.credits')}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>{selectedCourse.enrolled_count}/{selectedCourse.capacity}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedCourse.room || 'TBA'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>Section {selectedCourse.section_number}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowEnrollModal(false)}>
                {t('cancel')}
              </Button>
              <Button className="flex-1" onClick={handleEnroll}>
                {t('students.enroll')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
