import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { Copy, Key, Shield, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function APIKeys() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const data = await apiRequest('/projects');
            setProjects(data);
        } catch (err) {
            showToast('Failed to load projects', 'error');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        showToast('Copied to clipboard', 'success');
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">API Keys & Tracking IDs</h1>
                <p className="text-slate-400">Manage your access keys and project tracking identifiers.</p>
            </div>

            {/* Personal Access Token Section (Placeholder) */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 mb-8">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-white mb-1">Personal Access Token</h2>
                        <p className="text-slate-400 text-sm">Use this key to authenticate with the API programmatically.</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-medium rounded-full border border-blue-500/20">
                        Coming Soon
                    </span>
                </div>

                <div className="relative">
                    <div className="flex items-center gap-2 p-4 bg-slate-950 border border-slate-800 rounded-lg text-slate-500 font-mono text-sm">
                        <Key className="h-4 w-4" />
                        <span>obs_sk_................................</span>
                    </div>
                    <button disabled className="mt-4 px-4 py-2 bg-slate-800 text-slate-400 rounded-lg text-sm font-medium cursor-not-allowed">
                        Generate New Token
                    </button>
                </div>
            </div>

            {/* Project Tracking IDs */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Project Tracking IDs</h2>

                <div className="space-y-4">
                    {projects.map(project => (
                        <div key={project.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-950 border border-slate-800 rounded-lg group hover:border-slate-700 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Shield className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                    <div className="font-medium text-white">{project.name}</div>
                                    <div className="text-xs text-slate-500">Created {new Date(project.created_at).toLocaleDateString()}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <code className="flex-1 sm:flex-none bg-slate-900 px-3 py-1.5 rounded border border-slate-800 text-slate-300 font-mono text-xs">
                                    {project.id}
                                </code>
                                <button
                                    onClick={() => copyToClipboard(project.id)}
                                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                                    title="Copy ID"
                                >
                                    <Copy className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {projects.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                            No projects found. Create a project to get a tracking ID.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
