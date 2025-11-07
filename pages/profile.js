import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import '@fortawesome/fontawesome-free/css/all.min.css';

export default function ProfilePage() {
  const { user, profile, loading, updateProfile, updatePassword, uploadAvatar, signOut } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    bio: '',
    mobile_number: ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    theme: 'light',
    notifications: {
      campaignUpdates: true,
      testAssignments: true,
      weeklySummary: false,
      bugReports: true
    }
  });

  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        mobile_number: profile.mobile_number || ''
      });
      setPreferences(profile.preferences || {
        theme: 'light',
        notifications: {
          campaignUpdates: true,
          testAssignments: true,
          weeklySummary: false,
          bugReports: true
        }
      });
      if (profile.avatar_url) {
        setAvatarPreview(profile.avatar_url);
      }
    }
  }, [profile]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage('');

    try {
      // Upload avatar if changed
      if (avatarFile) {
        const result = await uploadAvatar(avatarFile);
        if (!result.success) {
          throw new Error(result.error);
        }
      }

      // Update profile info
      const result = await updateProfile(profileForm);
      if (!result.success) {
        throw new Error(result.error);
      }

      setMessage('Profile updated successfully!');
      setAvatarFile(null);
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage('Passwords do not match!');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage('Password must be at least 6 characters!');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const result = await updatePassword(passwordForm.newPassword);
      if (!result.success) {
        throw new Error(result.error);
      }

      setMessage('Password updated successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setMessage('');

    try {
      const result = await updateProfile({ preferences });
      if (!result.success) {
        throw new Error(result.error);
      }

      setMessage('Preferences saved successfully!');
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationChange = (key) => {
    setPreferences(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ fontSize: '18px', color: '#6366f1' }}>Loading...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: 0 }}>
            <i className="fas fa-user-circle" style={{ marginRight: '12px', color: '#6366f1' }}></i>
            Profile Settings
          </h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                padding: '8px 16px',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <i className="fas fa-arrow-left"></i>
              Back to Dashboard
            </button>
            <button
              onClick={handleSignOut}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ef4444',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <i className="fas fa-sign-out-alt"></i>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '32px auto', padding: '0 32px' }}>
        <div style={{ display: 'flex', gap: '24px' }}>
          {/* Sidebar */}
          <div style={{ width: '280px', flexShrink: 0 }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <div
                onClick={() => setActiveTab('profile')}
                style={{
                  padding: '16px 20px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: activeTab === 'profile' ? '#f3f4f6' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'background 0.2s'
                }}
              >
                <i className="fas fa-user" style={{ color: '#6366f1', width: '20px' }}></i>
                <span style={{ fontSize: '14px', fontWeight: activeTab === 'profile' ? '600' : '400' }}>Profile Information</span>
              </div>
              <div
                onClick={() => setActiveTab('password')}
                style={{
                  padding: '16px 20px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: activeTab === 'password' ? '#f3f4f6' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'background 0.2s'
                }}
              >
                <i className="fas fa-lock" style={{ color: '#6366f1', width: '20px' }}></i>
                <span style={{ fontSize: '14px', fontWeight: activeTab === 'password' ? '600' : '400' }}>Password & Security</span>
              </div>
              <div
                onClick={() => setActiveTab('preferences')}
                style={{
                  padding: '16px 20px',
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'preferences' ? '#f3f4f6' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'background 0.2s'
                }}
              >
                <i className="fas fa-cog" style={{ color: '#6366f1', width: '20px' }}></i>
                <span style={{ fontSize: '14px', fontWeight: activeTab === 'preferences' ? '600' : '400' }}>Preferences</span>
              </div>
            </div>

            {/* Profile Card */}
            <div style={{ marginTop: '24px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '24px', textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px', overflow: 'hidden', border: '3px solid #6366f1' }}>
                <img
                  src={avatarPreview || '/default-avatar.png'}
                  alt="Profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&size=80&background=6366f1&color=fff` }}
                />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{profile.full_name}</h3>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>{user.email}</p>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                <i className="fas fa-calendar-alt" style={{ marginRight: '6px' }}></i>
                Member since {memberSince}
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div style={{ flex: 1 }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '32px' }}>
              {message && (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: message.startsWith('Error') ? '#fee2e2' : '#d1fae5',
                  color: message.startsWith('Error') ? '#991b1b' : '#065f46',
                  borderRadius: '6px',
                  marginBottom: '24px',
                  fontSize: '14px'
                }}>
                  {message}
                </div>
              )}

              {/* Profile Information Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>Profile Information</h2>

                  {/* Avatar Upload */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                      Profile Picture
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #e5e7eb' }}>
                        <img
                          src={avatarPreview || '/default-avatar.png'}
                          alt="Profile"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileForm.full_name || 'User')}&size=80&background=6366f1&color=fff` }}
                        />
                      </div>
                      <label style={{
                        padding: '8px 16px',
                        backgroundColor: '#6366f1',
                        color: 'white',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}>
                        <i className="fas fa-upload" style={{ marginRight: '8px' }}></i>
                        Upload New Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Full Name */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Email (Read-only) */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: '#f9fafb',
                        color: '#6b7280',
                        boxSizing: 'border-box'
                      }}
                    />
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
                      <i className="fas fa-info-circle"></i> Contact support to change your email address
                    </p>
                  </div>

                  {/* Mobile Number (Read-only for now) */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={profileForm.mobile_number}
                      disabled
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: '#f9fafb',
                        color: '#6b7280',
                        boxSizing: 'border-box'
                      }}
                    />
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
                      <i className="fas fa-info-circle"></i> Contact support to change your mobile number
                    </p>
                  </div>

                  {/* Bio */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                      Bio (Optional)
                    </label>
                    <textarea
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      rows={4}
                      placeholder="Tell us about yourself..."
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: saving ? '#9ca3af' : '#6366f1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}

              {/* Password Tab */}
              {activeTab === 'password' && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>Password & Security</h2>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <button
                    onClick={handleSavePassword}
                    disabled={saving}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: saving ? '#9ca3af' : '#6366f1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    {saving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>Preferences</h2>

                  {/* Theme */}
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Appearance</h3>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => setPreferences({ ...preferences, theme: 'light' })}
                        style={{
                          padding: '12px 24px',
                          border: preferences.theme === 'light' ? '2px solid #6366f1' : '1px solid #d1d5db',
                          borderRadius: '6px',
                          backgroundColor: preferences.theme === 'light' ? '#eef2ff' : 'white',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <i className="fas fa-sun" style={{ color: '#fbbf24' }}></i>
                        Light Mode
                      </button>
                      <button
                        onClick={() => setPreferences({ ...preferences, theme: 'dark' })}
                        style={{
                          padding: '12px 24px',
                          border: preferences.theme === 'dark' ? '2px solid #6366f1' : '1px solid #d1d5db',
                          borderRadius: '6px',
                          backgroundColor: preferences.theme === 'dark' ? '#eef2ff' : 'white',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <i className="fas fa-moon" style={{ color: '#6366f1' }}></i>
                        Dark Mode
                      </button>
                    </div>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                      <i className="fas fa-info-circle"></i> Dark mode coming soon
                    </p>
                  </div>

                  {/* Notifications */}
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Email Notifications</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={preferences.notifications.campaignUpdates}
                          onChange={() => handleNotificationChange('campaignUpdates')}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '500' }}>Campaign Updates</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>Get notified when your campaigns receive new responses</div>
                        </div>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={preferences.notifications.testAssignments}
                          onChange={() => handleNotificationChange('testAssignments')}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '500' }}>Test Assignments</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>Receive notifications about new testing assignments</div>
                        </div>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={preferences.notifications.weeklySummary}
                          onChange={() => handleNotificationChange('weeklySummary')}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '500' }}>Weekly Summary</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>Get a weekly summary of your campaign performance</div>
                        </div>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={preferences.notifications.bugReports}
                          onChange={() => handleNotificationChange('bugReports')}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '500' }}>Bug Reports</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>Updates on reported bugs and their resolution status</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Regional Settings */}
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Regional Settings</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                          Language
                        </label>
                        <input
                          type="text"
                          value="English"
                          disabled
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            backgroundColor: '#f9fafb',
                            color: '#6b7280',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                          Time Format
                        </label>
                        <input
                          type="text"
                          value="24-hour"
                          disabled
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            backgroundColor: '#f9fafb',
                            color: '#6b7280',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                          Timezone
                        </label>
                        <input
                          type="text"
                          value="Asia/Kolkata (IST)"
                          disabled
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            backgroundColor: '#f9fafb',
                            color: '#6b7280',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSavePreferences}
                    disabled={saving}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: saving ? '#9ca3af' : '#6366f1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
