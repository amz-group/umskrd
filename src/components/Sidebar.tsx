import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Building2,
  Calendar,
  ClipboardList,
  FileCheck,
  FileText,
  Upload,
  Settings,
  HelpCircle,
  Megaphone,
  Bell,
  DollarSign,
  BarChart3,
  Brain,
  ChevronRight,
  X,
} from 'lucide-react';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  roles?: ('student' | 'lecturer' | 'admin' | 'super_admin')[];
  children?: NavItem[];
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      icon: LayoutDashboard,
      label: t('dashboard'),
      path: '/dashboard',
    },
    // Student routes
    {
      icon: BookOpen,
      label: t('nav.courses'),
      path: '/student/courses',
      roles: ['student'],
    },
    {
      icon: Calendar,
      label: t('nav.schedules'),
      path: '/student/schedule',
      roles: ['student'],
    },
    {
      icon: ClipboardList,
      label: t('nav.grades'),
      path: '/student/grades',
      roles: ['student'],
    },
    {
      icon: FileCheck,
      label: t('nav.attendance'),
      path: '/student/attendance',
      roles: ['student'],
    },
    {
      icon: FileText,
      label: t('nav.assignments'),
      path: '/student/assignments',
      roles: ['student'],
    },
    {
      icon: Upload,
      label: t('nav.materials'),
      path: '/student/materials',
      roles: ['student'],
    },
    {
      icon: DollarSign,
      label: t('nav.payments'),
      path: '/student/payments',
      roles: ['student'],
    },
    // Lecturer routes
    {
      icon: BookOpen,
      label: t('nav.courses'),
      path: '/lecturer/courses',
      roles: ['lecturer'],
    },
    {
      icon: Users,
      label: t('lecturers.myStudents'),
      path: '/lecturer/students',
      roles: ['lecturer'],
    },
    {
      icon: ClipboardList,
      label: t('nav.grades'),
      path: '/lecturer/grades',
      roles: ['lecturer'],
    },
    {
      icon: FileCheck,
      label: t('nav.attendance'),
      path: '/lecturer/attendance',
      roles: ['lecturer'],
    },
    {
      icon: FileText,
      label: t('nav.assignments'),
      path: '/lecturer/assignments',
      roles: ['lecturer'],
    },
    {
      icon: Upload,
      label: t('nav.materials'),
      path: '/lecturer/materials',
      roles: ['lecturer'],
    },
    // Admin routes
    {
      icon: Users,
      label: t('nav.students'),
      path: '/admin/students',
      roles: ['admin', 'super_admin'],
    },
    {
      icon: GraduationCap,
      label: t('nav.lecturers'),
      path: '/admin/lecturers',
      roles: ['admin', 'super_admin'],
    },
    {
      icon: Building2,
      label: t('nav.departments'),
      path: '/admin/departments',
      roles: ['admin', 'super_admin'],
    },
    {
      icon: BookOpen,
      label: t('nav.courses'),
      path: '/admin/courses',
      roles: ['admin', 'super_admin'],
    },
    {
      icon: Calendar,
      label: t('admin.academicYears'),
      path: '/admin/academic-years',
      roles: ['admin', 'super_admin'],
    },
    {
      icon: DollarSign,
      label: t('nav.payments'),
      path: '/admin/payments',
      roles: ['admin', 'super_admin'],
    },
    {
      icon: BarChart3,
      label: t('nav.reports'),
      path: '/admin/reports',
      roles: ['admin', 'super_admin'],
    },
    {
      icon: Settings,
      label: t('nav.settings'),
      path: '/admin/settings',
      roles: ['super_admin'],
    },
    // Shared routes
    {
      icon: FileCheck,
      label: t('nav.exams'),
      path: '/exams',
    },
    {
      icon: Megaphone,
      label: t('nav.announcements'),
      path: '/announcements',
    },
    {
      icon: Bell,
      label: t('nav.notifications'),
      path: '/notifications',
    },
    {
      icon: Brain,
      label: t('ai.title'),
      path: '/ai-assistant',
    },
    {
      icon: HelpCircle,
      label: t('nav.help'),
      path: '/help',
    },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return profile && item.roles.includes(profile.role);
  });

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-full w-72 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">UMS</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">University Management</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <ul className="space-y-1">
              {filteredNavItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive: navIsActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                        navIsActive || isActive(item.path)
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`
                    }
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${
                      isActive(item.path) ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'
                    }`} />
                    <span className="font-medium">{item.label}</span>
                    {item.children && (
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            {profile && (
              <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold">
                  {profile.first_name[0]}{profile.last_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {profile.first_name} {profile.last_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {profile.role.replace('_', ' ')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
