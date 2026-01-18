import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom';
import { ArrowLeft, Eye, Calendar, ExternalLink, Code, Loader2, Settings, Save, X } from 'lucide-react';
import { apiRequest } from '../utils/api';
import CopyButton from '../components/CopyButton';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3000');

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loadUser } = useOutletContext();
  const [project, setProject] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [allowedOrigins, setAllowedOrigins] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

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
    if (!window.confirm('Are you sure you want to delete this project? This cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await apiRequest(`/projects/${id}`, { method: 'DELETE' });
      showToast('Project deleted successfully', 'success');
      loadUser(); // Update global limits
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
fetch("${trackingUrl}", {
  method: "POST"
});
</script>`;

  const viewLimit = user?.limits?.monthlyLimit || 10000;
  // Note: This is global usage, not per project, but user asked for "Remaining views (based on plan)"
  // Ideally we show global remaining, or if we had per-project limits.
  // Assuming global limit for now.

  return (
    <div>
      <Link
        to="/projects"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Projects
      </Link>

      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Created {new Date(project.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
            {deleting ? 'Deleting...' : 'Delete Project'}
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Eye className="h-5 w-5 text-blue-400" />
                Total Views
              </div>
              <p className="text-2xl font-bold text-white">{stats.total_views.toLocaleString()}</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Eye className="h-5 w-5 text-purple-400" />
                This Month
              </div>
              <p className="text-2xl font-bold text-white">{stats.current_month_views.toLocaleString()}</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Eye className="h-5 w-5 text-green-400" />
                Plan Limit
              </div>
              <p className="text-2xl font-bold text-white">{viewLimit.toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>

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

      <div className="mt-6 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-white">Settings</h2>
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
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Allowed Origins
            </label>
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
    </div>
  );
}
