import React, { useState } from 'react';
import { Bell } from 'lucide-react';

const NotificationButton = () => {
  const [unreadCount] = useState(0);

  return (
    <div className="relative">
      <button
        type="button"
        className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
        )}
      </button>
    </div>
  );
};

export default NotificationButton;
