import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import {
  LayoutDashboard,
  CheckSquare,
  Award,
  ClipboardList,
  Clock,
  Megaphone,
  Bell
} from 'lucide-react';

const parentNavItems = [
  { label: 'Dashboard', path: '/parent/dashboard', icon: LayoutDashboard },
  { label: 'Child Attendance', path: '/parent/attendance', icon: CheckSquare },
  { label: 'Child Marks', path: '/parent/marks', icon: Award },
  { label: 'Pending Assignments', path: '/parent/assignments', icon: ClipboardList },
  { label: 'Timetable', path: '/parent/timetable', icon: Clock },
  { label: 'Announcements', path: '/parent/announcements', icon: Megaphone },
  { label: 'Notifications', path: '/parent/notifications', icon: Bell },
];

const ParentLayout = () => {
  return <DashboardLayout navItems={parentNavItems} roleTitle="Parent Portal" />;
};

export default ParentLayout;
