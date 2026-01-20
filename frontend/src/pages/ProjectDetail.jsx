import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom';
import {
  ArrowLeft, Eye, Calendar, ExternalLink, Code, Loader2,
  Settings, Save, X, Share2, Activity, Smartphone, Monitor, Tablet,
  Users, Clock, TrendingUp, Globe, Bell, Trash2, Hash, Database, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { apiRequest, getApiUrl } from '../utils/api';
import CopyButton from '../components/CopyButton';
import Modal from '../components/Modal';
import TrafficTrendsChart from '../components/TrafficTrendsChart';
import { useToast } from '../context/ToastContext';
import { io } from 'socket.io-client';

const API_URL = getApiUrl();
const SOCKET_URL = API_URL.replace('/api/v1', '');

export default function ProjectDetail() {
  const { idOrName, tab } = useParams();
  const navigate = useNavigate();
  const { user, loadUser } = useOutletContext();
  const [project, setProject] = useState(null);
  const [stats, setStats] = useState(null);
  const [overviewStats, setOverviewStats] = useState({
    realTimeVisitors: 0,
    trafficData: [],
    recentActivity: [],
    topReferrers: [],
    uniqueVisitors: 0,
    avgSessionDuration: '0m 0s'
  });
  const [loading, setLoading] = useState(true);
  const [loadingChart, setLoadingChart] = useState(false);
  const [activeTab, setActiveTab] = useState(tab || 'overview');
  const { showToast } = useToast();
  const [timeRange, setTimeRange] = useState('7d'); // Default for project view

  // Settings/Profile State
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [allowedOrigins, setAllowedOrigins] = useState('');
  const [projectName, setProjectName] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [shareToken, setShareToken] = useState('');
  const [timezone, setTimezone] = useState('(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi');
  const [notifications, setNotifications] = useState({
    trafficSpikes: true,
    weeklyDigest: false
  });

  const [saving, setSaving] = useState(false);

  // Modal State
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showPagesModal, setShowPagesModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activityData, setActivityData] = useState([]);
  const [pagesData, setPagesData] = useState([]);
  const [loadingModalData, setLoadingModalData] = useState(false);

  useEffect(() => {
    if (tab) {
      setActiveTab(tab);
    } else {
      setActiveTab('overview');
    }
  }, [tab]);

  useEffect(() => {
    setLoadingChart(true);
    loadData().finally(() => setLoadingChart(false));
  }, [idOrName, timeRange]);

  useEffect(() => {
    if (!project?.id) return;

    // Socket connection (Skip on Vercel)
    let socket;
    if (!SOCKET_URL.includes('vercel.app')) {
      socket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      socket.on('visitor_update', (data) => {
        if (project && data.project_id && data.project_id !== project.id) return;
        loadStats(project.id, false);
      });
    }

    const interval = setInterval(() => loadStats(project.id, false), 5000); // Poll every 5s

    return () => {
      clearInterval(interval);
      if (socket) socket.disconnect();
    };
  }, [project?.id, timeRange, timezone]);

  const loadData = async () => {
    try {
      const [projectData, statsData, detailedStats] = await Promise.all([
        apiRequest(`/projects/${idOrName}`),
        apiRequest(`/analytics/projects/${idOrName}/overview`),
        apiRequest(`/analytics/projects/${idOrName}/traffic?range=${timeRange}&timezone=${encodeURIComponent(timezone)}`).catch(() => null)
      ]);
      setProject(projectData);
      setProjectName(projectData.name);
      setAllowedOrigins(projectData.allowed_origins || '');
      setTargetUrl(projectData.target_url || '');
      setIsActive(projectData.is_active !== false); // Default to true if undefined
      setShareToken(projectData.share_token || '');
      if (projectData.timezone) setTimezone(projectData.timezone);
      if (projectData.notifications) setNotifications(projectData.notifications);

      setStats(statsData);
      if (detailedStats) {
        setOverviewStats(detailedStats);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
      setLoadingChart(false);
    }
  };

  const loadStats = async (projectId, showLoading = false) => {
    if (!projectId) return;
    try {
      const [statsData, detailedStats] = await Promise.all([
        apiRequest(`/analytics/projects/${projectId}/overview`),
        apiRequest(`/analytics/projects/${projectId}/traffic?range=${timeRange}&timezone=${encodeURIComponent(timezone)}`)
      ]);
      setStats(statsData);
      setOverviewStats(detailedStats);
    } catch (err) {
      // Silent fail
    }
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    navigate(`/projects/${idOrName}/${newTab}`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This cannot be undone.')) return;

    setDeleting(true);
    try {
      await apiRequest(`/projects/${project.id}`, { method: 'DELETE' });
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
      // Update allowed origins if editing in Settings tab
      // Update name/targetUrl if editing in Profile tab
      const body = {};
      if (activeTab === 'settings') {
        // body.allowedOrigins = allowedOrigins; // Moved to profile
      } else if (activeTab === 'profile') {
        if (!/^[a-zA-Z0-9_-]+$/.test(projectName)) {
          showToast('Project name can only contain letters, numbers, underscores, and hyphens', 'error');
          setSaving(false);
          return;
        }
        body.name = projectName;
        body.allowedOrigins = allowedOrigins;
        body.targetUrl = targetUrl;
        body.isActive = isActive;
        body.timezone = timezone;
        body.notifications = notifications;
      }

      const updatedProject = await apiRequest(`/projects/${project.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      setProject(updatedProject);
      setEditing(false);
      showToast('Changes saved successfully', 'success');

      // If name changed, navigate to new URL
      if (body.name && body.name !== idOrName) {
        navigate(`/projects/${body.name}/${activeTab}`, { replace: true });
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }

  };

  const handleViewAllActivity = async () => {
    setShowActivityModal(true);
    setLoadingModalData(true);
    try {
      const data = await apiRequest(`/analytics/projects/${project.id}/activity?limit=100`);
      setActivityData(data);
    } catch (err) {
      showToast('Failed to load activity', 'error');
    } finally {
      setLoadingModalData(false);
    }
  };

  const handleViewAllPages = async () => {
    setShowPagesModal(true);
    setLoadingModalData(true);
    try {
      const data = await apiRequest(`/analytics/projects/${project.id}/pages?range=${timeRange}`);
      setPagesData(data);
    } catch (err) {
      showToast('Failed to load pages', 'error');
    } finally {
      setLoadingModalData(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
    </div>
  );
  if (!project) return <div className="text-red-400">Project not found</div>;

  const trackingId = project.tracking_id;
  const trackingUrl = `${API_URL}/track/${trackingId}`;
  const trackingSnippet = `<script>
(function() {
  const TRACKING_ID = "${trackingId}";
  const TRACKING_URL = "${trackingUrl}";
  const sessionId = localStorage.getItem('visitor_session_id') || 'anon_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('visitor_session_id', sessionId);

  fetch(TRACKING_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: sessionId,
      pageUrl: window.location.href,
      referrer: document.referrer,
      title: document.title
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
            <div className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${isActive
              ? 'bg-green-500/10 text-green-400 border-green-500/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
              {isActive ? 'LIVE' : 'DISABLED'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-700"
          >
            <Share2 className="h-4 w-4" />
            Share Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800">
        <div className="flex gap-6">
          {['Overview', 'Project Analytics', 'Settings', 'Profile'].map((tabName) => {
            const tabKey = tabName.toLowerCase().replace(' ', '-');
            const isActive = activeTab === (tabName === 'Project Analytics' ? 'analytics' : tabKey);
            return (
              <button
                key={tabName}
                onClick={() => handleTabChange(tabName === 'Project Analytics' ? 'analytics' : tabKey)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${isActive
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-white'
                  }`}
              >
                {tabName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-400">Total Views</h3>
                <Eye className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{stats?.total_views?.toLocaleString() || 0}</span>
                <span className="text-xs font-medium text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">+12%</span>
              </div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-400">Unique Visitors</h3>
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{overviewStats.uniqueVisitors?.toLocaleString() || 0}</span>
                <span className="text-xs font-medium text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">+8%</span>
              </div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-400">Storage Used</h3>
                <Database className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">
                  {stats?.storageUsed < 1024 * 1024
                    ? `${(stats?.storageUsed / 1024).toFixed(1)} KB`
                    : stats?.storageUsed < 1024 * 1024 * 1024
                      ? `${(stats?.storageUsed / (1024 * 1024)).toFixed(1)} MB`
                      : `${(stats?.storageUsed / (1024 * 1024 * 1024)).toFixed(2)} GB`
                  }
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {stats?.storageBreakdown?.visitors < 1024 * 1024 ? `${(stats?.storageBreakdown?.visitors / 1024).toFixed(0)}K` : `${(stats?.storageBreakdown?.visitors / (1024 * 1024)).toFixed(1)}M`} V / {stats?.storageBreakdown?.pageViews < 1024 * 1024 ? `${(stats?.storageBreakdown?.pageViews / 1024).toFixed(0)}K` : `${(stats?.storageBreakdown?.pageViews / (1024 * 1024)).toFixed(1)}M`} P
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Traffic Trends */}
            <div className="lg:col-span-2">
              <TrafficTrendsChart
                data={overviewStats.trafficData}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                loading={loadingChart}
                title="Traffic Trends"
                subtitle="Visitor activity over the last 7 days"
              />
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">

              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                <div className="flex items-center gap-3">
                  <Link to={`/projects/${encodeURIComponent(project?.name)}/activity`} target="_blank" className="text-xs text-blue-400 hover:text-blue-300 font-medium">View All</Link>
                  <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded uppercase">LIVE FEED</span>
                </div>
              </div>
              <div className="space-y-0">
                {overviewStats.recentActivity?.map((activity, i) => (
                  <div key={i} className="flex gap-4 relative pb-6 last:pb-0">
                    {/* Vertical line */}
                    {i !== overviewStats.recentActivity.length - 1 && (
                      <div className="absolute left-[5px] top-2 bottom-0 w-px bg-slate-800"></div>
                    )}
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 z-10 flex-shrink-0 ${i === 0 ? 'bg-blue-500 animate-pulse' : 'bg-slate-600'}`}></div>
                    <div>
                      <p className="text-sm text-white">
                        <span className="font-medium">{activity.title || 'Unknown Page'}</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">
                        {activity.device || 'Unknown'} - {activity.ip || 'Unknown IP'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Globe className="h-3 w-3" /> {activity.location}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {(!overviewStats.recentActivity || overviewStats.recentActivity.length === 0) && (
                  <p className="text-center text-slate-500 text-sm py-4">No recent activity</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Referrers */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Top Referrers</h3>
              <div className="space-y-4">
                {overviewStats.topReferrers?.map((referrer, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white font-medium">{referrer.name}</span>
                      <span className="text-slate-400">{referrer.value.toLocaleString()} views ({Math.round((referrer.value / (overviewStats.total_views || 1)) * 100)}%)</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.min((referrer.value / (overviewStats.topReferrers[0]?.value || 1)) * 100, 100)}%`, backgroundColor: referrer.color }}
                      ></div>
                    </div>
                  </div>
                ))}
                {(!overviewStats.topReferrers || overviewStats.topReferrers.length === 0) && (
                  <p className="text-center text-slate-500 text-sm">No referrer data</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Traffic Flow Chart (Analytics View) */}
            <div className="lg:col-span-2">
              <TrafficTrendsChart
                data={overviewStats.trafficData}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                loading={loadingChart}
                title="Traffic Flow"
                subtitle="Visitor activity over time"
              />
            </div>

            {/* Active Visitors Card */}
            <div className="bg-gradient-to-br from-blue-900/50 to-slate-900/50 border border-blue-500/20 rounded-xl p-6 flex flex-col justify-center items-center relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-500/5" />
              <div className="relative z-10 text-center">
                <span className="text-blue-400 text-sm font-medium tracking-wider uppercase mb-2 block">Active Visitors Now</span>
                <div className="text-6xl font-bold text-white mb-4 tracking-tight">
                  {overviewStats?.realTimeVisitors?.toLocaleString() || 0}
                </div>
                <div className="flex justify-center mt-2">
                  <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Pages */}
            <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Top Pages</h3>
                <button onClick={handleViewAllPages} className="text-sm text-blue-400 hover:text-blue-300">View All</button>
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
                    {overviewStats?.topPages?.map((page, i) => (
                      <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 pl-2 text-white font-medium truncate max-w-[200px]">{page.url}</td>
                        <td className="py-3 text-right text-slate-300">{page.views.toLocaleString()}</td>
                        <td className="py-3 text-right text-slate-400">--</td>
                        <td className="py-3 text-right pr-2 text-green-400">--</td>
                      </tr>
                    ))}
                    {(!overviewStats?.topPages || overviewStats.topPages.length === 0) && (
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
                      data={overviewStats?.deviceStats || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {overviewStats?.deviceStats?.map((entry, index) => (
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
                {overviewStats?.deviceStats?.map((device, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: device.color }} />
                      <span className="text-slate-300">{device.name}</span>
                    </div>
                    <span className="text-white font-medium">
                      {Math.round((device.value / (overviewStats.deviceStats.reduce((a, b) => a + b.value, 0) || 1)) * 100)}%
                    </span>
                  </div>
                ))}
                {(!overviewStats?.deviceStats || overviewStats.deviceStats.length === 0) && (
                  <p className="text-center text-slate-500 text-sm">No device data</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Settings Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tracking ID */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Hash className="h-5 w-5 text-green-400" />
                <h2 className="text-lg font-semibold text-white">Tracking ID</h2>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={trackingId}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 font-mono text-sm focus:outline-none"
                />
                <CopyButton text={trackingId} />
              </div>
            </div>

            {/* Tracking URL */}
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

            {/* Tracking Snippet */}
            <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Code className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-white">Tracking Snippet</h2>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden mb-4">
                <SyntaxHighlighter
                  language="html"
                  style={atomDark}
                  customStyle={{
                    background: 'transparent',
                    padding: '1rem',
                    margin: 0,
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                  }}
                  wrapLongLines={true}
                >
                  {trackingSnippet}
                </SyntaxHighlighter>
              </div>
              <CopyButton text={trackingSnippet} label="Copy Snippet" />
            </div>
          </div>

        </div>
      )}

      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Project Information */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-1">Project Information</h2>
            <p className="text-sm text-slate-400 mb-6">Update your project basics and tracking environment.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">Only letters, numbers, hyphens, and underscores allowed.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Allowed Origins</label>
                <div className="relative">
                  <input
                    type="text"
                    value={allowedOrigins}
                    onChange={(e) => setAllowedOrigins(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add domain..."
                  />
                  {allowedOrigins && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                      {allowedOrigins.split(',').map((origin, i) => (
                        <span key={i} className="text-xs bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                          {origin.trim()}
                          <button onClick={() => {
                            const newOrigins = allowedOrigins.split(',').filter((_, idx) => idx !== i).join(',');
                            setAllowedOrigins(newOrigins);
                          }} className="hover:text-white"><X className="h-3 w-3" /></button>
                        </span>
                      )).slice(0, 2)}
                      {allowedOrigins.split(',').length > 2 && (
                        <span className="text-xs bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">+{allowedOrigins.split(',').length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">Specify the domains allowed to send tracking data. CORS requests from other origins will be blocked.</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">Time Zone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="Asia/Kolkata">(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi</option>
                <option value="UTC">(GMT+00:00) UTC</option>
                <option value="America/New_York">(GMT-05:00) Eastern Time (US & Canada)</option>
                <option value="America/Los_Angeles">(GMT-08:00) Pacific Time (US & Canada)</option>
              </select>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </button>
          </div>

          {/* Notification Preferences */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-1">Notification Preferences</h2>
            <p className="text-sm text-slate-400 mb-6">Stay updated on your website's traffic performance.</p>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-white">Traffic Spikes</h3>
                  <p className="text-xs text-slate-400">Get an email notification when traffic increases by more than 50% in an hour.</p>
                </div>
                <button
                  onClick={() => setNotifications(prev => ({ ...prev, trafficSpikes: !prev.trafficSpikes }))}
                  className={`w-11 h-6 rounded-full transition-colors relative ${notifications.trafficSpikes ? 'bg-blue-600' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${notifications.trafficSpikes ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800 pt-6">
                <div>
                  <h3 className="text-sm font-medium text-white">Weekly Digest</h3>
                  <p className="text-xs text-slate-400">Receive a weekly summary of your top performing pages and visitor growth.</p>
                </div>
                <button
                  onClick={() => setNotifications(prev => ({ ...prev, weeklyDigest: !prev.weeklyDigest }))}
                  className={`w-11 h-6 rounded-full transition-colors relative ${notifications.weeklyDigest ? 'bg-blue-600' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${notifications.weeklyDigest ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Disable Project */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <Activity className="h-6 w-6 text-red-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-red-400">Disable Project</h2>
                  <button
                    onClick={() => setIsActive(!isActive)}
                    className="px-4 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg text-sm font-medium transition-colors"
                  >
                    {isActive ? 'Disable This Project' : 'Enable This Project'}
                  </button>
                </div>
                <p className="text-sm text-slate-400">Disabling a project will stop all tracking events immediately but will preserve your historical data.</p>
              </div>
            </div>
          </div>

          {/* Delete Project */}
          <div className="bg-red-900/10 border border-red-900/20 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-red-400 mb-1">Delete Project</h2>
                <p className="text-sm text-slate-400 mb-4">Once you delete a project, all historical tracking data will be permanently removed. This action cannot be undone. Please be certain.</p>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-500 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete This Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )
      }
      {/* Modals */}
      <Modal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        title="Recent Activity Log"
      >
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          {loadingModalData ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {activityData.map((activity, i) => (
                <div key={i} className="flex gap-4 pb-4 border-b border-slate-800/50 last:border-0">
                  <div className="w-2 h-2 rounded-full mt-2 bg-blue-500 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="text-sm text-white font-medium">{activity.path}</p>
                      <span className="text-xs text-slate-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{activity.site}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Globe className="h-3 w-3" /> {activity.location}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Monitor className="h-3 w-3" /> {activity.device || 'Desktop'}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Activity className="h-3 w-3" /> {activity.ip}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {activityData.length === 0 && (
                <p className="text-center text-slate-500 py-4">No activity found</p>
              )}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showPagesModal}
        onClose={() => setShowPagesModal(false)}
        title={`Top Pages (${timeRange.toUpperCase()})`}
      >
        <div className="max-h-[60vh] overflow-y-auto">
          {loadingModalData ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pl-2">Page Title / URL</th>
                  <th className="pb-3 text-right pr-2">Views</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {pagesData.map((page, i) => (
                  <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 pl-2 text-white font-medium truncate max-w-[300px]">
                      <div className="truncate">{page.title || 'Untitled'}</div>
                      <div className="text-xs text-slate-500 truncate">{page.url}</div>
                    </td>
                    <td className="py-3 text-right pr-2 text-slate-300">{page.views.toLocaleString()}</td>
                  </tr>
                ))}
                {pagesData.length === 0 && (
                  <tr>
                    <td colSpan="2" className="py-8 text-center text-slate-500">No pages found</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </Modal>

      {/* Share Report Modal */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share Public Report"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Anyone with this link can view the read-only stats for this project.
          </p>

          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-2">
            <code className="flex-1 text-sm text-blue-400 truncate">
              {`${window.location.origin}/share/${shareToken}`}
            </code>
            <CopyButton text={`${window.location.origin}/share/${shareToken}`} />
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={async () => {
                if (!window.confirm('This will invalidate the old link. Continue?')) return;
                try {
                  const data = await apiRequest(`/projects/${project.id}/regenerate-token`, { method: 'POST' });
                  setShareToken(data.share_token);
                  showToast('Link regenerated successfully', 'success');
                } catch (err) {
                  showToast('Failed to regenerate link', 'error');
                }
              }}
              className="text-sm text-red-400 hover:text-red-300 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Regenerate Link
            </button>
          </div>
        </div>
      </Modal>
    </div >
  );
}
