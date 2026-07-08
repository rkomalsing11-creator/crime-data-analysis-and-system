import React, { useState } from 'react';
import axios from 'axios';
import { Send, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

const API_URL = 'http://localhost:5001/api/reports';

function ReportForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    description: '',
    location: '',
    date_time: '',
  });
  const [evidence, setEvidence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setEvidence(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (evidence) data.append('evidence', evidence);

    try {
      await axios.post(`${API_URL}/submit`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage({ type: 'success', text: 'Crime report submitted successfully!' });
      setFormData({ title: '', type: '', description: '', location: '', date_time: '' });
      setEvidence(null);
      setTimeout(() => onSuccess && onSuccess(), 1500);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to submit the report. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Send className="text-primary" />
          Submit Crime Report
        </h2>
        <p className="text-slate-500 mt-2">Provide accurate details to help with analysis.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Crime Title</label>
            <input
              required
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Brief title (e.g., Shop Robbery)"
              className="w-full p-3 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Crime Type</label>
            <input
              required
              type="text"
              name="type"
              value={formData.type}
              onChange={handleChange}
              placeholder="Enter type manually (e.g., Theft, Fraud)"
              className="w-full p-3 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Description</label>
          <textarea
            rows="4"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Provide detailed information about the incident..."
            className="w-full p-3 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Location</label>
            <input
              required
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="City, Street, or Area"
              className="w-full p-3 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Date and Time</label>
            <input
              required
              type="datetime-local"
              name="date_time"
              value={formData.date_time}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Evidence Upload (Optional)</label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500">
                <Upload size={24} className="mb-2" />
                <p className="text-sm">{evidence ? evidence.name : 'Click to upload image or file'}</p>
              </div>
              <input type="file" className="hidden" onChange={handleFileChange} />
            </label>
          </div>
        </div>

        <button
          disabled={loading}
          type="submit"
          className={`w-full py-4 rounded-lg font-bold text-white transition-all shadow-md ${
            loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-indigo-900 active:scale-[0.98]'
          }`}
        >
          {loading ? 'Submitting...' : 'Submit Crime Report'}
        </button>
      </form>
    </div>
  );
}

export default ReportForm;
