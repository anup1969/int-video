import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { generatePassword } from '../lib/utils/password';
import Header from '../components/Header';
import TemplatesModal from '../components/TemplatesModal';

export default function Dashboard() {
  const router = useRouter();

  // Version check - if you see this in console, the latest code is loaded
  useEffect(() => {
    console.log('Dashboard version: 3.0 - Response count fixed + Delete button with debug logging');
  }, []);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'draft', 'active', 'archived'
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [campaignToEdit, setCampaignToEdit] = useState(null);
  const [editPassword, setEditPassword] = useState(null);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/campaigns');
      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `New Campaign ${campaigns.length + 1}`,
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

  const handleSelectTemplate = async (template) => {
    try {
      // Create a new campaign
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${template.name} - ${Date.now()}`,
          status: 'draft'
        })
      });

      if (response.ok) {
        const { campaign } = await response.json();

        // Load the template steps into the campaign
        // Note: The template steps need to be converted to campaign nodes
        // For now, we'll navigate to the editor and let the user see the template
        router.push(`/?id=${campaign.id}&template=${template.id}`);
      }
    } catch (error) {
      console.error('Failed to create campaign from template:', error);
    }
  };

  const handleDuplicateCampaign = async (campaign) => {
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${campaign.name} (Copy)`,
          status: 'draft'
        })
      });

      if (response.ok) {
        const { campaign: newCampaign } = await response.json();

        // Copy the campaign data
        await fetch(`/api/campaigns/${newCampaign.id}/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(campaign.data)
        });

        loadCampaigns();
      }
    } catch (error) {
      console.error('Failed to duplicate campaign:', error);
    }
  };

  const handleDeleteClick = (campaign) => {
    setCampaignToDelete(campaign);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!campaignToDelete) return;

    try {
      const response = await fetch(`/api/campaigns/${campaignToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setCampaigns(campaigns.filter(c => c.id !== campaignToDelete.id));
        setShowDeleteModal(false);
        setCampaignToDelete(null);
      }
    } catch (error) {
      console.error('Failed to delete campaign:', error);
    }
  };

  const handleViewResponses = (campaignId) => {
    router.push(`/responses/${campaignId}`);
  };

  const handleOpenSettings = (campaign) => {
    setCampaignToEdit(campaign);
    setEditPassword(campaign.password || null);
    setShowSettingsModal(true);
  };

  const handleSaveSettings = async () => {
    if (!campaignToEdit) return;

    try {
      const response = await fetch(`/api/campaigns/${campaignToEdit.id}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: [],
          connections: [],
          settings: {
            password: editPassword
          }
        })
      });

      if (response.ok) {
        // Update local campaigns list
        setCampaigns(campaigns.map(c =>
          c.id === campaignToEdit.id ? { ...c, password: editPassword } : c
        ));
        setShowSettingsModal(false);
        setCampaignToEdit(null);
        setEditPassword(null);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    // Filter by status
    if (filterStatus !== 'all' && campaign.status !== filterStatus) {
      return false;
    }

    // Filter by search query
    if (searchQuery && !campaign.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-700',
      active: 'bg-green-100 text-green-700',
      paused: 'bg-yellow-100 text-yellow-700',
      archived: 'bg-purple-100 text-purple-700'
    };

    return badges[status] || badges.draft;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-blue-100">
      <Header
        title="Campaign Dashboard"
        showNewCampaign={true}
        showTemplates={true}
        onTemplatesClick={() => setShowTemplatesModal(true)}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters & Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md w-full">
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                >
                  <i className="fas fa-th"></i>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                >
                  <i className="fas fa-list"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
              </div>
              <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-video text-violet-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {campaigns.filter(c => c.status === 'active').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-play-circle text-green-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Draft</p>
                <p className="text-2xl font-bold text-gray-600">
                  {campaigns.filter(c => c.status === 'draft').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-edit text-gray-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Archived</p>
                <p className="text-2xl font-bold text-purple-600">
                  {campaigns.filter(c => c.status === 'archived').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-archive text-purple-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Campaigns List/Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading campaigns...</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📹</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchQuery || filterStatus !== 'all' ? 'No campaigns found' : 'No campaigns yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Create your first interactive video campaign to get started'}
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <button
                onClick={handleCreateCampaign}
                className="px-6 py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition"
              >
                <i className="fas fa-plus mr-2"></i>
                Create Your First Campaign
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                viewMode={viewMode}
                onEdit={() => router.push(`/?id=${campaign.id}`)}
                onSettings={() => handleOpenSettings(campaign)}
                onDuplicate={() => handleDuplicateCampaign(campaign)}
                onDelete={() => handleDeleteClick(campaign)}
                onViewResponses={() => handleViewResponses(campaign.id)}
                getStatusBadge={getStatusBadge}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-trash text-red-600 text-xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Campaign?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{campaignToDelete?.name}"? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      <TemplatesModal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Campaign Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowSettingsModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <i className="fas fa-cog text-violet-600"></i>
                  Campaign Settings
                </h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="p-1 hover:bg-gray-100 rounded transition"
                >
                  <i className="fas fa-times text-gray-500"></i>
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Settings for "{campaignToEdit?.name}"
              </p>

              {/* Password Protection Section */}
              <div className="border-t border-gray-200 pt-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <i className="fas fa-lock text-violet-600"></i>
                  Password Protection
                  <span className="text-gray-500 font-normal">(Optional)</span>
                </label>
                <div className="flex items-center gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (editPassword) {
                        setEditPassword(null);
                      } else {
                        setEditPassword(generatePassword());
                      }
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      editPassword
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                    }`}
                  >
                    <i className={`fas ${editPassword ? 'fa-lock-open' : 'fa-lock'} mr-2`}></i>
                    {editPassword ? 'Remove Password' : 'Enable Password'}
                  </button>
                  {editPassword && (
                    <button
                      type="button"
                      onClick={() => setEditPassword(generatePassword())}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition"
                    >
                      <i className="fas fa-sync-alt mr-2"></i>
                      Generate New
                    </button>
                  )}
                </div>
                {editPassword && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Campaign Password:
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(editPassword);
                          alert('Password copied to clipboard!');
                        }}
                        className="text-sm text-violet-600 hover:text-violet-800 font-medium"
                      >
                        <i className="fas fa-copy mr-1"></i>
                        Copy
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent font-mono text-lg"
                      placeholder="Enter custom password"
                    />
                    <p className="text-xs text-gray-600 mt-2">
                      <i className="fas fa-info-circle mr-1"></i>
                      Visitors will need this password to access the campaign
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowSettingsModal(false);
                    setCampaignToEdit(null);
                    setEditPassword(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition"
                >
                  <i className="fas fa-save mr-2"></i>
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CampaignCard({ campaign, viewMode, onEdit, onSettings, onDuplicate, onDelete, onViewResponses, getStatusBadge, formatDate }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [showShortCopyToast, setShowShortCopyToast] = useState(false);
  const [generatingShortUrl, setGeneratingShortUrl] = useState(false);

  const stepCount = campaign.data?.nodes?.filter(n => n.type === 'video').length || 0;
  const responseCount = campaign.response_count || 0;
  const usageLimit = campaign.usage_limit;
  const usageCount = campaign.usage_count || 0;
  const campaignUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/campaign/${campaign.id}`;
  const shortUrl = campaign.short_url ? `${typeof window !== 'undefined' ? window.location.origin : ''}/${campaign.short_url}` : null;

  // Debug logging
  console.log(`Campaign: ${campaign.name}, Response Count: ${responseCount}, Has onDelete: ${typeof onDelete}`);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(campaignUrl);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 2000);
    setShowMenu(false);
  };

  const handleCopyShortUrl = async () => {
    if (shortUrl) {
      // Short URL already exists, just copy it
      navigator.clipboard.writeText(shortUrl);
      setShowShortCopyToast(true);
      setTimeout(() => setShowShortCopyToast(false), 2000);
    } else {
      // Generate short URL first
      setGeneratingShortUrl(true);
      try {
        const response = await fetch(`/api/campaigns/${campaign.id}/generate-short-url`, {
          method: 'POST'
        });
        const data = await response.json();

        if (data.shortUrl) {
          const newShortUrl = `${window.location.origin}/${data.shortUrl}`;
          navigator.clipboard.writeText(newShortUrl);
          setShowShortCopyToast(true);
          setTimeout(() => setShowShortCopyToast(false), 2000);

          // Reload campaigns to get updated short URL
          window.location.reload();
        }
      } catch (error) {
        console.error('Failed to generate short URL:', error);
        alert('Failed to generate short URL');
      } finally {
        setGeneratingShortUrl(false);
      }
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-2xl">
              🎬
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">{campaign.name}</h3>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-sm text-violet-600 font-medium">
                  <i className="fas fa-users mr-1"></i>
                  {responseCount} {responseCount === 1 ? 'response' : 'responses'}
                </span>
                {usageLimit && (
                  <span className="text-sm text-orange-600 font-medium">
                    <i className="fas fa-eye mr-1"></i>
                    {usageCount}/{usageLimit} views
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span>{stepCount} steps</span>
                <span>•</span>
                <span>Created {formatDate(campaign.created_at)}</span>
                <span>•</span>
                <span>Modified {formatDate(campaign.updated_at)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(campaign.status)}`}>
              {campaign.status}
            </span>

            {/* Action buttons - all visible with icons */}
            <div className="flex items-center gap-1 relative">
              <button
                onClick={onEdit}
                className="px-3 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition flex items-center gap-2"
                title="Open Builder"
              >
                <i className="fas fa-edit"></i>
                Open Builder
              </button>

              <button
                onClick={onSettings}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="Campaign Settings"
              >
                <i className="fas fa-cog text-gray-600"></i>
              </button>

              <button
                onClick={handleCopyUrl}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="Copy Full URL"
              >
                <i className="fas fa-link text-gray-600"></i>
              </button>

              <button
                onClick={handleCopyShortUrl}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title={shortUrl ? "Copy Short URL" : "Generate & Copy Short URL"}
                disabled={generatingShortUrl}
              >
                {generatingShortUrl ? (
                  <i className="fas fa-spinner fa-spin text-gray-600"></i>
                ) : (
                  <i className="fas fa-compress-alt text-gray-600"></i>
                )}
              </button>

              <button
                onClick={onViewResponses}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="View Responses"
              >
                <i className="fas fa-chart-bar text-gray-600"></i>
              </button>

              <button
                onClick={onDuplicate}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="Duplicate Campaign"
              >
                <i className="fas fa-copy text-gray-600"></i>
              </button>

              <button
                onClick={onDelete}
                className="p-2 hover:bg-red-50 rounded-lg transition"
                title="Delete Campaign"
              >
                <i className="fas fa-trash text-red-600"></i>
              </button>

              {showCopyToast && (
                <div className="absolute right-0 top-10 bg-green-600 text-white px-3 py-1 rounded-lg shadow-lg text-xs whitespace-nowrap z-20">
                  Full URL copied!
                </div>
              )}
              {showShortCopyToast && (
                <div className="absolute right-0 top-10 bg-blue-600 text-white px-3 py-1 rounded-lg shadow-lg text-xs whitespace-nowrap z-20">
                  Short URL copied!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden">
      <div className="h-40 bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-5xl">
        🎬
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 flex-1">{campaign.name}</h3>

          {/* Action buttons - all visible with icons */}
          <div className="flex items-center gap-1 relative">
            <button
              onClick={onEdit}
              className="p-1.5 hover:bg-gray-100 rounded transition"
              title="Edit Campaign"
            >
              <i className="fas fa-edit text-gray-600 text-sm"></i>
            </button>

            <button
              onClick={handleCopyUrl}
              className="p-1.5 hover:bg-gray-100 rounded transition"
              title="Copy Full URL"
            >
              <i className="fas fa-link text-gray-600 text-sm"></i>
            </button>

            <button
              onClick={handleCopyShortUrl}
              className="p-1.5 hover:bg-gray-100 rounded transition"
              title={shortUrl ? "Copy Short URL" : "Generate & Copy Short URL"}
              disabled={generatingShortUrl}
            >
              {generatingShortUrl ? (
                <i className="fas fa-spinner fa-spin text-gray-600 text-sm"></i>
              ) : (
                <i className="fas fa-compress-alt text-gray-600 text-sm"></i>
              )}
            </button>

            <button
              onClick={onViewResponses}
              className="p-1.5 hover:bg-gray-100 rounded transition"
              title="View Responses"
            >
              <i className="fas fa-chart-bar text-gray-600 text-sm"></i>
            </button>

            <button
              onClick={onDuplicate}
              className="p-1.5 hover:bg-gray-100 rounded transition"
              title="Duplicate Campaign"
            >
              <i className="fas fa-copy text-gray-600 text-sm"></i>
            </button>

            <button
              onClick={onDelete}
              className="p-1.5 hover:bg-red-50 rounded transition"
              title="Delete Campaign"
            >
              <i className="fas fa-trash text-red-600 text-sm"></i>
            </button>

            {showCopyToast && (
              <div className="absolute right-0 top-8 bg-green-600 text-white px-3 py-1 rounded-lg shadow-lg text-xs whitespace-nowrap z-20">
                Full URL copied!
              </div>
            )}
            {showShortCopyToast && (
              <div className="absolute right-0 top-8 bg-blue-600 text-white px-3 py-1 rounded-lg shadow-lg text-xs whitespace-nowrap z-20">
                Short URL copied!
              </div>
            )}
          </div>
        </div>

        <div className="mb-2 flex items-center gap-3">
          <span className="text-sm text-violet-600 font-medium">
            <i className="fas fa-users mr-1"></i>
            {responseCount} {responseCount === 1 ? 'response' : 'responses'}
          </span>
          {usageLimit && (
            <span className="text-sm text-orange-600 font-medium">
              <i className="fas fa-eye mr-1"></i>
              {usageCount}/{usageLimit}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(campaign.status)}`}>
            {campaign.status}
          </span>
          <span className="text-xs text-gray-600">{stepCount} steps</span>
        </div>

        <div className="text-xs text-gray-500 mb-4">
          <div>Created: {formatDate(campaign.created_at)}</div>
          <div>Modified: {formatDate(campaign.updated_at)}</div>
        </div>

        <button
          onClick={onEdit}
          className="w-full px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition"
        >
          Open Builder
        </button>
      </div>
    </div>
  );
}
