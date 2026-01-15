import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Layers, Zap, ArrowRight } from 'lucide-react';
import { apiRequest } from '../utils/api';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';

export default function Dashboard() {
  const { user, loadUser } = useOutletContext();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const projectsData = await apiRequest('/projects');
      setProjects(projectsData);

      if (projectsData.length > 0) {
        const statsPromises = projectsData.map(p =>
          apiRequest(`/projects/${p._id}/stats`).catch(() => null)
        );
        const allStats = await Promise.all(statsPromises);

        // Combine project info with stats
        const projectStats = projectsData.map((p, i) => ({
          ...p,
          views: allStats[i]?.current_month_views || 0,
        }));

        // Sort by views for Top 3
        projectStats.sort((a, b) => b.views - a.views);
        setStats(projectStats);
      } else {
        setStats([]);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/projects', {
        method: 'POST',
        body: JSON.stringify({ name: projectName }),
      });
      setProjectName('');
      setShowModal(false);
      showToast('Project created successfully!', 'success');
      loadData();
      loadUser();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) return <div className="text-slate-400">Loading dashboard...</div>;

  const projectLimit = user?.limits?.projectLimit || 10;
  const projectsUsed = projects.length;
  const projectPercentage = (projectsUsed / projectLimit) * 100;

  const totalViewsUsed = stats?.reduce((acc, curr) => acc + curr.views, 0) || 0;
  const viewLimit = user?.limits?.monthlyLimit || 10000;
  const viewPercentage = Math.min((totalViewsUsed / viewLimit) * 100, 100);

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>

      {/* 1. Plan Info & Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Current Plan</h2>
              <p className="text-slate-400 capitalize">{user.plan} Plan</p>
            </div>
            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.plan === 'pro' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
              }`}>
              {user.plan}
            </span>
          </div>
          <div className="text-sm text-slate-400">
            Monthly Limit: <span className="text-white font-medium">{viewLimit.toLocaleString()} views</span>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate-300">
              <Zap className="h-5 w-5 text-yellow-400" />
              <span className="font-medium">Usage This Month</span>
            </div>
            <span className="text-sm text-slate-400">
              {totalViewsUsed.toLocaleString()} / {viewLimit.toLocaleString()}
            </span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${viewPercentage}%` }}
              className={`h-full rounded-full ${viewPercentage >= 90 ? 'bg-red-500' : 'bg-yellow-500'}`}
            />
          </div>
          <p className="text-xs text-slate-500">
            Resets on the 1st of next month
          </p>
        </div>
      </div>

      {/* 2. Projects Summary */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Projects Overview</h2>
          <Link to="/projects" className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1">
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-slate-300">
              <Layers className="h-5 w-5 text-blue-400" />
              <span className="font-medium">Total Projects</span>
            </div>
            <span className="text-2xl font-bold text-white">{projectsUsed} <span className="text-sm text-slate-500 font-normal">/ {projectLimit}</span></span>
          </div>

          {stats && stats.length > 0 ? (
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Top Projects</h3>
              <div className="space-y-3">
                {stats.slice(0, 3).map((project) => (
                  <div key={project._id} className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                    <span className="text-white font-medium">{project.name}</span>
                    <span className="text-slate-400 text-sm">{project.views.toLocaleString()} views</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-slate-500">
              No projects yet.
            </div>
          )}
        </div>
      </div>

      {/* 3. Quick Actions */}
      <button
        onClick={() => setShowModal(true)}
        disabled={projectsUsed >= projectLimit}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
      >
        <Plus className="h-5 w-5" />
        Create New Project
      </button>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setProjectName('');
        }}
        title="Create New Project"
      >
        <form onSubmit={handleCreateProject}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Project Name
            </label>
            <input
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="My Portfolio"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setProjectName('');
              }}
              className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
