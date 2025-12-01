import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function TesterDashboard() {
  const [versions, setVersions] = useState([]);
  const [expandedVersion, setExpandedVersion] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({
    version_id: '',
    report_type: 'bug',
    title: '',
    description: '',
    severity: 'medium',
    steps_to_reproduce: '',
    screenshot: null,
    screenshotUrl: ''
  });

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const { data: versionsData } = await supabase
        .from('versions')
        .select('*, test_cases(*)')
        .order('release_date', { ascending: false });

      setVersions(versionsData || []);

      // Load existing test reports
      const { data: reportsData } = await supabase
        .from('test_reports')
        .select('*')
        .order('created_at', { ascending: false });

      // Initialize test results state with existing reports (latest report per test case)
      const initialResults = {};
      const reportsByTestCase = {};

      // Group reports by test_case_id (most recent first)
      reportsData?.forEach(report => {
        if (!reportsByTestCase[report.test_case_id]) {
          reportsByTestCase[report.test_case_id] = report;
        }
      });

      versionsData?.forEach(version => {
        version.test_cases?.forEach(testCase => {
          const existingReport = reportsByTestCase[testCase.id];
          const screenshotUrl = existingReport?.screenshots?.[0] || null;
          initialResults[testCase.id] = {
            notes: existingReport?.notes || '',
            status: existingReport?.status || '',
            document: null, // File objects can't be restored from DB
            documentUrl: screenshotUrl // But we can show the URL
          };
        });
      });

      setTestResults(initialResults);
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (versionId) => {
    setExpandedVersion(expandedVersion === versionId ? null : versionId);
  };

  const handleTestChange = (testCaseId, field, value) => {
    setTestResults(prev => ({
      ...prev,
      [testCaseId]: {
        ...prev[testCaseId],
        [field]: value
      }
    }));
  };

  const handleFileUpload = async (testCaseId, file) => {
    if (!file) return;

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${testCaseId}-${Date.now()}.${fileExt}`;
      const filePath = `test-reports/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('campaign-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('campaign-files')
        .getPublicUrl(filePath);

      // Store file URL and path in state
      setTestResults(prev => ({
        ...prev,
        [testCaseId]: {
          ...prev[testCaseId],
          document: file,
          documentUrl: publicUrl,
          filePath: filePath // Store the path for deletion
        }
      }));
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file. Please try again.');
    }
  };

  const handleFileDelete = async (testCaseId) => {
    const result = testResults[testCaseId];
    if (!result?.filePath && !result?.documentUrl) return;

    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      // Extract file path from URL if filePath is not available
      let pathToDelete = result.filePath;
      if (!pathToDelete && result.documentUrl) {
        const urlParts = result.documentUrl.split('/test-reports/');
        if (urlParts.length > 1) {
          pathToDelete = 'test-reports/' + urlParts[1];
        }
      }

      if (pathToDelete) {
        // Delete from Supabase Storage
        const { error: deleteError } = await supabase.storage
          .from('campaign-files')
          .remove([pathToDelete]);

        if (deleteError) {
          console.error('Failed to delete file from storage:', deleteError);
          // Continue anyway to clear from state
        }
      }

      // Clear from state
      setTestResults(prev => ({
        ...prev,
        [testCaseId]: {
          ...prev[testCaseId],
          document: null,
          documentUrl: null,
          filePath: null
        }
      }));

      alert('File deleted successfully');
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert('Failed to delete file. Please try again.');
    }
  };

  const handleSaveTestResults = async (versionId) => {
    const version = versions.find(v => v.id === versionId);
    if (!version) return;

    const resultsToSave = [];

    version.test_cases?.forEach(testCase => {
      const result = testResults[testCase.id];
      if (result && (result.notes || result.status)) {
        resultsToSave.push({
          test_case_id: testCase.id,
          version_id: versionId,
          tester_name: 'Tester', // You can add a name input field
          status: result.status || 'skip',
          notes: result.notes,
          screenshots: result.documentUrl ? [result.documentUrl] : [],
          browser: navigator.userAgent.includes('Chrome') ? 'Chrome' :
                  navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Other',
          device: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'
        });
      }
    });

    if (resultsToSave.length === 0) {
      alert('Please fill in at least one test result');
      return;
    }

    try {
      const { error } = await supabase
        .from('test_reports')
        .insert(resultsToSave);

      if (error) throw error;

      alert('Test results saved successfully! You can refresh the page to see the saved data.');
    } catch (error) {
      console.error('Failed to save test results:', error);
      alert('Failed to save test results');
    }
  };

  // Ad-hoc report handlers
  const openReportModal = (versionId) => {
    setReportForm({
      version_id: versionId,
      report_type: 'bug',
      title: '',
      description: '',
      severity: 'medium',
      steps_to_reproduce: '',
      screenshot: null,
      screenshotUrl: ''
    });
    setShowReportModal(true);
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setReportForm({
      version_id: '',
      report_type: 'bug',
      title: '',
      description: '',
      severity: 'medium',
      steps_to_reproduce: '',
      screenshot: null,
      screenshotUrl: ''
    });
  };

  const handleReportFormChange = (field, value) => {
    setReportForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleReportFileUpload = async (file) => {
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `adhoc-${Date.now()}.${fileExt}`;
      const filePath = `test-reports/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('campaign-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('campaign-files')
        .getPublicUrl(filePath);

      setReportForm(prev => ({
        ...prev,
        screenshot: file,
        screenshotUrl: publicUrl
      }));
    } catch (error) {
      console.error('Failed to upload screenshot:', error);
      alert('Failed to upload screenshot');
    }
  };

  const submitAdHocReport = async () => {
    // Validate required fields
    if (!reportForm.version_id || !reportForm.title || !reportForm.description) {
      alert('Please fill in all required fields (Version, Title, Description)');
      return;
    }

    try {
      const reportData = {
        version_id: reportForm.version_id,
        report_type: reportForm.report_type,
        title: reportForm.title,
        description: reportForm.description,
        severity: reportForm.report_type === 'bug' ? reportForm.severity : null,
        steps_to_reproduce: reportForm.steps_to_reproduce || null,
        tester_name: 'Tester',
        browser: navigator.userAgent.includes('Chrome') ? 'Chrome' :
                 navigator.userAgent.includes('Firefox') ? 'Firefox' :
                 navigator.userAgent.includes('Safari') ? 'Safari' : 'Other',
        device: /Mobile|Android|iPhone/.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
        screenshots: reportForm.screenshotUrl ? [reportForm.screenshotUrl] : []
      };

      const response = await fetch('/api/ad-hoc-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit report');
      }

      alert('Report submitted successfully!');
      closeReportModal();
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert('Failed to submit report: ' + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      testing: 'bg-blue-100 text-blue-700 border-blue-300',
      stable: 'bg-green-100 text-green-700 border-green-300',
      deprecated: 'bg-gray-100 text-gray-700 border-gray-300',
    };
    return badges[status] || badges.testing;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading tester dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                <i className="fas fa-vial text-violet-600 mr-2"></i>
                QA Testing Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/admin-reports"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2 text-sm font-medium"
              >
                <i className="fas fa-shield-alt"></i>
                Admin Reports
              </a>
              <a
                href="/"
                className="text-sm text-gray-600 hover:text-gray-900 transition flex items-center gap-2"
              >
                <i className="fas fa-arrow-left"></i>
                Back to App
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Version Testing Tracker</h2>
          <p className="text-sm text-gray-600">
            Click on a version to expand and fill in testing details
          </p>
        </div>

        {/* Version Rows */}
        <div className="space-y-3">
          {versions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <i className="fas fa-code-branch text-6xl text-gray-300 mb-4"></i>
              <p className="text-gray-600">No versions available for testing</p>
            </div>
          ) : (
            versions.map((version) => (
              <div key={version.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                {/* Version Summary Row */}
                <div
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => toggleExpand(version.id)}
                >
                  {/* Expand Icon */}
                  <button className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-violet-100 text-violet-600 rounded hover:bg-violet-200 transition">
                    <i className={`fas ${expandedVersion === version.id ? 'fa-minus' : 'fa-plus'}`}></i>
                  </button>

                  {/* Version Info */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Version Name */}
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Version</div>
                      <div className="font-bold text-gray-900">v{version.version_number}</div>
                    </div>

                    {/* Release Date */}
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Release Date & Time</div>
                      <div className="text-sm text-gray-700">{formatDate(version.release_date)}</div>
                    </div>

                    {/* About */}
                    <div className="md:col-span-1">
                      <div className="text-xs text-gray-500 mb-1">About</div>
                      <div className="text-sm text-gray-700 truncate">{version.title}</div>
                    </div>

                    {/* Status */}
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Status</div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(version.status)}`}>
                        {version.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Testing Details */}
                {expandedVersion === version.id && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="mb-6 space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{version.title}</h3>
                        {version.description && (
                          <p className="text-sm text-gray-600">{version.description}</p>
                        )}
                      </div>

                      {/* Changelog */}
                      {version.changelog && version.changelog.length > 0 && (
                        <div className="bg-gradient-to-br from-violet-50 to-blue-50 rounded-lg border-2 border-violet-200 p-5 shadow-sm">
                          <h4 className="font-bold text-violet-900 mb-4 flex items-center gap-2 text-base">
                            <i className="fas fa-sparkles"></i>
                            What's New in v{version.version_number}
                          </h4>
                          <ul className="space-y-3">
                            {version.changelog.map((change, idx) => (
                              <li key={idx} className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white shadow-sm">
                                  {change.type === 'feature' && (
                                    <i className="fas fa-plus text-green-600 text-xs"></i>
                                  )}
                                  {change.type === 'fix' && (
                                    <i className="fas fa-wrench text-blue-600 text-xs"></i>
                                  )}
                                  {change.type === 'improvement' && (
                                    <i className="fas fa-arrow-up text-purple-600 text-xs"></i>
                                  )}
                                </span>
                                <div className="flex-1">
                                  <span className="text-sm font-medium text-gray-800 capitalize mr-2">
                                    {change.type}:
                                  </span>
                                  <span className="text-sm text-gray-700">{change.description}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Known Issues */}
                      {version.known_issues && version.known_issues.length > 0 && (
                        <div className="bg-amber-50 rounded-lg border-2 border-amber-200 p-5 shadow-sm">
                          <h4 className="font-bold text-amber-900 mb-4 flex items-center gap-2 text-base">
                            <i className="fas fa-exclamation-triangle"></i>
                            Known Issues
                          </h4>
                          <ul className="space-y-2">
                            {version.known_issues.map((issue, idx) => (
                              <li key={idx} className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white shadow-sm">
                                  <i className="fas fa-bug text-amber-600 text-xs"></i>
                                </span>
                                <span className="text-sm text-gray-700 flex-1">{issue}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Testing Table */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-1/4">
                                Test Instructions
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-1/3">
                                Tester Notes
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-1/6">
                                Status
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-1/4">
                                Upload Docs
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {version.test_cases && version.test_cases.length > 0 ? (
                              version.test_cases.map((testCase, idx) => (
                                <tr key={testCase.id} className="hover:bg-gray-50">
                                  {/* Test Instructions */}
                                  <td className="px-4 py-4 align-top">
                                    <div className="text-sm font-medium text-gray-900 mb-2">
                                      {idx + 1}. {testCase.title}
                                    </div>
                                    {testCase.description && (
                                      <div className="text-xs text-gray-600 mb-2">{testCase.description}</div>
                                    )}
                                    {testCase.steps && testCase.steps.length > 0 && (
                                      <div className="text-xs text-gray-600 space-y-1">
                                        {testCase.steps.map((step, sIdx) => (
                                          <div key={sIdx} className="flex gap-2">
                                            <span className="font-medium">{step.step}.</span>
                                            <span>{step.action}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </td>

                                  {/* Tester Notes */}
                                  <td className="px-4 py-4 align-top">
                                    <textarea
                                      value={testResults[testCase.id]?.notes || ''}
                                      onChange={(e) => handleTestChange(testCase.id, 'notes', e.target.value)}
                                      placeholder="Enter your testing notes here..."
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none text-sm"
                                      rows="4"
                                    />
                                  </td>

                                  {/* Status Dropdown */}
                                  <td className="px-4 py-4 align-top">
                                    <select
                                      value={testResults[testCase.id]?.status || ''}
                                      onChange={(e) => handleTestChange(testCase.id, 'status', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                                    >
                                      <option value="">Select status</option>
                                      <option value="pass">Properly Working</option>
                                      <option value="fail">Not Working</option>
                                      <option value="blocked">Partially Working</option>
                                    </select>
                                  </td>

                                  {/* Upload Docs */}
                                  <td className="px-4 py-4 align-top">
                                    <div className="space-y-2">
                                      {/* Show file input if no file uploaded */}
                                      {!testResults[testCase.id]?.document && !testResults[testCase.id]?.documentUrl && (
                                        <label className="block">
                                          <span className="sr-only">Choose file</span>
                                          <input
                                            type="file"
                                            onChange={(e) => handleFileUpload(testCase.id, e.target.files[0])}
                                            className="block w-full text-sm text-gray-500
                                              file:mr-4 file:py-2 file:px-4
                                              file:rounded-lg file:border-0
                                              file:text-sm file:font-medium
                                              file:bg-violet-50 file:text-violet-700
                                              hover:file:bg-violet-100
                                              file:cursor-pointer cursor-pointer"
                                          />
                                        </label>
                                      )}

                                      {/* Show uploaded file info with delete button */}
                                      {(testResults[testCase.id]?.document || testResults[testCase.id]?.documentUrl) && (
                                        <div className="space-y-2">
                                          {/* Newly uploaded file */}
                                          {testResults[testCase.id]?.document && (
                                            <div className="flex items-center justify-between gap-2 p-2 bg-green-50 rounded border border-green-200">
                                              <div className="text-xs text-green-700 flex items-center gap-1 flex-1 min-w-0">
                                                <i className="fas fa-check-circle flex-shrink-0"></i>
                                                <span className="truncate">{testResults[testCase.id].document.name}</span>
                                              </div>
                                              <button
                                                onClick={() => handleFileDelete(testCase.id)}
                                                className="flex-shrink-0 text-red-600 hover:text-red-800 text-xs px-2 py-1 hover:bg-red-50 rounded transition"
                                                title="Delete file"
                                              >
                                                <i className="fas fa-trash"></i>
                                              </button>
                                            </div>
                                          )}

                                          {/* Previously uploaded file (from database) */}
                                          {!testResults[testCase.id]?.document && testResults[testCase.id]?.documentUrl && (
                                            <div className="flex items-center justify-between gap-2 p-2 bg-blue-50 rounded border border-blue-200">
                                              <a
                                                href={testResults[testCase.id].documentUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-700 hover:text-blue-900 flex items-center gap-1 flex-1 min-w-0"
                                              >
                                                <i className="fas fa-file flex-shrink-0"></i>
                                                <span className="truncate">View uploaded file</span>
                                              </a>
                                              <button
                                                onClick={() => handleFileDelete(testCase.id)}
                                                className="flex-shrink-0 text-red-600 hover:text-red-800 text-xs px-2 py-1 hover:bg-red-50 rounded transition"
                                                title="Delete file"
                                              >
                                                <i className="fas fa-trash"></i>
                                              </button>
                                            </div>
                                          )}

                                          {/* Replace button */}
                                          <label className="block">
                                            <button
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.currentTarget.nextElementSibling.click();
                                              }}
                                              className="w-full px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition"
                                            >
                                              <i className="fas fa-exchange-alt mr-1"></i>
                                              Replace File
                                            </button>
                                            <input
                                              type="file"
                                              onChange={(e) => handleFileUpload(testCase.id, e.target.files[0])}
                                              className="hidden"
                                            />
                                          </label>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                                  No test cases defined for this version
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Save Button */}
                      {version.test_cases && version.test_cases.length > 0 && (
                        <div className="border-t border-gray-200 p-4 bg-gray-50">
                          <button
                            onClick={() => handleSaveTestResults(version.id)}
                            className="px-6 py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition flex items-center gap-2"
                          >
                            <i className="fas fa-save"></i>
                            Save Test Results for v{version.version_number}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Floating Report Bug/Suggestion Button */}
        <button
          onClick={() => {
            if (versions.length > 0) {
              openReportModal(versions[0].id); // Open with first version selected
            } else {
              alert('No versions available to report against');
            }
          }}
          className="fixed bottom-8 right-8 bg-orange-500 hover:bg-orange-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 z-50"
          title="Report Bug or Suggestion"
        >
          <i className="fas fa-plus text-xl"></i>
        </button>
      </div>

      {/* Ad-Hoc Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <i className="fas fa-bug text-orange-500"></i>
                Report Bug or Suggestion
              </h3>
              <button
                onClick={closeReportModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Version Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Version <span className="text-red-500">*</span>
                </label>
                <select
                  value={reportForm.version_id}
                  onChange={(e) => handleReportFormChange('version_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select a version</option>
                  {versions.map(version => (
                    <option key={version.id} value={version.id}>
                      v{version.version_number} - {version.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="report_type"
                      value="bug"
                      checked={reportForm.report_type === 'bug'}
                      onChange={(e) => handleReportFormChange('report_type', e.target.value)}
                      className="text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm">Bug</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="report_type"
                      value="suggestion"
                      checked={reportForm.report_type === 'suggestion'}
                      onChange={(e) => handleReportFormChange('report_type', e.target.value)}
                      className="text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm">Suggestion</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="report_type"
                      value="improvement"
                      checked={reportForm.report_type === 'improvement'}
                      onChange={(e) => handleReportFormChange('report_type', e.target.value)}
                      className="text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm">Improvement</span>
                  </label>
                </div>
              </div>

              {/* Severity (only for bugs) */}
              {reportForm.report_type === 'bug' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Severity
                  </label>
                  <select
                    value={reportForm.severity}
                    onChange={(e) => handleReportFormChange('severity', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={reportForm.title}
                  onChange={(e) => handleReportFormChange('title', e.target.value)}
                  placeholder="Brief description of the issue or suggestion"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reportForm.description}
                  onChange={(e) => handleReportFormChange('description', e.target.value)}
                  placeholder="Detailed description..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Steps to Reproduce (optional, mainly for bugs) */}
              {reportForm.report_type === 'bug' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Steps to Reproduce (Optional)
                  </label>
                  <textarea
                    value={reportForm.steps_to_reproduce}
                    onChange={(e) => handleReportFormChange('steps_to_reproduce', e.target.value)}
                    placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  />
                </div>
              )}

              {/* Screenshot Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Screenshot (Optional)
                </label>
                {reportForm.screenshotUrl ? (
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
                    <i className="fas fa-check-circle text-green-600"></i>
                    <span className="text-sm text-green-700 flex-1 truncate">
                      {reportForm.screenshot?.name || 'Screenshot uploaded'}
                    </span>
                    <button
                      onClick={() => {
                        setReportForm(prev => ({
                          ...prev,
                          screenshot: null,
                          screenshotUrl: ''
                        }));
                      }}
                      className="text-red-600 hover:text-red-800 text-xs px-2 py-1 hover:bg-red-50 rounded transition"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleReportFileUpload(e.target.files[0])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                  />
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closeReportModal}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={submitAdHocReport}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center gap-2"
              >
                <i className="fas fa-paper-plane"></i>
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
