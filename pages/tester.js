import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function TesterDashboard() {
  const [versions, setVersions] = useState([]);
  const [expandedVersion, setExpandedVersion] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(true);

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
        .from('campaign-videos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('campaign-videos')
        .getPublicUrl(filePath);

      // Store file URL in state
      setTestResults(prev => ({
        ...prev,
        [testCaseId]: {
          ...prev[testCaseId],
          document: file,
          documentUrl: publicUrl
        }
      }));
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file. Please try again.');
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
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{version.title}</h3>
                      {version.description && (
                        <p className="text-sm text-gray-600 mb-4">{version.description}</p>
                      )}

                      {/* Changelog */}
                      {version.changelog && version.changelog.length > 0 && (
                        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
                          <h4 className="font-semibold text-gray-900 mb-3">What's New:</h4>
                          <ul className="space-y-2">
                            {version.changelog.map((change, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <span className="text-violet-600 mt-0.5">
                                  {change.type === 'feature' && <i className="fas fa-plus-circle"></i>}
                                  {change.type === 'fix' && <i className="fas fa-wrench"></i>}
                                  {change.type === 'improvement' && <i className="fas fa-arrow-up"></i>}
                                </span>
                                <span className="text-gray-700">{change.description}</span>
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
                                      {testResults[testCase.id]?.document && (
                                        <div className="text-xs text-green-600 flex items-center gap-1">
                                          <i className="fas fa-check-circle"></i>
                                          {testResults[testCase.id].document.name}
                                        </div>
                                      )}
                                      {!testResults[testCase.id]?.document && testResults[testCase.id]?.documentUrl && (
                                        <a
                                          href={testResults[testCase.id].documentUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                        >
                                          <i className="fas fa-file"></i>
                                          View uploaded file
                                        </a>
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
      </div>
    </div>
  );
}
