import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function Header({ title = 'Campaign Dashboard', showNewCampaign = true, showTemplates = false, onTemplatesClick = null }) {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateCampaign = async () => {
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `New Campaign ${Date.now()}`,
          status: 'draft'
        })
      });

      if (response.ok) {
        const { campaign } = await response.json();
        router.push(`/?id=${campaign.id}`);
      }
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const getAvatarUrl = () => {
    if (profile?.avatar_url) {
      return profile.avatar_url;
    }
    const name = profile?.full_name || user?.email || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=40&background=6366f1&color=fff`;
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Title */}
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              <i className="fas fa-video mr-2 text-violet-600"></i>
              {title}
            </h1>
          </div>

          {/* Right: Actions & User Menu */}
          <div className="flex items-center gap-3">
            {showTemplates && (
              <button
                onClick={onTemplatesClick}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition flex items-center gap-2"
              >
                <i className="fas fa-layer-group"></i>
                Templates
              </button>
            )}
            {showNewCampaign && (
              <button
                onClick={handleCreateCampaign}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition flex items-center gap-2"
              >
                <i className="fas fa-plus"></i>
                New Campaign
              </button>
            )}

            {/* User Dropdown */}
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                >
                  <img
                    src={getAvatarUrl()}
                    alt="Profile"
                    className="w-8 h-8 rounded-full border-2 border-violet-600"
                  />
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {profile?.full_name || 'User'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.email}
                    </div>
                  </div>
                  <i className={`fas fa-chevron-down text-gray-400 text-xs transition-transform ${showUserDropdown ? 'rotate-180' : ''}`}></i>
                </button>

                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <div
                    className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2"
                    style={{ zIndex: 9999 }}
                  >
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <img
                          src={getAvatarUrl()}
                          alt="Profile"
                          className="w-12 h-12 rounded-full border-2 border-violet-600"
                        />
                        <div>
                          <div className="font-medium text-gray-900">
                            {profile?.full_name || 'User'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <button
                        onClick={() => {
                          router.push('/dashboard');
                          setShowUserDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                      >
                        <i className="fas fa-th-large w-4 text-violet-600"></i>
                        Dashboard
                      </button>

                      <button
                        onClick={() => {
                          router.push('/profile');
                          setShowUserDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                      >
                        <i className="fas fa-user w-4 text-violet-600"></i>
                        Profile Settings
                      </button>

                      <button
                        onClick={() => {
                          router.push('/tester');
                          setShowUserDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                      >
                        <i className="fas fa-flask w-4 text-violet-600"></i>
                        Tester Dashboard
                      </button>

                      <button
                        onClick={() => {
                          router.push('/admin-reports');
                          setShowUserDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                      >
                        <i className="fas fa-shield-alt w-4 text-violet-600"></i>
                        Admin Reports
                      </button>
                    </div>

                    {/* Sign Out */}
                    <div className="border-t border-gray-100 pt-2">
                      <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                      >
                        <i className="fas fa-sign-out-alt w-4"></i>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Login Button (if not logged in) */}
            {!user && (
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition flex items-center gap-2"
              >
                <i className="fas fa-sign-in-alt"></i>
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
