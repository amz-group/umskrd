import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { v4 as uuidv4 } from 'uuid';
import {
  QrCode,
  MapPin,
  Users,
  RefreshCw,
  Download,
} from 'lucide-react';

interface Student {
  id: string;
  profile: {
    first_name: string;
    last_name: string;
  };
  student_number: string;
}

interface SubjectData {
  name: string;
  code: string;
}

interface ClassSection {
  id: string;
  subject: SubjectData;
  room?: string;
}

export default function LecturerAttendancePage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [courses, setCourses] = useState<ClassSection[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<ClassSection | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCode, setQRCode] = useState('');
  const [qrValidUntil, setQRValidUntil] = useState<Date | null>(null);
  const [attendance, setAttendance] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCourses();
  }, [profile]);

  const fetchCourses = async () => {
    if (!profile) return;

    try {
      const { data: lecturer } = await supabase
        .from('lecturers')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (lecturer) {
        const { data, error } = await supabase
          .from('class_sections')
          .select(`
            id,
            room,
            subject:subjects(*)
          `)
          .eq('lecturer_id', lecturer.id);

        if (error) throw error;
        setCourses((data || []).map((item: any) => ({
          ...item,
          subject: Array.isArray(item.subject) ? item.subject[0] : item.subject,
        })));
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (courseId: string) => {
    try {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          student:students(
            id,
            student_number,
            profile:profiles(*)
          )
        `)
        .eq('class_section_id', courseId);

      const studentList = enrollments?.map((e: any) => ({
        id: e.student.id,
        student_number: e.student.student_number,
        profile: e.student.profile,
      })) || [];

      setStudents(studentList);
      const initialAttendance: Record<string, string> = {};
      studentList.forEach((s) => {
        initialAttendance[s.id] = 'present';
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const generateQRCode = () => {
    const code = uuidv4();
    const validUntil = new Date();
    validUntil.setMinutes(validUntil.getMinutes() + 15);

    setQRCode(code);
    setQRValidUntil(validUntil);
    setShowQRModal(true);
  };

  const saveQRSession = async () => {
    if (!selectedCourse || !profile || !qrCode) return;

    try {
      const { data: lecturer } = await supabase
        .from('lecturers')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (lecturer) {
        await supabase.from('qr_attendance_sessions').insert({
          class_section_id: selectedCourse.id,
          date: new Date().toISOString().split('T')[0],
          qr_code: qrCode,
          valid_until: qrValidUntil?.toISOString(),
          created_by: profile.id,
          is_active: true,
        });
      }
    } catch (error) {
      console.error('Error saving QR session:', error);
    }
  };

  const updateAttendance = (studentId: string, status: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const saveAttendance = async () => {
    setShowQRModal(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'absent':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'late':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'excused':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
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
            {t('attendance.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('attendance.recordAttendance')}
          </p>
        </div>
        {selectedCourse && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={() => setSelectedCourse(null)}
            >
              {t('courses.change')}
            </Button>
            <Button icon={<QrCode className="w-4 h-4" />} onClick={generateQRCode}>
              {t('attendance.generateQR')}
            </Button>
          </div>
        )}
      </div>

      {!selectedCourse ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card
              key={course.id}
              hover
              onClick={() => {
                setSelectedCourse(course);
                fetchStudents(course.id);
              }}
            >
              <CardBody>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {course.subject?.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {course.subject?.code}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span>{course.room || 'TBA'}</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedCourse.subject?.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedCourse.subject?.code} • {selectedCourse.room}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="primary" dot>
                    {students.length} {t('students.title').toLowerCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {students.map((student) => (
                  <div key={student.id} className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {student.profile?.first_name?.[0]}
                      {student.profile?.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {student.profile?.first_name} {student.profile?.last_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {student.student_number}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {['present', 'absent', 'late', 'excused'].map((status) => (
                        <button
                          key={status}
                          onClick={() => updateAttendance(student.id, status)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            attendance[student.id] === status
                              ? getStatusColor(status)
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {t(`attendance.${status}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" icon={<Download className="w-4 h-4" />}>
              {t('attendance.exportReport')}
            </Button>
            <Button onClick={saveAttendance}>
              {t('save')}
            </Button>
          </div>
        </>
      )}

      <Modal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title={t('attendance.qrCode')}
        size="sm"
      >
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl flex items-center justify-center">
            {qrCode && (
              <QRCodeSVG
                value={JSON.stringify({
                  code: qrCode,
                  courseId: selectedCourse?.id,
                  validUntil: qrValidUntil?.toISOString(),
                })}
                size={200}
                level="H"
              />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('attendance.validUntil')}
            </p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {qrValidUntil?.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowQRModal(false)}>
              {t('cancel')}
            </Button>
            <Button className="flex-1" onClick={() => { saveQRSession(); setShowQRModal(false); }}>
              {t('save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
