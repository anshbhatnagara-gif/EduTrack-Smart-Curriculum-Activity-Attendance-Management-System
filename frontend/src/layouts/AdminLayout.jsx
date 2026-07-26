import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  Calendar,
  BookOpen,
  Grid,
  BookMarked,
  UserPlus,
  ClipboardList,
  Clock,
  Megaphone,
  BarChart3
} from 'lucide-react';

const adminNavItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Teachers', path: '/admin/teachers', icon: Users },
  { label: 'Students', path: '/admin/students', icon: GraduationCap },
  { label: 'Parents', path: '/admin/parents', icon: UserCheck },
  { label: 'Sessions', path: '/admin/academic/sessions', icon: Calendar },
  { label: 'Classes', path: '/admin/academic/classes', icon: BookOpen },
  { label: 'Sections', path: '/admin/academic/sections', icon: Grid },
  { label: 'Subjects', path: '/admin/academic/subjects', icon: BookMarked },
  { label: 'Assignments', path: '/admin/academic/assignments', icon: UserPlus },
  { label: 'Enrollments', path: '/admin/academic/enrollments', icon: ClipboardList },
  { label: 'Timetable', path: '/admin/timetable', icon: Clock },
  { label: 'Announcements', path: '/admin/announcements', icon: Megaphone },
  { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
];

const AdminLayout = () => {
  return <DashboardLayout navItems={adminNavItems} roleTitle="Admin Portal" />;
};

export default AdminLayout;
