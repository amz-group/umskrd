import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import Badge, { StatBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';
import {
  QrCode,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Camera,
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  class_section: {
    room?: string;
    subject: {
      name: string;
      code: string;
    };
  };
}

export default function StudentAttendancePage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedQR, setScannedQR] = useState('');
  const [attendanceRate, setAttendanceRate] = useState(92);
  const [presentCount, setPresentCount] = useState(45);
  const [absentCount, setAbsentCount] = useState(3);
  const [lateCount, setLateCount] = useState(2);

  useEffect(() => {
    fetchAttendance();
  }, [profile]);

  const fetchAttendance = async () => {
    if (!profile) return;

    try {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (student) {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('id, class_section_id, class_sections(subjects(*))')
          .eq('student_id', student.id);

        if (enrollments && enrollments.length > 0) {
          const enrollmentIds = enrollments.map((e) => e.id);
          const { data: attendanceData, error } = await supabase
            .from('attendance')
            .select(`
              *,
              enrollment:enrollments(
                class_section:class_sections(
                  room,
                  subject:subjects(*)
                )
              )
            `)
            .in('enrollment_id', enrollmentIds);

          if (error) throw error;

          const formattedAttendance = attendanceData?.map((a: any) => ({
            id: a.id,
            date: a.date,
            status: a.status,
            class_section: a.enrollment?.class_section,
          })) || [];

          setAttendance(formattedAttendance);

          const total = formattedAttendance.length;
          const present = formattedAttendance.filter((a: any) => a.status === 'present').length;
          setPresentCount(present);
          setAbsentCount(formattedAttendance.filter((a: any) => a.status === 'absent').length);
          setLateCount(formattedAttendance.filter((a: any) => a.status === 'late').length);
          setAttendanceRate(total > 0 ? Math.round((present / total) * 100) : 100);
        }
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleScanQR = () => {
    if (scannedQR) {
      setShowQRScanner(false);
      setScannedQR('');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'absent':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'late':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'excused':
        return <AlertTriangle className="w-5 h-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
      present: 'success',
      absent: 'danger',
      late: 'warning',
      excused: 'info',
    };
    return variants[status] || 'default';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('attendance.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('attendance.viewHistory')}
          </p>
        </div>
        <Button icon={<QrCode className="w-4 h-4" />} onClick={() => setShowQRScanner(true)}>
          {t('attendance.scanQR')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatBadge
          value={`${attendanceRate}%`}
          label={t('attendance.percentage')}
          icon={<CheckCircle className="w-6 h-6" />}
          color="green"
          trend="up"
          trendValue="2%"
        />
        <StatBadge
          value={presentCount}
          label={t('attendance.present')}
          icon={<CheckCircle className="w-6 h-6" />}
          color="blue"
        />
        <StatBadge
          value={absentCount}
          label={t('attendance.absent')}
          icon={<XCircle className="w-6 h-6" />}
          color="red"
        />
        <StatBadge
          value={lateCount}
          label={t('attendance.late')}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="yellow"
        />
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('attendance.viewHistory')}
          </h2>
        </CardHeader>
        <CardBody className="p-0">
          {attendance.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {attendance.map((record) => (
                <div key={record.id} className="p-4 flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {getStatusIcon(record.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {record.class_section?.subject?.name || 'Course'}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(record.date).toLocaleDateString()}
                      </span>
                      {record.class_section?.room && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {record.class_section.room}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant={getStatusBadge(record.status)}>
                    {t(`attendance.${record.status}`)}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              {t('noData')}
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        title={t('attendance.scanQR')}
        size="sm"
      >
        <div className="space-y-6">
          <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
            <Camera className="w-16 h-16 text-gray-400" />
          </div>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Scan the QR code displayed by your lecturer to mark your attendance
          </p>
          <Input
            placeholder="Enter QR code manually"
            value={scannedQR}
            onChange={(e) => setScannedQR(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowQRScanner(false)}>
              {t('cancel')}
            </Button>
            <Button className="flex-1" onClick={handleScanQR} disabled={!scannedQR}>
              {t('attendance.markPresent')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
