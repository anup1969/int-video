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
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'list'
  const [selectedFormStep, setSelectedFormStep] = useState(null); // For form modal
  const [transcribing, setTranscribing] = useState({}); // Track transcription loading per step

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
            value: formatAnswerValue(step.answerData, response.id, step.stepId),
            rawData: {
              ...step.answerData,
              stepId: step.stepId,
              transcription: step.transcription // Include existing transcription if any
            } // Keep raw data for form display and transcription
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

  const formatAnswerValue = (answerData, responseId, stepId) => {
    if (!answerData) return 'No response';

    if (answerData.type === 'text') {
      return answerData.value;
    } else if (answerData.type === 'option') {
      return answerData.value;
    } else if (answerData.type === 'contact-form') {
      const formData = answerData.value;
      return `${formData.name || ''} - ${formData.email || ''} - ${formData.phone || ''}`;
    } else if (answerData.type === 'video' && answerData.fileUrl) {
      return (
        <a
          href={`/viewer/${id}?responseId=${responseId}&stepId=${stepId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-violet-600 hover:text-violet-800 underline font-medium"
        >
          View Video
        </a>
      );
    } else if (answerData.type === 'audio' && answerData.fileUrl) {
      return (
        <a
          href={`/viewer/${id}?responseId=${responseId}&stepId=${stepId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-violet-600 hover:text-violet-800 underline font-medium"
        >
          View Audio
        </a>
      );
    } else if (answerData.type === 'video') {
      return 'Video response recorded';
    } else if (answerData.type === 'audio') {
      return 'Audio response recorded';
    } else if (answerData.type === 'file' && answerData.fileUrl) {
      return (
        <a
          href={answerData.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
        >
          <i className="fas fa-download"></i>
          {answerData.value}
          {answerData.fileSize && ` (${(answerData.fileSize / 1024 / 1024).toFixed(2)} MB)`}
        </a>
      );
    }

    return JSON.stringify(answerData.value);
  };

  // Get form data for a specific step across all responses
  const getFormDataForStep = (stepNumber) => {
    const formResponses = [];
    const formFields = new Set();

    filteredResponses.forEach(response => {
      const stepResponse = response.responses.find(r => r.step === stepNumber);
      if (stepResponse && stepResponse.rawData?.type === 'contact-form') {
        const formData = stepResponse.rawData.value || {};

        // Collect all form field keys
        Object.keys(formData).forEach(key => formFields.add(key));

        formResponses.push({
          userName: response.userName,
          email: response.email,
          formData: formData
        });
      }
    });

    return {
      responses: formResponses,
      fields: Array.from(formFields)
    };
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

  const handleTranscribe = async (responseId, stepId, fileUrl) => {
    const key = `${responseId}-${stepId}`;
    setTranscribing(prev => ({ ...prev, [key]: true }));

    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl, responseId, stepId })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Transcription failed');
      }

      const data = await res.json();

      // Update local state with transcription
      setResponses(prev => prev.map(response => {
        if (response.id === responseId) {
          return {
            ...response,
            responses: response.responses.map(resp => {
              if (resp.rawData?.stepId === stepId) {
                return {
                  ...resp,
                  rawData: {
                    ...resp.rawData,
                    transcription: data.transcription
                  }
                };
              }
              return resp;
            })
          };
        }
        return response;
      }));

      // Also update selectedResponse if it's open
      if (selectedResponse && selectedResponse.id === responseId) {
        setSelectedResponse(prev => ({
          ...prev,
          responses: prev.responses.map(resp => {
            if (resp.rawData?.stepId === stepId) {
              return {
                ...resp,
                rawData: {
                  ...resp.rawData,
                  transcription: data.transcription
                }
              };
            }
            return resp;
          })
        }));
      }

    } catch (error) {
      console.error('Transcription error:', error);
      alert('Failed to transcribe: ' + error.message);
    } finally {
      setTranscribing(prev => ({ ...prev, [key]: false }));
    }
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
                onClick={() => router.push(`/?id=${id}`)}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition flex items-center gap-2"
              >
                <i className="fas fa-edit"></i>
                Open Builder
              </button>
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

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded transition ${
                    viewMode === 'table'
                      ? 'bg-violet-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Table View"
                >
                  <i className="fas fa-table"></i>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded transition ${
                    viewMode === 'list'
                      ? 'bg-violet-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="List View"
                >
                  <i className="fas fa-list"></i>
                </button>
              </div>
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
        ) : viewMode === 'table' ? (
          /* Spreadsheet-style Table View */
          <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200 sticky left-0 bg-gray-50 z-10">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
                    Submitted
                  </th>
                  {/* Dynamic columns for each question */}
                  {filteredResponses[0]?.responses.map((resp, idx) => {
                    const slideIcon = resp.slideType === 'text' ? '📄' : '🎬';
                    let answerTypeLabel = '';
                    if (resp.type === 'multiple-choice') answerTypeLabel = 'MCQ';
                    else if (resp.type === 'text' || resp.type === 'open-ended') answerTypeLabel = 'Text';
                    else if (resp.type === 'video') answerTypeLabel = 'Video';
                    else if (resp.type === 'audio') answerTypeLabel = 'Audio';
                    else if (resp.type === 'button') answerTypeLabel = 'Button';
                    else if (resp.type === 'contact-form') answerTypeLabel = 'Form';

                    const isFormType = resp.type === 'contact-form';

                    return (
                      <th key={idx} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div>Step {resp.step}</div>
                            <div className="text-xs font-normal text-gray-500 mt-1">
                              {slideIcon} {answerTypeLabel}
                            </div>
                          </div>
                          {isFormType && (
                            <button
                              onClick={() => setSelectedFormStep(resp.step)}
                              className="p-1.5 hover:bg-violet-100 rounded transition"
                              title="View all form responses"
                            >
                              <i className="fas fa-table text-violet-600"></i>
                            </button>
                          )}
                        </div>
                      </th>
                    );
                  })}
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredResponses.map((response, rowIdx) => (
                  <tr key={response.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 sticky left-0 bg-white font-medium">
                      {response.userName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">
                      {response.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">
                      {formatDate(response.completedAt)}
                    </td>
                    {/* Dynamic answer cells */}
                    {response.responses.map((resp, cellIdx) => (
                      <td key={cellIdx} className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                        <div className="max-w-xs">
                          {resp.value}
                        </div>
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => router.push(`/?id=${id}`)}
                        className="px-3 py-1.5 bg-violet-600 text-white rounded hover:bg-violet-700 transition text-xs font-medium inline-flex items-center gap-1"
                        title="Open campaign builder"
                      >
                        <i className="fas fa-edit"></i>
                        Open Builder
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* List View */
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
                  {selectedResponse.responses.map((resp, idx) => {
                    // Determine slide type display
                    const slideIcon = resp.slideType === 'text' ? '📄' : '🎬';
                    const slideLabel = resp.slideType === 'text' ? 'Text Slide' : 'Video Slide';

                    // Determine answer type display
                    let answerTypeLabel = '';
                    if (resp.type === 'multiple-choice') answerTypeLabel = 'MCQ';
                    else if (resp.type === 'text') answerTypeLabel = 'Open-ended';
                    else if (resp.type === 'video') answerTypeLabel = 'Video';
                    else if (resp.type === 'audio') answerTypeLabel = 'Audio';
                    else if (resp.type === 'button') answerTypeLabel = 'Button';
                    else if (resp.type === 'open-ended') answerTypeLabel = 'Open-ended';

                    const isAudioOrVideo = resp.type === 'video' || resp.type === 'audio';
                    const hasFileUrl = resp.rawData?.fileUrl;
                    const transcriptionKey = `${selectedResponse.id}-${resp.rawData?.stepId}`;
                    const isTranscribing = transcribing[transcriptionKey];
                    const hasTranscription = resp.rawData?.transcription;

                    return (
                      <div key={idx} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-violet-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {resp.step}
                          </div>
                          <div className="flex-1">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-xs font-semibold text-violet-600 bg-violet-100 px-2 py-1 rounded">
                                {slideIcon} {slideLabel} ({answerTypeLabel})
                              </span>
                              {/* Transcribe button for audio/video */}
                              {isAudioOrVideo && hasFileUrl && !hasTranscription && (
                                <button
                                  onClick={() => handleTranscribe(
                                    selectedResponse.id,
                                    resp.rawData.stepId,
                                    resp.rawData.fileUrl
                                  )}
                                  disabled={isTranscribing}
                                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                  {isTranscribing ? (
                                    <>
                                      <i className="fas fa-spinner fa-spin"></i>
                                      Transcribing...
                                    </>
                                  ) : (
                                    <>
                                      <i className="fas fa-file-alt"></i>
                                      Transcribe
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                            <div className="text-gray-900 font-medium">
                              {resp.value}
                            </div>
                            {/* Display transcription if available */}
                            {hasTranscription && (
                              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                                <div className="flex items-center gap-2 mb-2">
                                  <i className="fas fa-file-alt text-blue-600"></i>
                                  <span className="text-xs font-semibold text-blue-600">Transcription</span>
                                </div>
                                <p className="text-sm text-gray-700 italic">"{resp.rawData.transcription}"</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Responses Modal */}
      {selectedFormStep && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedFormStep(null)}
        >
          <div
            className="bg-white rounded-lg max-w-5xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Form Responses - Step {selectedFormStep}</h3>
                <p className="text-sm text-gray-600">All contact form submissions for this step</p>
              </div>
              <button
                onClick={() => setSelectedFormStep(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <i className="fas fa-times text-gray-500"></i>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {(() => {
                const formData = getFormDataForStep(selectedFormStep);
                const { responses: formResponses, fields } = formData;

                if (formResponses.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      No form responses found for this step
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-b border-gray-200 sticky left-0 bg-gray-50">
                            Subscriber
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-b border-gray-200">
                            Email
                          </th>
                          {fields.map((field, idx) => (
                            <th key={idx} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-b border-gray-200 capitalize">
                              {field}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {formResponses.map((response, rowIdx) => (
                          <tr key={rowIdx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900 border-r border-b border-gray-200 sticky left-0 bg-white font-medium">
                              {response.userName}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 border-r border-b border-gray-200">
                              {response.email}
                            </td>
                            {fields.map((field, cellIdx) => (
                              <td key={cellIdx} className="px-4 py-3 text-sm text-gray-700 border-r border-b border-gray-200">
                                {response.formData[field] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
