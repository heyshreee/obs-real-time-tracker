import { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import {
    Search, Download, Filter, ChevronLeft, ChevronRight,
    Key, Shield, AlertTriangle, Settings, Lock, Activity,
    CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/Spinner';

export default function ActivityLog() {
    const { idOrName } = useParams();
    const { project } = useOutletContext();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [eventType, setEventType] = useState('all');
    const [timeRange, setTimeRange] = useState('24h');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);
    const { showToast } = useToast();

    useEffect(() => {
        if (project?.id) {
            loadLogs();
        }
    }, [project?.id, page, search, eventType, timeRange]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page,
                limit: 10,
                search,
                type: eventType,
                days: timeRange
            });

            const data = await apiRequest(`/activity/${project.id}?${query.toString()}`);
            setLogs(data.logs);
            setTotalPages(data.totalPages);
            setTotalLogs(data.total);
        } catch (err) {
            showToast('Failed to load activity logs', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (action) => {
        if (action.includes('API Key')) return <Key className="h-4 w-4 text-blue-400" />;
        if (action.includes('Project Disabled')) return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
        if (action.includes('Origin')) return <Shield className="h-4 w-4 text-green-400" />;
        if (action.includes('Login')) return <Lock className="h-4 w-4 text-red-400" />;
        if (action.includes('Settings')) return <Settings className="h-4 w-4 text-purple-400" />;
        return <Activity className="h-4 w-4 text-slate-400" />;
    };

    const getStatusBadge = (status) => {
        const styles = {
            success: 'bg-green-500/10 text-green-400 border-green-500/20',
            warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
            failure: 'bg-red-500/10 text-red-400 border-red-500/20',
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.success}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const handleExport = () => {
        const headers = ['Timestamp', 'Event Type', 'User', 'Details', 'Status', 'IP Address'];
        const csvContent = [
            headers.join(','),
            ...logs.map(log => [
                new Date(log.created_at).toISOString(),
                log.action,
                log.user?.email || 'System',
                `"${log.details}"`,
                log.status,
                log.ip_address || 'N/A'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-log-${project.name}-${new Date().toISOString()}.csv`;
        a.click();
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">Activity Log</h1>
                <p className="text-slate-400">Monitor all events and security changes across your project.</p>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="relative flex-1 w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <select
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Events</option>
                        <option value="success">Success</option>
                        <option value="warning">Warning</option>
                        <option value="failure">Failure</option>
                    </select>

                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="24h">Last 24h</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="all">All Time</option>
                    </select>

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
                    >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Export CSV</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-950/50 text-xs font-medium text-slate-400 uppercase tracking-wider">
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4">Event Type</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Details</th>
                                <th className="px-6 py-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="flex justify-center">
                                            <Spinner />
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        No activity logs found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-white font-medium">
                                                {new Date(log.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {new Date(log.created_at).toLocaleTimeString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                                                    {getIcon(log.action)}
                                                </div>
                                                <span className="text-sm text-white font-medium">{log.action}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                                                    {(log.user?.email || 'S').charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-sm text-slate-300">{log.user?.email || 'System'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-400 max-w-xs truncate" title={log.details}>
                                                {log.details}
                                            </div>
                                            {log.ip_address && (
                                                <div className="text-xs text-slate-600 mt-0.5">IP: {log.ip_address}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {getStatusBadge(log.status)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/30 flex items-center justify-between">
                    <p className="text-sm text-slate-400">
                        Showing <span className="text-white font-medium">{logs.length > 0 ? (page - 1) * 10 + 1 : 0}</span> to <span className="text-white font-medium">{Math.min(page * 10, totalLogs)}</span> of <span className="text-white font-medium">{totalLogs}</span> entries
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                // Simple logic to show first 5 pages or sliding window could be better but this is MVP
                                const p = i + 1;
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === p
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                            {totalPages > 5 && <span className="text-slate-500 px-2">...</span>}
                        </div>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
