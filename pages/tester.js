import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function TesterDashboard() {
  const [activeTab, setActiveTab] = useState('versions');
  const [versions, setVersions] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [testReports, setTestReports] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    totalVersions: 0,
    activeVersion: null,
    totalTests: 0,
    passRate: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load versions
      const { data: versionsData } = await supabase
        .from('versions')
        .select('*')
        .order('release_date', { ascending: false });

      setVersions(versionsData || []);

      // Load test cases
      const { data: testCasesData } = await supabase
        .from('test_cases')
        .select('*, version:versions(version_number)')
        .order('created_at', { ascending: false });

      setTestCases(testCasesData || []);

      // Load test reports
      const { data: reportsData } = await supabase
        .from('test_reports')
        .select('*, test_case:test_cases(title), version:versions(version_number)')
        .order('created_at', { ascending: false });

      setTestReports(reportsData || []);

      // Calculate stats
      const activeVersion = versionsData?.find(v => v.status === 'testing');
      const totalTests = reportsData?.length || 0;
      const passedTests = reportsData?.filter(r => r.status === 'pass').length || 0;
      const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

      setStats({
        totalVersions: versionsData?.length || 0,
        activeVersion,
        totalTests,
        passRate,
      });
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      testing: 'bg-blue-100 text-blue-700',
      stable: 'bg-green-100 text-green-700',
      deprecated: 'bg-gray-100 text-gray-700',
      pass: 'bg-green-100 text-green-700',
      fail: 'bg-red-100 text-red-700',
      blocked: 'bg-yellow-100 text-yellow-700',
      skip: 'bg-gray-100 text-gray-700',
    };
    return badges[status] || badges.testing;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      critical: 'bg-red-100 text-red-700 border-red-300',
      high: 'bg-orange-100 text-orange-700 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      low: 'bg-blue-100 text-blue-700 border-blue-300',
    };
    return badges[priority] || badges.medium;
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
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                <i className="fas fa-vial text-violet-600 mr-2"></i>
                Tester Dashboard
              </h1>
              <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm font-medium">
                QA & Testing
              </span>
            </div>
            <a
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900 transition"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to App
            </a>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Versions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalVersions}</p>
              </div>
              <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-code-branch text-violet-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Version</p>
                <p className="text-lg font-bold text-blue-600">
                  {stats.activeVersion?.version_number || 'None'}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-rocket text-blue-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTests}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-clipboard-check text-green-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pass Rate</p>
                <p className="text-2xl font-bold text-green-600">{stats.passRate}%</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-chart-line text-green-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('versions')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition ${
                  activeTab === 'versions'
                    ? 'border-violet-600 text-violet-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className="fas fa-code-branch mr-2"></i>
                Versions & Changelog
              </button>
              <button
                onClick={() => setActiveTab('test-cases')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition ${
                  activeTab === 'test-cases'
                    ? 'border-violet-600 text-violet-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className="fas fa-tasks mr-2"></i>
                Test Cases
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition ${
                  activeTab === 'reports'
                    ? 'border-violet-600 text-violet-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className="fas fa-file-alt mr-2"></i>
                Test Reports
              </button>
              <button
                onClick={() => setActiveTab('submit')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition ${
                  activeTab === 'submit'
                    ? 'border-violet-600 text-violet-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className="fas fa-plus-circle mr-2"></i>
                Submit Test
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Versions Tab */}
            {activeTab === 'versions' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Version History</h2>
                </div>

                {versions.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="fas fa-code-branch text-6xl text-gray-300 mb-4"></i>
                    <p className="text-gray-600">No versions yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {versions.map((version) => (
                      <div
                        key={version.id}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-900">
                                v{version.version_number}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(version.status)}`}>
                                {version.status}
                              </span>
                            </div>
                            <p className="text-lg text-gray-700 mb-2">{version.title}</p>
                            <p className="text-sm text-gray-500">
                              Released: {new Date(version.release_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {version.description && (
                          <p className="text-gray-600 mb-4">{version.description}</p>
                        )}

                        {version.changelog && version.changelog.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-semibold text-gray-900 mb-2">Changelog:</h4>
                            <ul className="space-y-2">
                              {version.changelog.map((change, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-violet-600 mt-1">
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

                        {version.known_issues && version.known_issues.length > 0 && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                              <i className="fas fa-exclamation-triangle"></i>
                              Known Issues:
                            </h4>
                            <ul className="space-y-1">
                              {version.known_issues.map((issue, idx) => (
                                <li key={idx} className="text-sm text-yellow-800">
                                  • {issue}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Test Cases Tab */}
            {activeTab === 'test-cases' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Test Scenarios</h2>
                </div>

                {testCases.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="fas fa-tasks text-6xl text-gray-300 mb-4"></i>
                    <p className="text-gray-600">No test cases yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {testCases.map((testCase) => (
                      <div
                        key={testCase.id}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-bold text-gray-900">{testCase.title}</h3>
                              <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityBadge(testCase.priority)}`}>
                                {testCase.priority}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>
                                <i className="fas fa-code-branch mr-1"></i>
                                {testCase.version?.version_number || 'N/A'}
                              </span>
                              {testCase.category && (
                                <span>
                                  <i className="fas fa-tag mr-1"></i>
                                  {testCase.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {testCase.description && (
                          <p className="text-gray-600 mb-4">{testCase.description}</p>
                        )}

                        {testCase.steps && testCase.steps.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Test Steps:</h4>
                            <ol className="space-y-3">
                              {testCase.steps.map((step, idx) => (
                                <li key={idx} className="flex gap-3">
                                  <span className="flex-shrink-0 w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                                    {step.step}
                                  </span>
                                  <div className="flex-1">
                                    <p className="text-gray-900 font-medium">{step.action}</p>
                                    <p className="text-sm text-gray-600 mt-1">
                                      <span className="font-medium">Expected:</span> {step.expected}
                                    </p>
                                  </div>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Test Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Test Results</h2>
                </div>

                {testReports.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="fas fa-file-alt text-6xl text-gray-300 mb-4"></i>
                    <p className="text-gray-600">No test reports yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Test Case
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Version
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tester
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {testReports.map((report) => (
                          <tr key={report.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {report.test_case?.title || 'N/A'}
                              </div>
                              {report.notes && (
                                <div className="text-sm text-gray-500 mt-1">{report.notes}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {report.version?.version_number || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {report.tester_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(report.status)}`}>
                                {report.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(report.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Submit Test Tab */}
            {activeTab === 'submit' && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Submit Test Report</h2>
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <i className="fas fa-clipboard-check text-6xl text-gray-300 mb-4"></i>
                  <p className="text-gray-600 mb-4">Test report submission form coming soon</p>
                  <p className="text-sm text-gray-500">
                    This will allow testers to submit their test results directly
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
