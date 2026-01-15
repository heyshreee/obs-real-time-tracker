import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Plus, ExternalLink, Calendar, BarChart2, Trash2, Loader2 } from 'lucide-react';
import { apiRequest } from '../utils/api';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';

export default function Projects() {
    const { user, loadUser } = useOutletContext();
    const [projects, setProjects] = useState([]);
    const [stats, setStats] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const projectsData = await apiRequest('/projects');
            setProjects(projectsData);

            // Fetch stats for all projects
            if (projectsData.length > 0) {
                const statsPromises = projectsData.map(p =>
                    apiRequest(`/projects/${p.id}/stats`).catch(() => null)
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

    const [creating, setCreating] = useState(false);

    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (creating) return;

        setCreating(true);
        try {
            await apiRequest('/projects', {
                method: 'POST',
                body: JSON.stringify({ name: projectName }),
            });
            setProjectName('');
            setShowModal(false);
            showToast('Project created successfully!', 'success');
            loadProjects();
            loadUser(); // Update limits in layout
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setCreating(false);
        }
    };

    const [deletingId, setDeletingId] = useState(null);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this project?')) return;

        setDeletingId(id);
        try {
            await apiRequest(`/projects/${id}`, { method: 'DELETE' });
            showToast('Project deleted', 'success');
            loadProjects();
            loadUser();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
    );

    const projectLimit = user?.limits?.projectLimit || 10;
    const projectsUsed = projects.length;

    const isLimitReached = projectsUsed >= projectLimit;

    return (
        <div>
            {isLimitReached && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <BarChart2 className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-medium">Project Limit Reached</h3>
                            <p className="text-sm text-slate-400">You have used {projectsUsed} of {projectLimit} projects. Upgrade to Pro for more.</p>
                        </div>
                    </div>
                    <Link
                        to="/billing"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        Upgrade Plan
                    </Link>
                </div>
            )}

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Projects</h1>
                    <p className="text-slate-400">Manage your tracking projects</p>
                </div>
                {isLimitReached ? (
                    <Link
                        to="/billing"
                        className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition-colors border border-slate-700"
                    >
                        <BarChart2 className="h-5 w-5" />
                        Upgrade to Pro
                    </Link>
                ) : (
                    <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        New Project
                    </button>
                )}
            </div>

            {projects.length === 0 ? (
                <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
                    <p className="text-slate-500 mb-4">No projects yet</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="text-blue-400 hover:text-blue-300 font-medium"
                    >
                        Create your first project
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <div key={project.id} className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 hover:border-blue-500/50 transition-colors group">
                            <div className="flex justify-between items-start mb-4">
                                <Link to={`/projects/${project.id}`} className="text-lg font-semibold text-white hover:text-blue-400 transition-colors">
                                    {project.name}
                                </Link>
                                <div className="flex gap-2">
                                    <Link to={`/projects/${project.id}`} className="text-slate-500 hover:text-blue-400 transition-colors">
                                        <ExternalLink className="h-4 w-4" />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(project.id)}
                                        disabled={deletingId === project.id}
                                        className="text-slate-500 hover:text-red-400 transition-colors disabled:opacity-50"
                                    >
                                        {deletingId === project.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Total Views</span>
                                    <span className="text-white font-mono">{stats[project.id]?.total_views?.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Tracking ID</span>
                                    <code className="bg-slate-950 px-2 py-1 rounded text-slate-300 text-xs">{project.tracking_id}</code>
                                </div>

                                <Link
                                    to={`/projects/${project.id}`}
                                    className="block w-full text-center py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-sm transition-colors"
                                >
                                    View Details
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

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
