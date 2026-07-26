import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/layout/PageHeader';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { changePassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await changePassword(oldPassword, newPassword);
      if (res.success) {
        setSuccess('Password updated successfully!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(res.message || 'Failed to update password.');
      }
    } catch (err) {
      setError(err.message || 'Error updating password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Change Password"
        description="Update your secret account access password"
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start space-x-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{success}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Current Password
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPasswords ? 'text' : 'password'}
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              New Password
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPasswords ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Confirm New Password
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPasswords ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg shadow-sm text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
