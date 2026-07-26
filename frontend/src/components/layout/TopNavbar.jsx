import React from 'react';
import { Menu } from 'lucide-react';
import UserMenu from './UserMenu';
import NotificationButton from './NotificationButton';

const TopNavbar = ({ onMenuClick }) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Open mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2 lg:hidden">
            <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-sm">
              E
            </div>
            <span className="font-bold text-slate-900 text-lg">EduTrack</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          <NotificationButton />
          <div className="h-6 w-px bg-slate-200"></div>
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
