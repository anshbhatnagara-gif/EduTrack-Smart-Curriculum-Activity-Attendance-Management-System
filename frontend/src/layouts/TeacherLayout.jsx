import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  ClipboardCheck,
  Award,
  TrendingUp,
  Clock,
  Megaphone
} from 'lucide-react';

const teacherNavItems = [
  { label: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
  { label: 'Attendance', path: '/teacher/attendance', icon: CheckSquare },
  { label: 'Study Materials', path: '/teacher/materials', icon: FileText },
  { label: 'Assignments', path: '/teacher/assignments', icon: ClipboardCheck },
  { label: 'Exams & Marks', path: '/teacher/marks', icon: Award },
  { label: 'Performance', path: '/teacher/performance', icon: TrendingUp },
  { label: 'Timetable', path: '/teacher/timetable', icon: Clock },
  { label: 'Announcements', path: '/teacher/announcements', icon: Megaphone },
];

const TeacherLayout = () => {
  return <DashboardLayout navItems={teacherNavItems} roleTitle="Teacher Portal" />;
};

export default TeacherLayout;
