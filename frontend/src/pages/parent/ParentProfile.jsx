import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProfileApi } from '../../api/user.api';
import PageHeader from '../../components/layout/PageHeader';
import LoadingTable from '../../components/feedback/LoadingTable';
import ErrorState from '../../components/feedback/ErrorState';
import { User, Mail, Phone, Lock } from 'lucide-react';

const ParentProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyProfileApi();
      if (res.success) {
        setProfile(res.data);
      } else {
        setError(res.message || 'Failed to load profile.');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Guardian Profile" description="Account details and security settings" />
        <LoadingTable rows={4} cols={2} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Guardian Profile" description="Account details and security settings" />
        <ErrorState message={error} onRetry={fetchProfile} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="My Guardian Profile"
        description="Guardian profile overview, contact information, and password management"
        actions={
          <button
            onClick={() => navigate('/change-password')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-primary-600 text-white font-semibold text-xs hover:bg-primary-700 shadow-sm"
          >
            <Lock className="w-4 h-4" />
            <span>Change Password</span>
          </button>
        }
      />

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center space-x-4 border-b border-slate-100 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-2xl">
            {profile?.full_name?.charAt(0) || 'P'}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">{profile?.full_name}</h3>
            <p className="text-xs text-slate-500 font-medium">Account Role: <span className="uppercase font-bold text-purple-600">{profile?.role}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
            <div className="flex items-center space-x-2 mt-1 text-sm font-semibold text-slate-800">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{profile?.email}</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
            <div className="flex items-center space-x-2 mt-1 text-sm font-semibold text-slate-800">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{profile?.phone_number || 'Not Provided'}</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Guardian Relation</label>
            <p className="text-sm font-bold text-slate-800 mt-1 capitalize">{profile?.parentDetails?.relation || 'Parent'}</p>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Occupation</label>
            <p className="text-sm font-bold text-slate-800 mt-1">{profile?.parentDetails?.occupation || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentProfile;
