import { useState, useEffect } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import {
    Plus, ExternalLink, BarChart2, Trash2, Loader2, Pin,
    Search, Grid, List, MoreVertical, Folder, Zap, Database,
    Layout, ArrowRight, Eye, Users, Settings
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import { useToast } from '../context/ToastContext';

export default function Projects() {
    const { user, loadUser, loadSidebarData, usageStats } = useOutletContext();
    const [projects, setProjects] = useState([]);
    const [stats, setStats] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [allowedOrigins, setAllowedOrigins] = useState('');
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [creating, setCreating] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const { showToast } = useToast();

    useEffect(() => {
        loadProjects();
        const interval = setInterval(() => loadProjects(false), 1000);
        return () => clearInterval(interval);
    }, []);

    const loadProjects = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const projectsData = await apiRequest('/projects');
            setProjects(projectsData);

            if (projectsData.length > 0) {
                const statsPromises = projectsData.map(p =>
                    apiRequest(`/analytics/projects/${p.id}/overview`).catch(() => null)
                );
                const allStats = await Promise.all(statsPromises);

                const statsMap = {};
                projectsData.forEach((p, i) => {
                    statsMap[p.id] = allStats[i];
                });
                setStats(statsMap);
            }
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };


    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (creating) return;

        if (!/^[a-zA-Z0-9_-]+$/.test(projectName)) {
            showToast('Project name can only contain letters, numbers, underscores, and hyphens', 'error');
            return;
        }

        setCreating(true);
        try {
            await apiRequest('/projects', {
                method: 'POST',
                body: JSON.stringify({ name: projectName, allowedOrigins }),
            });
            setProjectName('');
            setAllowedOrigins('');
            setShowModal(false);
            showToast('Project created successfully!', 'success');
            loadProjects();
            loadUser();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setCreating(false);
        }
    };


    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this project?')) return;

        setDeletingId(id);
        try {
            await apiRequest(`/projects/${id}`, { method: 'DELETE' });
            showToast('Project deleted', 'success');
            loadProjects();
            loadUser();
            loadSidebarData();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setDeletingId(null);
        }
    };

    const handleTogglePin = async (project) => {
        try {
            const updatedProject = await apiRequest(`/projects/${project.id}/pin`, { method: 'PUT' });
            setProjects(projects.map(p => p.id === project.id ? { ...p, is_pinned: updatedProject.is_pinned } : p));
            loadSidebarData();
            showToast(updatedProject.is_pinned ? 'Project pinned' : 'Project unpinned', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    if (loading) return <Spinner />;

    const projectLimit = user?.limits?.projectLimit || 10;
    const projectsUsed = projects.length;

    // Calculate total monthly views across all projects
    const totalMonthlyViews = Object.values(stats).reduce((acc, curr) => acc + (curr?.current_month_views || 0), 0);
    const viewLimit = user?.limits?.monthlyLimit || 10000;


    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {(deletingId || creating) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
                    <Spinner fullScreen={false} />
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Projects</h1>
                    <p className="text-slate-400 text-sm">Manage and monitor your tracking projects</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-slate-800 text-slate-300 text-xs font-medium rounded-full border border-slate-700">
                        Free Plan
                    </span>
                    <div className="relative group/btn">
                        <button
                            onClick={() => setShowModal(true)}
                            disabled={projectsUsed >= projectLimit}
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                        >
                            <Plus className="h-4 w-4" />
                            Create New Project
                        </button>
                        {projectsUsed >= projectLimit && (
                            <div className="absolute top-full right-0 mt-2 w-48 p-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl text-xs text-slate-300 hidden group-hover/btn:block z-50">
                                Project limit reached. Please upgrade to Pro to create more projects.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Projects</span>
                        <Folder className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">{projectsUsed}</span>
                        <span className="text-sm text-slate-500">/ {projectLimit}</span>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800">
                        <div
                            className="h-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${(projectsUsed / projectLimit) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Monthly Views</span>
                        <Zap className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">{totalMonthlyViews.toLocaleString()}</span>
                        <span className="text-sm text-slate-500">/ {viewLimit.toLocaleString()}</span>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800">
                        <div
                            className="h-full bg-yellow-500 transition-all duration-500"
                            style={{ width: `${Math.min((totalMonthlyViews / viewLimit) * 100, 100)}%` }}
                        />
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Storage Used</span>
                        <Database className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">
                            {usageStats?.storageUsed < 1024 * 1024
                                ? `${(usageStats?.storageUsed / 1024).toFixed(2)} KB`
                                : usageStats?.storageUsed < 1024 * 1024 * 1024
                                    ? `${(usageStats?.storageUsed / (1024 * 1024)).toFixed(2)} MB`
                                    : `${(usageStats?.storageUsed / (1024 * 1024 * 1024)).toFixed(2)} GB`
                            }
                        </span>
                        <span className="text-sm text-slate-500">/ {usageStats?.storageLimit < 1024 * 1024 * 1024 ? `${(usageStats?.storageLimit / (1024 * 1024)).toFixed(0)} MB` : `${(usageStats?.storageLimit / (1024 * 1024 * 1024)).toFixed(0)} GB`}</span>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800">
                        <div
                            className="h-full bg-green-500 transition-all duration-500"
                            style={{ width: `${Math.min((usageStats?.storageUsed / usageStats?.storageLimit) * 100, 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/30 p-2 rounded-xl border border-slate-800/50">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'text-blue-400 bg-slate-800/50' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Grid className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'text-blue-400 bg-slate-800/50' : 'text-slate-400 hover:text-white'}`}
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Projects View */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <div
                            key={project.id}
                            onClick={() => navigate(`/dashboard/projects/${encodeURIComponent(project.name)}`)}
                            className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-blue-500/30 transition-all group relative flex flex-col cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-500/10 rounded-lg">
                                    <Layout className="h-6 w-6 text-blue-500" />
                                </div>
                            </div>

                            <div className="mb-6 flex-1">
                                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors truncate" title={project.name}>
                                    {project.name}
                                </h3>
                                <p className="text-slate-400 text-sm line-clamp-2">
                                    Real-time visitor tracking dashboard for {project.name}. Monitor traffic and analytics.
                                </p>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-sm text-slate-300">
                                        <Eye className="h-4 w-4 text-slate-500" />
                                        <span>{stats[project.id]?.total_views?.toLocaleString() || 0} views</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-300">
                                        <Users className="h-4 w-4 text-slate-500" />
                                        <span>{stats[project.id]?.sessionCount?.toLocaleString() || 0} sessions</span>
                                    </div>
                                </div>
                                <Link
                                    to={`/dashboard/projects/${encodeURIComponent(project.name)}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 font-medium group/link"
                                >
                                    View Analytics
                                    <ArrowRight className="h-4 w-4 group-hover/link:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    ))}

                    {/* New Project Card */}
                    <button
                        onClick={() => setShowModal(true)}
                        disabled={projectsUsed >= projectLimit}
                        className="border border-dashed border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center gap-4 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group min-h-[250px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-800 disabled:hover:bg-transparent"
                    >
                        <div className="p-4 bg-slate-900 rounded-full group-hover:scale-110 transition-transform">
                            <Plus className="h-6 w-6 text-slate-400 group-hover:text-blue-400" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-white font-medium mb-1">New Project</h3>
                            <p className="text-slate-500 text-sm">
                                {projectsUsed >= projectLimit ? 'Project limit reached' : 'Create a new tracking project'}
                            </p>
                        </div>
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-800 text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    <th className="px-6 py-4">Project Name</th>
                                    <th className="px-6 py-4">Total Views</th>
                                    <th className="px-6 py-4">Sessions</th>
                                    <th className="px-6 py-4">Storage</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {filteredProjects.map((project) => (
                                    <tr
                                        key={project.id}
                                        onClick={() => navigate(`/dashboard/projects/${encodeURIComponent(project.name)}`)}
                                        className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                                    <Layout className="h-4 w-4 text-blue-500" />
                                                </div>
                                                <span className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors truncate max-w-[200px]" title={project.name}>{project.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                            {stats[project.id]?.total_views?.toLocaleString() || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                            {stats[project.id]?.sessionCount?.toLocaleString() || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                            {stats[project.id]?.storageUsed < 1024 * 1024
                                                ? `${(stats[project.id]?.storageUsed / 1024).toFixed(1)} KB`
                                                : `${(stats[project.id]?.storageUsed / (1024 * 1024)).toFixed(1)} MB`
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 text-green-400 text-xs font-medium rounded-full border border-green-500/20">
                                                <div className="w-1 h-1 rounded-full bg-green-500" />
                                                Active
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/dashboard/projects/${encodeURIComponent(project.name)}/settings`);
                                                        }}
                                                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                                                    >
                                                        <Settings className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        disabled={projectsUsed >= projectLimit}
                        className="w-full py-4 border border-dashed border-slate-800 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-800 disabled:hover:bg-transparent"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="text-sm font-medium">
                            {projectsUsed >= projectLimit ? 'Project Limit Reached' : 'Create New Project'}
                        </span>
                    </button>
                </div>
            )}

            <Modal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setProjectName('');
                    setAllowedOrigins('');
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
                            placeholder="my-portfolio"
                        />
                        <p className="text-xs text-slate-500 mt-1">Only letters, numbers, hyphens, and underscores allowed.</p>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Allowed Origins (optional)
                        </label>
                        <input
                            type="text"
                            value={allowedOrigins}
                            onChange={(e) => setAllowedOrigins(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://example.com, http://localhost:3000"
                        />
                        <p className="text-xs text-slate-500 mt-1">Comma separated list of domains allowed to track.</p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setShowModal(false);
                                setProjectName('');
                                setAllowedOrigins('');
                            }}
                            className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={creating}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                            {creating ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
