import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom';
import {
  ArrowLeft, Eye, Calendar, ExternalLink, Code, Loader2,
  Settings, Save, X, Share2, Activity, Smartphone, Monitor, Tablet,
  Users, Clock, TrendingUp, Globe, Bell, Trash2, Hash, Database, RefreshCw,
  Shield, AlertTriangle, CheckCircle, Lock, Plus
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
import Spinner from '../components/Spinner';
import { io } from 'socket.io-client';

const API_URL = getApiUrl();
const SOCKET_URL = API_URL.replace('/api/v1', '');

export default function ProjectDetail() {
  const { idOrName, tab } = useParams();
  const navigate = useNavigate();
  const { user, loadUser, usageStats } = useOutletContext();
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
  const [timeRange, setTimeRange] = useState('7d');

  // Settings State
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingSecurity, setEditingSecurity] = useState(false);
  const [allowedOrigins, setAllowedOrigins] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [shareToken, setShareToken] = useState('');
  const [timezone, setTimezone] = useState('(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi');
  const [notifications, setNotifications] = useState({
    trafficSpikes: true,
    weeklyDigest: false
  });

  // Delete Confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const [saving, setSaving] = useState(false);

  // Modal State
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showPagesModal, setShowPagesModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activityData, setActivityData] = useState([]);
  const [pagesData, setPagesData] = useState([]);
  const [loadingModalData, setLoadingModalData] = useState(false);
  const [snippetType, setSnippetType] = useState('vanilla'); // 'vanilla', 'react', 'vanilla-count'

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

    const interval = setInterval(() => loadStats(project.id, false), 5000);

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
      setAllowedOrigins(projectData.allowed_origins ? projectData.allowed_origins.split(',').map(o => o.trim()) : []);
      setTargetUrl(projectData.target_url || '');
      setIsActive(projectData.is_active !== false);
      setShareToken(projectData.share_token || '');
      if (projectData.timezone) setTimezone(projectData.timezone);
      if (projectData.notifications) setNotifications(projectData.notifications);

      setStats(statsData);
      if (detailedStats) {
        setOverviewStats({
          ...detailedStats,
          recentActivity: detailedStats.activityList || []
        });
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
      setOverviewStats({
        ...detailedStats,
        recentActivity: detailedStats.activityList || []
      });
    } catch (err) {
      // Silent fail
    }
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    navigate(`/dashboard/projects/${idOrName}/${newTab}`);
  };

  const handleDelete = async () => {
    if (deleteConfirmation !== project.name) {
      showToast('Project name mismatch', 'error');
      return;
    }

    setDeleting(true);
    try {
      await apiRequest(`/projects/${project.id}`, { method: 'DELETE' });
      showToast('Project deleted successfully', 'success');
      loadUser();
      navigate('/dashboard/projects');
    } catch (err) {
      showToast(err.message, 'error');
      setDeleting(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      if (!/^[a-zA-Z0-9_-]+$/.test(projectName)) {
        showToast('Project name can only contain letters, numbers, underscores, and hyphens', 'error');
        setSaving(false);
        return;
      }

      const body = {
        name: projectName,
        allowedOrigins: allowedOrigins.filter(o => o.trim()).join(','),
        targetUrl,
        isActive,
        timezone,
        notifications
      };

      const updatedProject = await apiRequest(`/projects/${project.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      setProject(updatedProject);
      setEditing(false);
      setEditingSecurity(false);
      showToast('Changes saved successfully', 'success');

      if (body.name && body.name !== idOrName) {
        navigate(`/dashboard/projects/${body.name}/${activeTab}`, { replace: true });
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (isActive && !showDisableModal) {
      setShowDisableModal(true);
      return;
    }

    const newStatus = !isActive;
    setIsActive(newStatus); // Optimistic update
    setShowDisableModal(false);

    try {
      await apiRequest(`/projects/${project.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: newStatus }),
      });
      showToast(`Project ${newStatus ? 'enabled' : 'disabled'} successfully`, 'success');

      // Update local project object as well
      setProject(prev => ({ ...prev, is_active: newStatus }));
    } catch (err) {
      setIsActive(!newStatus); // Revert on error
      showToast('Failed to update project status', 'error');
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

  if (loading) return <Spinner />;
  if (!project) return <div className="text-red-400">Project not found</div>;

  const trackingId = project.tracking_id;
  const trackingUrl = `${API_URL}/track/${trackingId}`;

  const vanillaSnippet = `<script>
(function() {
  const TRACKING_ID = "${trackingId}";
  const ENDPOINT = "${trackingUrl}";

  function track() {
    navigator.sendBeacon(
      ENDPOINT,
      JSON.stringify({
        pageUrl: location.href,
        referrer: document.referrer || null,
        screen: {
          width: screen.width,
          height: screen.height
        }
      })
    );
  }

  track();
})();
</script>`;

  const reactSnippet = `import React, { useEffect } from 'react';

export default function Tracker() {
  useEffect(() => {
    const trackingId = "${trackingId}";
    const apiUrl = "${trackingUrl}";

    fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageUrl: window.location.href,
        referrer: document.referrer,
        title: document.title
      }),
    }).catch(err => console.error("Tracking error:", err));
  }, []);

  return null;
}`;

  const vanillaCountSnippet = `<div id="visitor-count">Loading...</div>
<script>
(function() {
  const trackingId = "${trackingId}";
  const apiUrl = "${trackingUrl}";
  const display = document.getElementById('visitor-count');

  // 1. Get count
  fetch(apiUrl)
    .then(res => res.json())
    .then(data => {
      if (data.count !== undefined) display.innerText = data.count + " Visits";
    });

  // 2. Track visit
  fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pageUrl: window.location.href,
      referrer: document.referrer,
      title: document.title
    }),
  })
    .then(res => res.json())
    .then(data => {
      if (data.count !== undefined) display.innerText = data.count + " Visits";
    });
})();
</script>`;

  const getActiveSnippet = () => {
    switch (snippetType) {
      case 'react': return reactSnippet;
      case 'vanilla-count': return vanillaCountSnippet;
      default: return vanillaSnippet;
    }
  };

  const activeSnippet = getActiveSnippet();
  const snippetLanguage = snippetType === 'react' ? 'javascript' : 'html';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <Link to="/dashboard/projects" className="hover:text-white transition-colors">Projects</Link>
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
          {['Overview', 'Project Analytics', 'Integration', 'Settings'].map((tabName) => {
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
                  <Link to={`/dashboard/projects/${project?.id}/activity`} target="_blank" className="text-xs text-blue-400 hover:text-blue-300 font-medium">View All</Link>
                  <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded uppercase">LIVE FEED</span>
                </div>
              </div>
              <div className="space-y-0">
                {overviewStats.recentActivity?.map((activity, i) => {
                  const getDeviceIcon = (device) => {
                    const type = (device || 'desktop').toLowerCase();
                    if (type === 'mobile') return <Smartphone className="h-3 w-3" />;
                    if (type === 'tablet') return <Tablet className="h-3 w-3" />;
                    return <Monitor className="h-3 w-3" />;
                  };

                  return (
                    <div key={i} className="flex gap-4 relative pb-6 last:pb-0 group">
                      {/* Vertical line */}
                      {i !== overviewStats.recentActivity.length - 1 && (
                        <div className="absolute left-[11px] top-6 bottom-0 w-px bg-slate-800 group-hover:bg-slate-700 transition-colors"></div>
                      )}

                      <div className={`w-6 h-6 rounded-full z-10 flex-shrink-0 flex items-center justify-center border border-slate-800 ${i === 0 ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-slate-900 text-slate-500'
                        }`}>
                        {getDeviceIcon(activity.device)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-white truncate font-medium" title={activity.title || 'Unknown Page'}>
                            {activity.title || 'Unknown Page'}
                          </p>
                          <span className="text-[10px] text-slate-500 whitespace-nowrap flex-shrink-0">
                            {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1.5 truncate" title={activity.path}>
                            <Globe className="h-3 w-3 text-slate-500" />
                            {activity.path}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-700 flex-shrink-0"></span>
                          <span className="flex items-center gap-1.5 truncate">
                            {activity.location}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(!overviewStats.recentActivity || overviewStats.recentActivity.length === 0) && (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                    <Activity className="h-8 w-8 mb-3 opacity-20" />
                    <p className="text-sm">No recent activity</p>
                  </div>
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
                      <span className="text-white font-medium truncate pr-2" title={referrer.name}>{referrer.name}</span>
                      <span className="text-slate-400 whitespace-nowrap">{referrer.value.toLocaleString()} views ({Math.round((referrer.value / (overviewStats.total_views || 1)) * 100)}%)</span>
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

      {activeTab === 'integration' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Tracking Snippet */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Tracking Snippet</h2>
              </div>
              <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                <button
                  onClick={() => setSnippetType('vanilla')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${snippetType === 'vanilla' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Vanilla
                </button>
                <button
                  onClick={() => setSnippetType('react')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${snippetType === 'react' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  React
                </button>
                <button
                  onClick={() => setSnippetType('vanilla-count')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${snippetType === 'vanilla-count' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  With Counter
                </button>
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              {snippetType === 'vanilla' && "Include this script in your website's <head> or <body> tag."}
              {snippetType === 'react' && "Use this component in your React application."}
              {snippetType === 'vanilla-count' && "Display the visitor count and track visits in vanilla JS."}
            </p>
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden mb-4 relative group">
              <SyntaxHighlighter
                language={snippetLanguage}
                style={atomDark}
                customStyle={{
                  background: 'transparent',
                  padding: '1.5rem',
                  margin: 0,
                  fontSize: '0.875rem',
                  lineHeight: '1.6',
                }}
                wrapLongLines={true}
              >
                {activeSnippet}
              </SyntaxHighlighter>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <CopyButton text={activeSnippet} label="Copy Snippet" />
              </div>
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
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 font-mono text-sm focus:outline-none"
              />
              <CopyButton text={trackingUrl} label="Copy" />
            </div>
          </div>

          {/* Security & Access */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Security & Access</h2>
              </div>
              {!editingSecurity && (
                <button
                  onClick={() => setEditingSecurity(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-700"
                >
                  <Settings className="h-4 w-4" />
                  Edit
                </button>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">Allowed Origins</label>
              <div className="space-y-3">
                {allowedOrigins.map((origin, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={origin}
                      disabled={!editingSecurity}
                      onChange={(e) => {
                        const newOrigins = [...allowedOrigins];
                        newOrigins[index] = e.target.value;
                        setAllowedOrigins(newOrigins);
                      }}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="https://example.com"
                    />
                    {editingSecurity && (
                      <button
                        onClick={() => {
                          const newOrigins = allowedOrigins.filter((_, i) => i !== index);
                          setAllowedOrigins(newOrigins);
                        }}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
                {editingSecurity && (
                  <button
                    onClick={() => setAllowedOrigins([...allowedOrigins, ''])}
                    disabled={allowedOrigins.length >= (usageStats?.allowedOriginsLimit || 1)}
                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium px-2 py-1 rounded hover:bg-blue-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-blue-400"
                  >
                    <Plus className="h-4 w-4" />
                    Add Allowed Origin
                  </button>
                )}
                {allowedOrigins.length >= (usageStats?.allowedOriginsLimit || 1) && (
                  <p className="text-xs text-yellow-400 mt-2">
                    Your {usageStats?.plan || 'free'} plan allows {usageStats?.allowedOriginsLimit || 1} allowed origin(s). Upgrade to Pro for unlimited origins.
                  </p>
                )}
              </div>
              <div className="flex gap-2 mt-4 text-xs text-slate-500">
                <div className="mt-0.5"><AlertTriangle className="h-3 w-3" /></div>
                <p>Enter the domains that are authorized to send tracking data to this project. Only requests from these origins will be accepted.</p>
              </div>
            </div>

            {editingSecurity && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Security Settings
                </button>
                <button
                  onClick={() => {
                    setEditingSecurity(false);
                    setAllowedOrigins(project.allowed_origins ? project.allowed_origins.split(',').map(o => o.trim()) : []);
                  }}
                  disabled={saving}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors border border-slate-700 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Integration Status */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              {allowedOrigins.some(o => o.trim() !== '') ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              )}
              <h2 className="text-lg font-semibold text-white">Integration Status</h2>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              {allowedOrigins.some(o => o.trim() !== '')
                ? "Your security settings are properly configured. Data is being received from authorized origins only."
                : "No allowed origins configured. Your project is open to requests from any domain, which may lead to usage abuse."}
            </p>
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider">
              <span className="text-slate-500">STATUS:</span>
              {allowedOrigins.some(o => o.trim() !== '') ? (
                <span className="text-green-400 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  SECURE
                </span>
              ) : (
                <span className="text-yellow-400 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
                  NOT SECURE
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Project Information */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Project Information</h2>
                <p className="text-sm text-slate-400">Update your project basics.</p>
              </div>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-700"
                >
                  <Settings className="h-4 w-4" />
                  Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  disabled={!editing}
                  onChange={(e) => setProjectName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">Only letters, numbers, hyphens, and underscores allowed.</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">Time Zone</label>
              <select
                value={timezone}
                disabled={!editing}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="Asia/Kolkata">(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi</option>
                <option value="UTC">(GMT+00:00) UTC</option>
                <option value="America/New_York">(GMT-05:00) Eastern Time (US & Canada)</option>
                <option value="America/Los_Angeles">(GMT-08:00) Pacific Time (US & Canada)</option>
              </select>
            </div>

            {editing && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setProjectName(project.name);
                    setTargetUrl(project.target_url || '');
                    setTimezone(project.timezone || '(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi');
                  }}
                  disabled={saving}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors border border-slate-700 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            )}
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

          {/* Danger Zone */}
          <div className="border border-red-900/30 rounded-2xl overflow-hidden">
            <div className="bg-red-950/20 p-4 border-b border-red-900/30 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h3 className="font-bold text-red-500">Danger Zone</h3>
            </div>
            <div className="p-6 bg-red-950/10 space-y-6">
              {/* Disable Project */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium mb-1">Disable Project</h4>
                  <p className="text-sm text-slate-400">Stop tracking new events. Historical data will be preserved.</p>
                </div>
                <button
                  onClick={handleToggleActive}
                  className="px-4 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg text-sm font-medium transition-colors"
                >
                  {isActive ? 'Disable Project' : 'Enable Project'}
                </button>
              </div>

              <div className="h-px bg-red-900/20" />

              {/* Delete Project */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium mb-1">Delete Project</h4>
                  <p className="text-sm text-slate-400">Permanently delete this project and all its data. This cannot be undone.</p>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-500 transition-colors"
                >
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirmation('');
        }}
        title="Delete Project"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-200">
              This action is irreversible. All data associated with <strong>{project.name}</strong> will be permanently deleted.
            </p>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Type <strong>{project.name}</strong> to confirm
            </label>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder={project.name}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmation('');
              }}
              className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteConfirmation !== project.name || deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete Project
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDisableModal}
        onClose={() => setShowDisableModal(false)}
        title="Disable Project"
      >
        <div className="space-y-4">
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
            <p className="text-sm text-yellow-200">
              Disabling <strong>{project.name}</strong> will stop all new visitor tracking. Historical data will remain accessible.
            </p>
          </div>
          <p className="text-sm text-slate-400">
            Are you sure you want to disable this project? You can re-enable it at any time.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowDisableModal(false)}
              className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleToggleActive}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-500 transition-colors"
            >
              Disable Project
            </button>
          </div>
        </div>
      </Modal>

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
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm text-white font-medium">{activity.title || 'Unknown Page'}</p>
                    <p className="text-xs text-slate-400">{activity.site}{activity.path}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>{activity.location}</span>
                      <span>•</span>
                      <span>{new Date(activity.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showPagesModal}
        onClose={() => setShowPagesModal(false)}
        title="Top Pages"
      >
        <div className="max-h-[60vh] overflow-y-auto">
          {loadingModalData ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-slate-900">
                <tr className="border-b border-slate-800 text-xs font-medium text-slate-400 uppercase">
                  <th className="pb-3 pl-2">Page</th>
                  <th className="pb-3 text-right pr-2">Views</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {pagesData.map((page, i) => (
                  <tr key={i} className="border-b border-slate-800/50">
                    <td className="py-3 pl-2 text-white truncate max-w-[250px]" title={page.url}>
                      <div className="font-medium">{page.title || 'Unknown'}</div>
                      <div className="text-xs text-slate-500">{page.url}</div>
                    </td>
                    <td className="py-3 text-right pr-2 text-slate-300">{page.views.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share Report"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Share this public link with your team or clients to give them read-only access to this project's analytics.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/share/${shareToken}`}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 text-sm focus:outline-none"
            />
            <CopyButton text={`${window.location.origin}/share/${shareToken}`} />
          </div>
          <div className="flex justify-between">
            {shareToken && (
              <button
                onClick={async () => {
                  try {
                    await apiRequest(`/projects/${project.id}/share-token`, { method: 'DELETE' });
                    setShareToken(null);
                    showToast('Sharing disabled', 'success');
                  } catch (err) {
                    showToast('Failed to disable sharing', 'error');
                  }
                }}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Disable Sharing
              </button>
            )}
            <button
              onClick={async () => {
                try {
                  const data = await apiRequest(`/projects/${project.id}/share-token`, { method: 'POST' });
                  setShareToken(data.share_token);
                  showToast('New link generated', 'success');
                } catch (err) {
                  showToast('Failed to generate link', 'error');
                }
              }}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" /> {shareToken ? 'Regenerate Link' : 'Generate Link'}
            </button>
          </div>
        </div>
      </Modal>
    </div >
  );
}
