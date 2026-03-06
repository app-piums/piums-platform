'use client';

import React, { useEffect, useState } from 'react';
import { sdk } from '@piums/sdk';
import { AlertTriangle, CheckCircle, XCircle, Trash2 } from 'lucide-react';

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  useEffect(() => {
    loadReports();
  }, [page, status]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await sdk.getAdminReports({ page, limit: 20, status });
      setReports(data.reports);
      setTotal(data.total);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (reportId: string, action: 'approve' | 'reject' | 'delete_content') => {
    try {
      await sdk.resolveReport(reportId, action);
      setSelectedReport(null);
      loadReports();
      alert('Report resolved successfully');
    } catch (error) {
      console.error('Error resolving report:', error);
      alert('Error resolving report');
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reports Management</h1>
        <p className="text-gray-600 mt-2">Handle user reports and moderation</p>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex gap-4 items-center">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
              No reports found
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`
                  bg-white rounded-lg shadow-sm border p-6 cursor-pointer transition-colors
                  ${selectedReport?.id === report.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}
                `}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="text-red-500" size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {report.type.toUpperCase()} Report
                      </h3>
                      <span className="text-xs text-gray-500">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Reason:</span> {report.reason}
                    </p>
                    <p className="text-sm text-gray-500 mb-2">
                      Reported by: {report.reporterName}
                    </p>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {report.description}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Pagination */}
          {!loading && reports.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 20 >= total}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Report Detail */}
        <div className="lg:sticky lg:top-8 lg:h-fit">
          {selectedReport ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Detail</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <p className="text-gray-900">{selectedReport.type}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Reported By</label>
                  <p className="text-gray-900">{selectedReport.reporterName}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Target</label>
                  <p className="text-gray-900">{selectedReport.targetType} (ID: {selectedReport.targetId.slice(0, 8)})</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Reason</label>
                  <p className="text-gray-900">{selectedReport.reason}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-700">{selectedReport.description}</p>
                </div>

                {selectedReport.content && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Reported Content</label>
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-700 text-sm">{selectedReport.content}</p>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Reported At</label>
                  <p className="text-gray-900">{new Date(selectedReport.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => handleResolve(selectedReport.id, 'approve')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <CheckCircle size={16} />
                  Approve Report
                </button>
                
                <button
                  onClick={() => handleResolve(selectedReport.id, 'delete_content')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={16} />
                  Delete Content
                </button>
                
                <button
                  onClick={() => handleResolve(selectedReport.id, 'reject')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XCircle size={16} />
                  Reject Report
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
              Select a report to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
