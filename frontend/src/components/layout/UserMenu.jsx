import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, KeyRound, LogOut, ChevronDown } from 'lucide-react';

const UserMenu = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/login');
  };

  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'teacher': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'student': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'parent': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
        aria-label="User menu"
      >
        <div className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold text-sm shadow-sm">
          {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="hidden md:flex flex-col text-left">
          <span className="text-sm font-semibold text-slate-800 leading-tight">
            {user?.full_name || 'User'}
          </span>
          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border inline-block mt-0.5 w-max ${getRoleBadgeColor(user?.role)}`}>
            {user?.role || 'Guest'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-3 border-b border-slate-100 md:hidden">
            <p className="text-sm font-semibold text-slate-900">{user?.full_name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border inline-block mt-1 ${getRoleBadgeColor(user?.role)}`}>
              {user?.role}
            </span>
          </div>

          <button
            onClick={() => { setIsOpen(false); navigate('/profile'); }}
            className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
          >
            <User className="w-4 h-4 text-slate-400" />
            <span>My Profile</span>
          </button>

          <button
            onClick={() => { setIsOpen(false); navigate('/change-password'); }}
            className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
          >
            <KeyRound className="w-4 h-4 text-slate-400" />
            <span>Change Password</span>
          </button>

          <div className="border-t border-slate-100 my-1"></div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
