import React from 'react';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';

const MobileNavigation = ({ isOpen, onClose, navItems = [], roleTitle = 'Portal' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Off-canvas Panel */}
      <div className="fixed inset-y-0 left-0 w-72 bg-slate-900 text-slate-300 shadow-2xl flex flex-col z-50">
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-lg">
              E
            </div>
            <div>
              <h1 className="font-bold text-white tracking-tight text-base leading-none">EduTrack</h1>
              <span className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">{roleTitle}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
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
      </div>
    </div>
  );
};

export default MobileNavigation;
