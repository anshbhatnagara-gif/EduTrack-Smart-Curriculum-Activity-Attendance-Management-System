import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  History,
  FileText,
  ClipboardCheck,
  FileCheck,
  Award,
  Clock,
  Megaphone
} from 'lucide-react';

const teacherNavItems = [
  { label: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
  { label: 'Assigned Classes', path: '/teacher/classes', icon: BookOpen },
  { label: 'Mark Attendance', path: '/teacher/attendance/mark', icon: CheckSquare },
  { label: 'Attendance History', path: '/teacher/attendance/history', icon: History },
  { label: 'Study Materials', path: '/teacher/materials', icon: FileText },
  { label: 'Assignments', path: '/teacher/assignments', icon: ClipboardCheck },
  { label: 'Submissions', path: '/teacher/submissions', icon: FileCheck },
  { label: 'Exams & Marks', path: '/teacher/marks', icon: Award },
  { label: 'Timetable', path: '/teacher/timetable', icon: Clock },
  { label: 'Announcements', path: '/teacher/announcements', icon: Megaphone }
];

const TeacherLayout = () => {
  return <DashboardLayout navItems={teacherNavItems} roleTitle="Teacher Portal" />;
};

export default TeacherLayout;
