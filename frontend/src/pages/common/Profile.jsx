import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/layout/PageHeader';
import { getMyProfileApi, updateMyProfileApi } from '../../api/user.api';
import { User, Mail, Phone, Shield, Calendar, Award, Edit, Camera, Save, X, Lock } from 'lucide-react';

const Profile = () => {
  const { user: authUser, setUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [qualification, setQualification] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const isEditable = authUser?.role === 'admin' || authUser?.role === 'teacher';

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await getMyProfileApi();
      const p = res.data.data;
      setProfileData(p);
      setFullName(p.full_name || '');
      setPhone(p.phone || '');
      if (p.teacherInfo) {
        setQualification(p.teacherInfo.qualification || '');
        setExperienceYears(p.teacherInfo.experience_years || '');
        setSpecialization(p.teacherInfo.specialization || '');
      }
    } catch (err) {
      setError('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isEditable) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('full_name', fullName);
      formData.append('phone', phone);
      if (imageFile) {
        formData.append('profile_image', imageFile);
      }

      if (authUser?.role === 'teacher') {
        formData.append('qualification', qualification);
        formData.append('experience_years', experienceYears);
        formData.append('specialization', specialization);
      }

      const res = await updateMyProfileApi(formData);
      setSuccess('Profile updated successfully!');
      setProfileData(res.data.data);
      if (setUser) {
        setUser(res.data.data);
      }
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
        Loading profile...
      </div>
    );
  }

  const avatarUrl = imagePreview || (profileData?.profile_image ? `http://localhost:5000${profileData.profile_image}` : null);

  return (
    <div>
      <PageHeader
        title="User Profile"
        description="View and manage your personal account settings"
      />

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
          {success}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Banner */}
        <div className="h-36 bg-gradient-to-r from-primary-600 to-primary-800 p-6 flex items-end justify-between">
          <div className="flex items-center space-x-4 transform translate-y-6">
            <div className="relative w-24 h-24 rounded-2xl bg-white p-1 shadow-md">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-full h-full rounded-xl object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-primary-600 text-white font-bold text-4xl flex items-center justify-center">
                  {profileData?.full_name ? profileData.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              {isEditing && (
                <label className="absolute bottom-1 right-1 bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg cursor-pointer shadow-md transition-colors">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <div className="text-white pb-1">
              <h2 className="text-2xl font-bold">{profileData?.full_name}</h2>
              <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 bg-white/20 backdrop-blur-md rounded text-white inline-block">
                {profileData?.role}
              </span>
            </div>
          </div>

          <div className="pb-1">
            {isEditable ? (
              !isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white font-medium text-sm px-4 py-2 rounded-xl backdrop-blur-md transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setImagePreview(null);
                  }}
                  className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white font-medium text-sm px-4 py-2 rounded-xl backdrop-blur-md transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              )
            ) : (
              <div className="flex items-center space-x-1.5 bg-white/10 text-white/80 text-xs px-3 py-1.5 rounded-lg backdrop-blur-md">
                <Lock className="w-3.5 h-3.5" />
                <span>Read-only Mode</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Details */}
        <div className="pt-12 p-6 md:p-8">
          {!isEditable && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center space-x-3">
              <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <span>Student and Parent profile details are managed by the school administration and cannot be edited directly.</span>
            </div>
          )}

          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center space-x-2 text-slate-500 mb-1">
                <User className="w-4 h-4 text-primary-600" />
                <label className="text-xs font-semibold uppercase tracking-wider">Full Name</label>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  required
                />
              ) : (
                <p className="text-base font-semibold text-slate-800">{profileData?.full_name || 'N/A'}</p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center space-x-2 text-slate-500 mb-1">
                <Mail className="w-4 h-4 text-primary-600" />
                <label className="text-xs font-semibold uppercase tracking-wider">Email Address</label>
              </div>
              <p className="text-base font-semibold text-slate-800">{profileData?.email || 'N/A'}</p>
              <p className="text-xs text-slate-400">Email cannot be changed directly</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center space-x-2 text-slate-500 mb-1">
                <Phone className="w-4 h-4 text-primary-600" />
                <label className="text-xs font-semibold uppercase tracking-wider">Phone Number</label>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              ) : (
                <p className="text-base font-semibold text-slate-800">{profileData?.phone || 'Not provided'}</p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center space-x-2 text-slate-500 mb-1">
                <Shield className="w-4 h-4 text-primary-600" />
                <label className="text-xs font-semibold uppercase tracking-wider">Account Status</label>
              </div>
              <div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  {profileData?.status || 'active'}
                </span>
              </div>
            </div>

            {profileData?.teacherInfo && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 col-span-1 md:col-span-2 space-y-3">
                <div className="flex items-center space-x-2 text-slate-500">
                  <Award className="w-4 h-4 text-primary-600" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Teacher Info</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Employee Code</p>
                    <p className="text-sm font-semibold text-slate-800">{profileData.teacherInfo.employee_code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Qualification</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-slate-800">{profileData.teacherInfo.qualification || 'N/A'}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Experience (Years)</p>
                    {isEditing ? (
                      <input
                        type="number"
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-slate-800">{profileData.teacherInfo.experience_years || 'N/A'}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {profileData?.studentInfo && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 col-span-1 md:col-span-2 space-y-3">
                <div className="flex items-center space-x-2 text-slate-500">
                  <Calendar className="w-4 h-4 text-primary-600" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Student Info</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Admission Number</p>
                    <p className="text-sm font-semibold text-slate-800">{profileData.studentInfo.admission_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Roll Number</p>
                    <p className="text-sm font-semibold text-slate-800">{profileData.studentInfo.roll_number || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {isEditing && (
              <div className="col-span-1 md:col-span-2 flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
