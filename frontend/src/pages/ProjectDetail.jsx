import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom';
import {
  ArrowLeft, Eye, Calendar, ExternalLink, Code, Loader2,
  Settings, Save, X, Share2, Activity, Smartphone, Monitor, Tablet
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { apiRequest } from '../utils/api';
import CopyButton from '../components/CopyButton';
import { useToast } from '../context/ToastContext';

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3000')).replace(/\/$/, '');

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loadUser } = useOutletContext();
  const [project, setProject] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analytics');
  const { showToast } = useToast();

  // Settings State
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [allowedOrigins, setAllowedOrigins] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const loadData = async () => {
    try {
      const [projectData, statsData] = await Promise.all([
        apiRequest(`/projects/${id}`),
        apiRequest(`/projects/${id}/stats`),
      ]);
      setProject(projectData);
      setAllowedOrigins(projectData.allowed_origins || '');
      setStats(statsData);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await apiRequest(`/projects/${id}/stats`);
      setStats(statsData);
    } catch (err) {
      // Silent fail
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This cannot be undone.')) return;

    setDeleting(true);
    try {
      await apiRequest(`/projects/${id}`, { method: 'DELETE' });
      showToast('Project deleted successfully', 'success');
      loadUser();
      navigate('/projects');
    } catch (err) {
      showToast(err.message, 'error');
      setDeleting(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const updatedProject = await apiRequest(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ allowedOrigins }),
      });
      setProject(updatedProject);
      setEditing(false);
      showToast('Settings saved successfully', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
    </div>
  );
  if (!project) return <div className="text-red-400">Project not found</div>;

  const trackingUrl = `${API_URL}/track/${project.tracking_id}`;
  const trackingSnippet = `<script>
(function() {
  const sessionId = localStorage.getItem('visitor_session_id') || 'anon_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('visitor_session_id', sessionId);

  fetch("${trackingUrl}", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: sessionId,
      pageUrl: window.location.href,
      referrer: document.referrer
    })
  }).catch(console.error);
})();
</script>`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <Link to="/projects" className="hover:text-white transition-colors">Projects</Link>
            <span>/</span>
            <span className="text-white">{project.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 text-green-400 text-xs font-medium rounded-full border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              LIVE
            </span>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
          <Share2 className="h-4 w-4" />
          Share Report
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800">
        <div className="flex gap-6">
          {['Overview', 'Project Analytics', 'Settings', 'Profile'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                if (tab === 'Project Analytics') setActiveTab('analytics');
                if (tab === 'Settings') setActiveTab('settings');
              }}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${(tab === 'Project Analytics' && activeTab === 'analytics') || (tab === 'Settings' && activeTab === 'settings')
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'analytics' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Traffic Flow Chart */}
            <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Traffic Flow</h3>
                  <p className="text-sm text-slate-400">Visitor activity over the last 30 days</p>
                </div>
                <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                  {['24H', '7D', '30D'].map((range) => (
                    <button
                      key={range}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${range === '30D' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.trafficData || []}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#64748b"
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={30}
                    />
                    <YAxis
                      stroke="#64748b"
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                      itemStyle={{ color: '#3B82F6' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorViews)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Active Visitors Card */}
            <div className="bg-gradient-to-br from-blue-900/50 to-slate-900/50 border border-blue-500/20 rounded-xl p-6 flex flex-col justify-center items-center relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-500/5" />
              <div className="relative z-10 text-center">
                <span className="text-blue-400 text-sm font-medium tracking-wider uppercase mb-2 block">Active Visitors Now</span>
                <div className="text-6xl font-bold text-white mb-4 tracking-tight">
                  {stats?.realTimeVisitors?.toLocaleString() || 0}
                </div>
                <div className="flex gap-1 justify-center">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-6 bg-blue-500 rounded-full animate-pulse"
                      style={{ animationDelay: `${i * 0.1}s`, opacity: 0.5 + (i * 0.1) }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Pages */}
            <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Top Pages</h3>
                <button className="text-sm text-blue-400 hover:text-blue-300">View All</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 pl-2">Page URL</th>
                      <th className="pb-3 text-right">Views</th>
                      <th className="pb-3 text-right">Avg. Time</th>
                      <th className="pb-3 text-right pr-2">Bounce Rate</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {stats?.topPages?.map((page, i) => (
                      <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 pl-2 text-white font-medium truncate max-w-[200px]">{page.url}</td>
                        <td className="py-3 text-right text-slate-300">{page.views.toLocaleString()}</td>
                        <td className="py-3 text-right text-slate-400">--</td>
                        <td className="py-3 text-right pr-2 text-green-400">--</td>
                      </tr>
                    ))}
                    {(!stats?.topPages || stats.topPages.length === 0) && (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-slate-500">No data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Device Breakdown */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Device Breakdown</h3>
              <div className="h-[200px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.deviceStats || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats?.deviceStats?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-white">100%</span>
                  <span className="text-xs text-slate-400">Total Visitors</span>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {stats?.deviceStats?.map((device, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: device.color }} />
                      <span className="text-slate-300">{device.name}</span>
                    </div>
                    <span className="text-white font-medium">
                      {Math.round((device.value / (stats.deviceStats.reduce((a, b) => a + b.value, 0) || 1)) * 100)}%
                    </span>
                  </div>
                ))}
                {(!stats?.deviceStats || stats.deviceStats.length === 0) && (
                  <p className="text-center text-slate-500 text-sm">No device data</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Settings Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <ExternalLink className="h-5 w-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Tracking URL</h2>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={trackingUrl}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 font-mono text-sm focus:outline-none"
                />
                <CopyButton text={trackingUrl} />
              </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Code className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-white">Tracking Snippet</h2>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl font-mono text-sm text-slate-300 overflow-x-auto mb-4">
                <pre>{trackingSnippet}</pre>
              </div>
              <CopyButton text={trackingSnippet} label="Copy Snippet" />
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-slate-400" />
                <h2 className="text-lg font-semibold text-white">Allowed Origins</h2>
              </div>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="text-sm text-blue-400 hover:text-blue-300 font-medium"
                >
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(false);
                      setAllowedOrigins(project.allowed_origins || '');
                    }}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Cancel"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="p-1 text-blue-400 hover:text-blue-300 disabled:opacity-50"
                    title="Save"
                  >
                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                {editing ? (
                  <div>
                    <input
                      type="text"
                      value={allowedOrigins}
                      onChange={(e) => setAllowedOrigins(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com, http://localhost:3000"
                    />
                    <p className="text-xs text-slate-500 mt-1">Comma separated list of domains allowed to track. Leave empty to allow all.</p>
                  </div>
                ) : (
                  <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 min-h-[42px] flex items-center">
                    {project.allowed_origins ? (
                      <code className="text-sm text-slate-300 font-mono">{project.allowed_origins}</code>
                    ) : (
                      <span className="text-sm text-slate-500 italic">All origins allowed</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-red-900/10 border border-red-900/20 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
            <p className="text-slate-400 text-sm mb-4">Deleting this project will permanently remove all associated data and analytics.</p>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete Project'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
