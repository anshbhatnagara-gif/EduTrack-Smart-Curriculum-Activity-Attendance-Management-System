import React, { useEffect, useState, useCallback } from 'react';
import { getMyNotificationsApi, markNotificationReadApi, markAllNotificationsReadApi } from '../../api/notification.api';
import PageHeader from '../../components/layout/PageHeader';
import LoadingTable from '../../components/feedback/LoadingTable';
import ErrorState from '../../components/feedback/ErrorState';
import { Bell, CheckCheck, Circle } from 'lucide-react';

const StudentNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyNotificationsApi();
      if (res.success) {
        setNotifications(res.data || []);
      } else {
        setError(res.message || 'Failed to load notifications.');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationReadApi(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification read:', err.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsReadApi();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all notifications read:', err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Notifications" description="System alerts, warning notifications, and academic updates" />
        <LoadingTable rows={6} cols={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Notifications" description="System alerts, warning notifications, and academic updates" />
        <ErrorState message={error} onRetry={fetchNotifications} />
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="System alerts, low attendance warnings, new exam result updates, and homework notifications"
        actions={
          unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 shadow-sm"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              <span>Mark All as Read</span>
            </button>
          )
        }
      />

      <div className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && handleMarkRead(n.id)}
              className={`p-4 rounded-2xl border transition-colors cursor-pointer flex items-start justify-between ${
                n.is_read ? 'bg-white border-slate-200 opacity-75' : 'bg-indigo-50/50 border-indigo-200'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${n.is_read ? 'bg-transparent' : 'bg-primary-600'}`}></div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">{new Date(n.created_at).toLocaleString()}</span>
                </div>
              </div>
              {!n.is_read && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkRead(n.id);
                  }}
                  className="text-[11px] font-semibold text-primary-600 hover:text-primary-800"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
            <Bell className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No Notifications</h4>
            <p className="text-xs text-slate-400">You are all caught up with your notifications!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentNotifications;
