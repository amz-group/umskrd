import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { supabase } from '../../lib/supabase';
import {
  Clock,
  MapPin,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface ScheduleItem {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room?: string;
  class_section_id: string;
  class_section: {
    subject: {
      name: string;
      code: string;
    };
  };
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
];

export default function StudentSchedulePage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());

  useEffect(() => {
    fetchSchedule();
  }, [profile]);

  const fetchSchedule = async () => {
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
          .select('class_section_id')
          .eq('student_id', student.id);

        if (enrollments && enrollments.length > 0) {
          const sectionIds = enrollments.map((e) => e.class_section_id);
          const { data: scheduleData, error } = await supabase
            .from('class_schedules')
            .select(`
              *,
              class_section:class_sections(
                subject:subjects(*)
              )
            `)
            .in('class_section_id', sectionIds);

          if (error) throw error;
          setSchedule(scheduleData || []);
        }
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventsForDay = (day: number) => {
    return schedule
      .filter((item) => item.day_of_week === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  const getGradientColor = (index: number) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600',
      'from-yellow-500 to-yellow-600',
      'from-red-500 to-red-600',
      'from-cyan-500 to-cyan-600',
      'from-indigo-500 to-indigo-600',
      'from-teal-500 to-teal-600',
    ];
    return colors[index % colors.length];
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
            {t('students.schedule')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('dashboard.todaySchedule')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {t('admin.academicYears') || 'Week'}
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'day'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {t('date')}
          </button>
        </div>
      </div>

      {viewMode === 'week' ? (
        <Card>
          <CardBody>
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-8 gap-px bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden">
                  <div className="bg-white dark:bg-gray-800 p-2">
                    <div className="h-8"></div>
                    {TIME_SLOTS.map((time) => (
                      <div key={time} className="h-16 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                        {time}
                      </div>
                    ))}
                  </div>
                  {DAYS.slice(0, 6).map((day, dayIndex) => (
                    <div key={day} className="bg-white dark:bg-gray-800">
                      <div className="p-2 text-center">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {day}
                        </p>
                      </div>
                      {TIME_SLOTS.map((time) => {
                        const event = getEventsForDay(dayIndex).find(
                          (e) => e.start_time >= time && e.start_time < `${parseInt(time) + 1}:00`
                        );
                        return (
                          <div
                            key={`${day}-${time}`}
                            className="h-16 border-t border-gray-200 dark:border-gray-700 p-1"
                          >
                            {event && event.start_time === time && (
                              <div
                                className={`h-full rounded-lg bg-gradient-to-br ${getGradientColor(
                                  event.class_section_id.charCodeAt(0)
                                )} p-2 text-white overflow-hidden`}
                              >
                                <p className="text-xs font-medium truncate">
                                  {event.class_section?.subject?.name}
                                </p>
                                <p className="text-xs opacity-80 truncate">
                                  {event.room && `${event.room}`}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedDay((prev) => (prev - 1 + 7) % 7)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {DAYS[selectedDay]}
            </h2>
            <button
              onClick={() => setSelectedDay((prev) => (prev + 1) % 7)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          <div className="space-y-4">
            {getEventsForDay(selectedDay).length > 0 ? (
              getEventsForDay(selectedDay).map((event, index) => (
                <Card key={event.id} hover>
                  <CardBody>
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getGradientColor(
                          index
                        )} flex items-center justify-center flex-shrink-0`}
                      >
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {event.class_section?.subject?.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {event.class_section?.subject?.code}
                        </p>
                        <div className="flex flex-wrap gap-4 mt-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span>
                              {event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}
                            </span>
                          </div>
                          {event.room && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <MapPin className="w-4 h-4" />
                              <span>{event.room}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                {t('noData')}
              </div>
            )}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('courses.title')} {t('courses.title').toLowerCase()}
          </h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(new Set(schedule.map((s) => s.class_section_id))).map((sectionId, index) => {
              const event = schedule.find((s) => s.class_section_id === sectionId);
              if (!event) return null;
              return (
                <div
                  key={sectionId}
                  className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getGradientColor(
                        index
                      )} flex items-center justify-center`}
                    >
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {event.class_section?.subject?.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {event.class_section?.subject?.code}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
