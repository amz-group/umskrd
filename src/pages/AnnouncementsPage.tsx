import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input, { Textarea } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import {
  Search,
  Plus,
  Bell,
  Calendar,
  Pin,
  AlertCircle,
  Info,
  AlertTriangle,
} from 'lucide-react';
import type { Announcement } from '../types';

export default function AnnouncementsPage() {
  const { t } = useTranslation();
  const { profile, isRole } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'normal',
    target_audience: 'all',
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('published_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!profile) return;

    try {
      const { error } = await supabase.from('announcements').insert({
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        priority: newAnnouncement.priority,
        target_audience: newAnnouncement.target_audience,
        author_id: profile.id,
      });

      if (error) throw error;

      setShowAddModal(false);
      setNewAnnouncement({ title: '', content: '', priority: 'normal', target_audience: 'all' });
      fetchAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getPriorityBadge = (priority: string): 'danger' | 'warning' | 'info' | 'default' => {
    const variants: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
      urgent: 'danger',
      high: 'warning',
      normal: 'info',
      low: 'default',
    };
    return variants[priority] || 'default';
  };

  const filteredAnnouncements = announcements.filter(
    (announcement) =>
      announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canCreate = isRole(['admin', 'super_admin']);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('announcements.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('dashboard.announcements')}
          </p>
        </div>
        {canCreate && (
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>
            {t('announcements.newAnnouncement')}
          </Button>
        )}
      </div>

      <div className="max-w-xl">
        <Input
          placeholder={`${t('search')} ${t('announcements.title').toLowerCase()}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search className="w-5 h-5" />}
        />
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center">{t('loading')}</div>
        ) : filteredAnnouncements.length > 0 ? (
          filteredAnnouncements.map((announcement) => (
            <Card
              key={announcement.id}
              hover
              onClick={() => {}}
            >
              <CardBody>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getPriorityIcon(announcement.priority)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {announcement.is_pinned && (
                            <Pin className="w-4 h-4 text-blue-500" />
                          )}
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {announcement.title}
                          </h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                          {announcement.content}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(announcement.published_at).toLocaleDateString()}
                          </span>
                          <Badge variant={getPriorityBadge(announcement.priority)} size="sm">
                            {t(`announcements.${announcement.priority}`)}
                          </Badge>
                          <Badge variant="default" size="sm">
                            {t(`announcements.${announcement.target_audience}`)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))
        ) : (
          <Card>
            <CardBody>
              <div className="p-12 text-center">
                <Bell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">{t('noData')}</p>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t('announcements.newAnnouncement')}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label={t('announcements.title')}
            placeholder={t('announcements.title')}
            value={newAnnouncement.title}
            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
          />
          <Textarea
            label={t('content')}
            placeholder={t('content')}
            rows={5}
            value={newAnnouncement.content}
            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t('announcements.priority')}
              </label>
              <select
                value={newAnnouncement.priority}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="low">{t('announcements.low')}</option>
                <option value="normal">{t('announcements.normal')}</option>
                <option value="high">{t('announcements.high')}</option>
                <option value="urgent">{t('announcements.urgent')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t('announcements.targetAudience')}
              </label>
              <select
                value={newAnnouncement.target_audience}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, target_audience: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">{t('announcements.all')}</option>
                <option value="students">{t('announcements.studentsOnly')}</option>
                <option value="lecturers">{t('announcements.lecturersOnly')}</option>
                <option value="department">{t('announcements.departmentOnly')}</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>
              {t('cancel')}
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!newAnnouncement.title || !newAnnouncement.content}
            >
              {t('submit')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
