import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  ClipboardCheck,
  Award,
  Clock,
  Megaphone,
  Bell,
  User
} from 'lucide-react';

const parentNavItems = [
  { label: 'Dashboard', path: '/parent/dashboard', icon: LayoutDashboard },
  { label: 'My Children', path: '/parent/children', icon: Users },
  { label: 'Child Attendance', path: '/parent/child-attendance', icon: CheckSquare },
  { label: 'Child Assignments', path: '/parent/child-assignments', icon: ClipboardCheck },
  { label: 'Child Marks', path: '/parent/child-marks', icon: Award },
  { label: 'Child Timetable', path: '/parent/child-timetable', icon: Clock },
  { label: 'Announcements', path: '/parent/announcements', icon: Megaphone },
  { label: 'Notifications', path: '/parent/notifications', icon: Bell },
  { label: 'My Profile', path: '/parent/profile', icon: User }
];

const ParentLayout = () => {
  return <DashboardLayout navItems={parentNavItems} roleTitle="Parent Portal" />;
};

export default ParentLayout;
