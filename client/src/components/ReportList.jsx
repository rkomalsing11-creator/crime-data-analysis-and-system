import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, MapPin, Tag, FileText, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';

const API_URL = 'http://localhost:5001/api/reports';

function ReportList() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('active'); // 'active' | 'deleted' | 'all'

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      // map filter to query param
      let query = '';
      if (filter === 'deleted') query = '?deleted=1';
      else if (filter === 'all') query = '?deleted=all';
      const response = await axios.get(`${API_URL}/list${query}`);
      setReports(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch reports. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setLoading(true);
    // fetch with new filter
    setTimeout(() => fetchReports(), 0);
  };

  const toggleDeletedState = async (id, toDeleted) => {
    try {
      await axios.put(`${API_URL}/${id}/deleted`, { deleted: toDeleted });
      // refresh list
      fetchReports();
    } catch (err) {
      console.error('Failed to update deleted state', err);
      setError('Failed to update report state.');
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) return <div className="text-center py-12 text-slate-500">Loading reports...</div>;
  if (error) return <div className="text-center py-12 text-red-500">{error}</div>;
  if (reports.length === 0) return (
    <div className="text-center py-12 text-slate-500">
      <ClipboardList size={48} className="mx-auto mb-4 opacity-20" />
      <p className="text-xl font-medium">No reports submitted yet.</p>
      <p className="mt-2">New reports will appear here as users submit them.</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <ClipboardList className="text-primary" />
          Submitted Reports
        </h2>
        <p className="text-slate-500 mt-2">Showing user-submitted crime reports.</p>
        <div className="mt-4">
          <label className="text-sm text-slate-500 mr-2">Filter:</label>
          <select value={filter} onChange={handleFilterChange} className="border rounded px-2 py-1">
            <option value="active">Active</option>
            <option value="deleted">Deleted</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {reports.map((report) => (
          <div 
            key={report.id} 
            className="border border-slate-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow"
          >
            <div 
              className="p-4 flex items-center justify-between cursor-pointer"
              onClick={() => toggleExpand(report.id)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                    {report.type}
                  </span>
                  <span className="text-slate-400 text-xs flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(report.date_time).toLocaleString()}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{report.title}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><MapPin size={14} /> {report.location}</span>
                </div>
              </div>
              <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                {expandedId === report.id ? <ChevronUp /> : <ChevronDown />}
              </button>
            </div>

            {expandedId === report.id && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Description</h4>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {report.description || 'No description provided.'}
                    </p>
                  </div>
                  {report.evidence_path && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Evidence</h4>
                      <div className="relative group rounded-lg overflow-hidden border border-slate-200 w-fit">
                        <img 
                          src={`http://localhost:5001/${report.evidence_path}`} 
                          alt="Evidence" 
                          className="max-h-64 object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <a 
                            href={`http://localhost:5001/${report.evidence_path}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="bg-white text-slate-900 px-4 py-2 rounded-lg font-bold text-sm"
                          >
                            View Full Size
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
                <div className="mt-4 flex items-center gap-2">
                  {report.deleted ? (
                    <button
                      onClick={() => toggleDeletedState(report.id, false)}
                      className="bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Restore
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleDeletedState(report.id, true)}
                      className="bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  )}
                </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { ClipboardList } from 'lucide-react';

export default ReportList;
