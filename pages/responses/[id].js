import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ResponseViewer() {
  const router = useRouter();
  const { id } = router.query;

  const [campaign, setCampaign] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'completed', 'incomplete'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!id) return;

    loadCampaignAndResponses();
  }, [id]);

  const loadCampaignAndResponses = async () => {
    try {
      setLoading(true);

      // Load campaign details
      const campaignRes = await fetch(`/api/campaigns/${id}`);
      const campaignData = await campaignRes.json();
      setCampaign(campaignData.campaign);

      // Load actual responses from API
      const responsesRes = await fetch(`/api/campaigns/${id}/responses`);
      const responsesData = await responsesRes.json();

      // Transform responses to match the UI format
      const transformedResponses = responsesData.responses.map(response => {
        const formatDuration = (seconds) => {
          if (!seconds) return '0s';
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
        };

        return {
          id: response.id,
          userName: response.user_name || 'Anonymous',
          email: response.email || 'No email provided',
          completedAt: response.completed_at || response.created_at,
          status: response.completed ? 'completed' : 'incomplete',
          duration: formatDuration(response.duration),
          deviceType: response.data?.deviceType || 'unknown',
          userAgent: response.data?.userAgent || '',
          responses: (response.data?.steps || []).map(step => ({
            step: step.stepNumber,
            type: step.answerType,
            slideType: step.slideType || 'video', // video, text, etc.
            value: formatAnswerValue(step.answerData)
          }))
        };
      });

      setResponses(transformedResponses);

    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAnswerValue = (answerData) => {
    if (!answerData) return 'No response';

    if (answerData.type === 'text') {
      return answerData.value;
    } else if (answerData.type === 'option') {
      return answerData.value;
    } else if (answerData.type === 'contact-form') {
      const formData = answerData.value;
      return `${formData.name || ''} - ${formData.email || ''} - ${formData.phone || ''}`;
    } else if (answerData.type === 'video') {
      return 'Video response recorded';
    } else if (answerData.type === 'audio') {
      return 'Audio response recorded';
    }

    return JSON.stringify(answerData.value);
  };

  const filteredResponses = responses.filter(response => {
    // Filter by status
    if (filterStatus !== 'all' && response.status !== filterStatus) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        response.userName?.toLowerCase().includes(query) ||
        response.email?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const handleExportCSV = () => {
    // Placeholder for CSV export functionality
    alert('CSV export functionality coming soon!');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading responses...</div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-xl font-bold text-gray-800 mb-2">Campaign not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <i className="fas fa-arrow-left text-gray-600"></i>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{campaign.name}</h1>
                <p className="text-sm text-gray-600">Campaign Responses</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center gap-2"
              >
                <i className="fas fa-download"></i>
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Responses</p>
                <p className="text-2xl font-bold text-gray-900">{responses.length}</p>
              </div>
              <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-comments text-violet-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {responses.filter(r => r.status === 'completed').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-check-circle text-green-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Incomplete</p>
                <p className="text-2xl font-bold text-orange-600">
                  {responses.filter(r => r.status === 'incomplete').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-clock text-orange-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {responses.length > 0
                    ? Math.round((responses.filter(r => r.status === 'completed').length / responses.length) * 100)
                    : 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-chart-line text-blue-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md w-full">
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                <option value="all">All Responses</option>
                <option value="completed">Completed</option>
                <option value="incomplete">Incomplete</option>
              </select>
            </div>
          </div>
        </div>

        {/* Responses List */}
        {filteredResponses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchQuery || filterStatus !== 'all' ? 'No responses found' : 'No responses yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Share your campaign to start collecting responses'}
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <button
                onClick={() => router.push(`/campaign/${id}`)}
                className="px-6 py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition"
              >
                <i className="fas fa-external-link-alt mr-2"></i>
                View Campaign
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Respondent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed At
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResponses.map((response) => (
                  <tr key={response.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{response.userName}</div>
                        <div className="text-sm text-gray-500">{response.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        response.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {response.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        {response.deviceType === 'mobile' && <i className="fas fa-mobile-alt text-blue-500"></i>}
                        {response.deviceType === 'tablet' && <i className="fas fa-tablet-alt text-green-500"></i>}
                        {response.deviceType === 'desktop' && <i className="fas fa-desktop text-gray-500"></i>}
                        <span className="capitalize">{response.deviceType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {response.duration}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(response.completedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedResponse(response)}
                        className="text-violet-600 hover:text-violet-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Response Detail Modal */}
      {selectedResponse && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedResponse(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedResponse.userName}</h3>
                <p className="text-sm text-gray-600">{selectedResponse.email}</p>
              </div>
              <button
                onClick={() => setSelectedResponse(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <i className="fas fa-times text-gray-500"></i>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedResponse.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {selectedResponse.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Duration: {selectedResponse.duration}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatDate(selectedResponse.completedAt)}
                  </div>
                </div>
              </div>

              {/* Response Journey */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Response Journey</h4>
                <div className="space-y-4">
                  {selectedResponse.responses.map((resp, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-violet-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {resp.step}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-violet-600 bg-violet-100 px-2 py-1 rounded">
                              {resp.slideType === 'video' && '🎬 Video Slide'}
                              {resp.slideType === 'text' && '📄 Text Slide'}
                              {(!resp.slideType || resp.slideType === 'video') && '🎬 Video Slide'}
                            </span>
                            <span className="text-sm text-gray-600">
                              {resp.type === 'multiple-choice' && '→ 📊 Multiple Choice'}
                              {resp.type === 'text' && '→ 📝 Text Response'}
                              {resp.type === 'video' && '→ 📹 Video Response'}
                              {resp.type === 'audio' && '→ 🎤 Audio Response'}
                              {resp.type === 'button' && '→ 🔘 Button Response'}
                            </span>
                          </div>
                          <div className="text-gray-900 font-medium">
                            {resp.value}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
