import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  ClipboardList,
  Award,
  Clock,
  Megaphone,
  Bell
} from 'lucide-react';

const studentNavItems = [
  { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
  { label: 'Attendance', path: '/student/attendance', icon: CheckSquare },
  { label: 'Study Materials', path: '/student/materials', icon: FileText },
  { label: 'Assignments', path: '/student/assignments', icon: ClipboardList },
  { label: 'Marks & Results', path: '/student/marks', icon: Award },
  { label: 'Timetable', path: '/student/timetable', icon: Clock },
  { label: 'Announcements', path: '/student/announcements', icon: Megaphone },
  { label: 'Notifications', path: '/student/notifications', icon: Bell },
];

const StudentLayout = () => {
  return <DashboardLayout navItems={studentNavItems} roleTitle="Student Portal" />;
};

export default StudentLayout;
