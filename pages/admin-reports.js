import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Head from 'next/head';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterVersion, setFilterVersion] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [developerNotes, setDeveloperNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchVersions();
    fetchReports();
  }, []);

  const fetchVersions = async () => {
    try {
      const { data, error } = await supabase
        .from('versions')
        .select('id, version_number, title')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error('Error fetching versions:', error);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ad_hoc_reports')
        .select('*, versions(version_number, title)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    if (filterVersion !== 'all' && report.version_id !== filterVersion) return false;
    if (filterStatus !== 'all' && report.status !== filterStatus) return false;
    if (filterType !== 'all' && report.report_type !== filterType) return false;
    return true;
  });

  const openDetailModal = (report) => {
    setSelectedReport(report);
    setDeveloperNotes(report.developer_notes || '');
    setNewStatus(report.status);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedReport(null);
    setDeveloperNotes('');
    setNewStatus('');
  };

  const updateReport = async () => {
    if (!selectedReport) return;

    try {
      const { error } = await supabase
        .from('ad_hoc_reports')
        .update({
          status: newStatus,
          developer_notes: developerNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedReport.id);

      if (error) throw error;

      alert('Report updated successfully!');
      closeDetailModal();
      fetchReports(); // Refresh the list
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Failed to update report: ' + error.message);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'bug': return '🐛';
      case 'suggestion': return '💡';
      case 'improvement': return '⬆️';
      default: return '📝';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return '🔵';
      case 'in_progress': return '🟡';
      case 'resolved': return '✅';
      case 'wont_fix': return '⚠️';
      default: return '❓';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-300';
      case 'wont_fix': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const stats = {
    total: filteredReports.length,
    open: filteredReports.filter(r => r.status === 'open').length,
    inProgress: filteredReports.filter(r => r.status === 'in_progress').length,
    resolved: filteredReports.filter(r => r.status === 'resolved').length,
    bugs: filteredReports.filter(r => r.report_type === 'bug').length,
    suggestions: filteredReports.filter(r => r.report_type === 'suggestion').length,
  };

  return (
    <>
      <Head>
        <title>Admin Reports - Bug & Suggestion Management</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <i className="fas fa-shield-alt text-blue-600"></i>
                  Admin Reports Dashboard
                </h1>
                <p className="text-gray-600 mt-1">Manage bugs, suggestions, and improvements submitted by testers</p>
              </div>
              <button
                onClick={() => window.location.href = '/tester'}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
              >
                <i className="fas fa-arrow-left"></i>
                Back to Tester
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Reports</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200">
              <div className="text-2xl font-bold text-blue-900">{stats.open}</div>
              <div className="text-sm text-blue-700">Open</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-900">{stats.inProgress}</div>
              <div className="text-sm text-yellow-700">In Progress</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-200">
              <div className="text-2xl font-bold text-green-900">{stats.resolved}</div>
              <div className="text-sm text-green-700">Resolved</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg shadow-sm border border-red-200">
              <div className="text-2xl font-bold text-red-900">{stats.bugs}</div>
              <div className="text-sm text-red-700">Bugs</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg shadow-sm border border-purple-200">
              <div className="text-2xl font-bold text-purple-900">{stats.suggestions}</div>
              <div className="text-sm text-purple-700">Suggestions</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <i className="fas fa-filter text-gray-600"></i>
                <span className="font-medium text-gray-700">Filters:</span>
              </div>

              <select
                value={filterVersion}
                onChange={(e) => setFilterVersion(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Versions</option>
                {versions.map(v => (
                  <option key={v.id} value={v.id}>v{v.version_number} - {v.title}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="wont_fix">Won't Fix</option>
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="bug">Bugs</option>
                <option value="suggestion">Suggestions</option>
                <option value="improvement">Improvements</option>
              </select>

              <button
                onClick={() => {
                  setFilterVersion('all');
                  setFilterStatus('all');
                  setFilterType('all');
                }}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 transition"
              >
                <i className="fas fa-redo"></i> Reset
              </button>
            </div>
          </div>

          {/* Reports List */}
          {loading ? (
            <div className="text-center py-12">
              <i className="fas fa-spinner fa-spin text-4xl text-blue-600"></i>
              <p className="text-gray-600 mt-4">Loading reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
              <i className="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
              <p className="text-gray-600 text-lg">No reports found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer"
                  onClick={() => openDetailModal(report)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getTypeIcon(report.report_type)}</span>
                        <h3 className="text-xl font-bold text-gray-900">{report.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(report.status)}`}>
                          {getStatusIcon(report.status)} {report.status.replace('_', ' ').toUpperCase()}
                        </span>
                        {report.severity && (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(report.severity)}`}>
                            {report.severity.toUpperCase()}
                          </span>
                        )}
                      </div>

                      <p className="text-gray-700 mb-3">{report.description}</p>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span><i className="fas fa-tag"></i> v{report.versions.version_number}</span>
                        <span><i className="fas fa-user"></i> {report.tester_name}</span>
                        <span><i className="fas fa-globe"></i> {report.browser}</span>
                        <span><i className="fas fa-mobile-alt"></i> {report.device}</span>
                        <span><i className="fas fa-clock"></i> {new Date(report.created_at).toLocaleString('en-IN')}</span>
                        {report.screenshots && report.screenshots.length > 0 && (
                          <span><i className="fas fa-camera"></i> {report.screenshots.length} screenshot(s)</span>
                        )}
                      </div>

                      {report.developer_notes && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 text-sm font-semibold text-blue-900 mb-1">
                            <i className="fas fa-sticky-note"></i>
                            Developer Notes:
                          </div>
                          <p className="text-sm text-blue-800">{report.developer_notes}</p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetailModal(report);
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
                    >
                      <i className="fas fa-edit"></i>
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail & Edit Modal */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">{getTypeIcon(selectedReport.report_type)}</span>
                Report Details & Management
              </h3>
              <button
                onClick={closeDetailModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Report Info */}
              <div>
                <h4 className="font-bold text-gray-900 text-lg mb-2">{selectedReport.title}</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedReport.status)}`}>
                    {getStatusIcon(selectedReport.status)} {selectedReport.status.replace('_', ' ').toUpperCase()}
                  </span>
                  {selectedReport.severity && (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(selectedReport.severity)}`}>
                      {selectedReport.severity.toUpperCase()}
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-gray-100 text-gray-800 border-gray-300">
                    {selectedReport.report_type.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
                <div><strong>Version:</strong> v{selectedReport.versions.version_number} - {selectedReport.versions.title}</div>
                <div><strong>Reported by:</strong> {selectedReport.tester_name}</div>
                <div><strong>Browser:</strong> {selectedReport.browser}</div>
                <div><strong>Device:</strong> {selectedReport.device}</div>
                <div><strong>Submitted:</strong> {new Date(selectedReport.created_at).toLocaleString('en-IN')}</div>
              </div>

              <div>
                <h5 className="font-semibold text-gray-900 mb-2">Description:</h5>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">{selectedReport.description}</p>
              </div>

              {selectedReport.steps_to_reproduce && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Steps to Reproduce:</h5>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200 whitespace-pre-wrap">{selectedReport.steps_to_reproduce}</p>
                </div>
              )}

              {selectedReport.screenshots && selectedReport.screenshots.length > 0 && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Screenshots:</h5>
                  <div className="space-y-2">
                    {selectedReport.screenshots.map((url, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <i className="fas fa-image text-gray-600"></i>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Screenshot {idx + 1}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <hr className="border-gray-300" />

              {/* Management Section */}
              <div>
                <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <i className="fas fa-cog text-blue-600"></i>
                  Update Status & Notes
                </h5>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="wont_fix">Won't Fix</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Developer Notes</label>
                    <textarea
                      value={developerNotes}
                      onChange={(e) => setDeveloperNotes(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add notes about the fix, investigation, or decision..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closeDetailModal}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={updateReport}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
              >
                <i className="fas fa-save"></i>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
