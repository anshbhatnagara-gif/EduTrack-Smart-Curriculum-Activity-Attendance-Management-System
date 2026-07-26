import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ navItems = [], roleTitle = 'Portal' }) => {
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-300 min-h-screen fixed left-0 top-0 bottom-0 z-40 border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 space-x-3">
        <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
          E
        </div>
        <div>
          <h1 className="font-bold text-white tracking-tight text-base leading-none">EduTrack</h1>
          <span className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">{roleTitle}</span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 text-center">
        <p className="text-xs text-slate-500">EduTrack v1.0.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;
