import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, MapPin, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';

const API_URL = 'http://localhost:5001/api/reports';
const COLORS = ['#1a237e', '#c62828', '#2e7d32', '#f9a825', '#6a1b9a', '#0277bd', '#4e342e', '#37474f'];

function Dashboard() {
  const [typeData, setTypeData] = useState([]);
  const [locationData, setLocationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalysisData();
  }, []);

  const fetchAnalysisData = async () => {
    try {
      const [typeRes, locationRes] = await Promise.all([
        axios.get(`${API_URL}/analysis/by-type`),
        axios.get(`${API_URL}/analysis/by-location`)
      ]);
      setTypeData(typeRes.data);
      setLocationData(locationRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch analysis data. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-slate-500">Loading analysis dashboard...</div>;
  if (error) return <div className="text-center py-12 text-red-500">{error}</div>;

  const totalCrimes = typeData.reduce((acc, curr) => acc + curr.count, 0);

  if (totalCrimes === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <TrendingUp size={48} className="mx-auto mb-4 opacity-20" />
        <p className="text-xl font-medium">No crime data available for analysis.</p>
        <p className="mt-2">Reports must be submitted before analysis charts appear.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <BarChart3 className="text-primary" />
            Crime Analysis Dashboard
          </h2>
          <p className="text-slate-500 mt-2">Visualizing crime trends from user-submitted reports.</p>
        </div>
        <div className="bg-slate-100 px-6 py-4 rounded-xl border border-slate-200 text-center">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Reported Incidents</p>
          <p className="text-4xl font-black text-primary">{totalCrimes}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Crime by Type - Pie Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <PieChartIcon size={20} className="text-secondary" />
            <h3 className="font-bold text-slate-900">Distribution by Crime Type</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Crime by Location - Bar Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <MapPin size={20} className="text-primary" />
            <h3 className="font-bold text-slate-900">Crime by Location</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={locationData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#1a237e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
