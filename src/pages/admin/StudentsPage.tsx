import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, EmptyState, TablePagination } from '../../components/ui/Table';
import { supabase } from '../../lib/supabase';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Mail,
  Download,
  UserPlus,
} from 'lucide-react';
import type { Student, Profile } from '../../types';

interface StudentWithProfile extends Student {
  profile: Profile;
}

export default function AdminStudentsPage() {
  const { t } = useTranslation();
  const [students, setStudents] = useState<StudentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithProfile | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          profile:profiles(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStudent) return;

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', selectedStudent.id);

      if (error) throw error;

      setStudents(students.filter((s) => s.id !== selectedStudent.id));
      setShowDeleteModal(false);
      setSelectedStudent(null);
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.profile?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.profile?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
      active: 'success',
      on_leave: 'warning',
      graduated: 'info',
      suspended: 'danger',
      withdrawn: 'danger',
    };
    return variants[status] || 'default';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('students.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('admin.manage')} {t('students.title').toLowerCase()}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" icon={<Download className="w-4 h-4" />}>
            {t('export')}
          </Button>
          <Button icon={<UserPlus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>
            {t('add')} {t('nav.students').toLowerCase().slice(0, -1)}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder={`${t('search')} ${t('students.title').toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
              />
            </div>
            <Button variant="outline" icon={<Filter className="w-4 h-4" />}>
              {t('filter')}
            </Button>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div className="p-12 text-center">{t('loading')}</div>
          ) : filteredStudents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('students.studentId')}</TableHead>
                  <TableHead>{t('students.name')}</TableHead>
                  <TableHead>{t('email')}</TableHead>
                  <TableHead>{t('students.program')}</TableHead>
                  <TableHead>{t('students.semester')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.slice((currentPage - 1) * 10, currentPage * 10).map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-mono text-blue-600 dark:text-blue-400">
                      {student.student_number}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
                          {student.profile?.first_name?.[0]}
                          {student.profile?.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {student.profile?.first_name} {student.profile?.last_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {student.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300">
                          {student.profile?.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{student.program_id || '-'}</TableCell>
                    <TableCell>
                      {student.current_semester ? `Semester ${student.current_semester}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(student.status)} dot>
                        {t(`students.${student.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                          onClick={() => {
                            setSelectedStudent(student);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowDeleteModal(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title={t('noData')}
              description={`${t('search')} "${searchTerm}"`}
              action={
                <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>
                  {t('add')} {t('nav.students').toLowerCase()}
                </Button>
              }
            />
          )}
        </CardBody>
        {filteredStudents.length > 10 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredStudents.length / 10)}
            onPageChange={setCurrentPage}
            totalItems={filteredStudents.length}
          />
        )}
      </Card>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`${t('add')} ${t('nav.students').toLowerCase().slice(0, -1)}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('firstName')} placeholder={t('firstName')} />
            <Input label={t('lastName')} placeholder={t('lastName')} />
          </div>
          <Input label={t('email')} type="email" placeholder="student@university.edu" />
          <Input label={t('students.studentNumber')} placeholder="2024001" />
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>
              {t('cancel')}
            </Button>
            <Button className="flex-1">{t('save')}</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedStudent(null);
        }}
        title={`${t('delete')} ${t('nav.students').toLowerCase().slice(0, -1)}`}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete{' '}
            <strong className="text-gray-900 dark:text-white">
              {selectedStudent?.profile?.first_name} {selectedStudent?.profile?.last_name}
            </strong>
            ? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedStudent(null);
              }}
            >
              {t('cancel')}
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleDelete}>
              {t('delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
