import { useState, useEffect } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import { ArrowLeft, Download, FileJson, FileCode, FileText, Printer, Globe, Smartphone, Monitor, Tablet, Loader2, Code } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/Spinner';

export default function ProjectActivity() {
    const { idOrName } = useParams();
    // const { user } = useOutletContext(); // Removed as this page is not in Layout context anymore
    const [project, setProject] = useState(null);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        loadData();
        const interval = setInterval(() => loadData(false), 1000);
        return () => clearInterval(interval);
    }, [idOrName]);

    const loadData = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const projectData = await apiRequest(`/projects/${idOrName}`);
            setProject(projectData);

            // Fetch activity with higher limit
            // We use detailed-stats endpoint but we might need to adjust it to return just activity if we want efficiency,
            // but for now we use the existing one with a high limit.
            // Actually, the controller returns 'recentActivity' inside the stats object.
            // Let's assume we can pass a limit.
            const stats = await apiRequest(`/analytics/projects/${projectData.id}/traffic?limit=100`);
            if (stats && stats.recentActivity) {
                setActivity(stats.recentActivity);
            }
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const getDeviceIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'mobile': return <Smartphone className="h-4 w-4" />;
            case 'tablet': return <Tablet className="h-4 w-4" />;
            default: return <Monitor className="h-4 w-4" />;
        }
    };

    const downloadJSON = () => {
        const dataStr = JSON.stringify(activity, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-${project?.name}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const downloadCSV = () => {
        const headers = ['Timestamp', 'Page Title', 'URL', 'IP', 'Location', 'Device', 'Browser', 'OS'];
        const rows = activity.map(item => [
            new Date(item.timestamp).toLocaleString(),
            `"${(item.title || '').replace(/"/g, '""')}"`,
            item.path,
            item.ip,
            `"${(item.location || '').replace(/"/g, '""')}"`,
            item.device,
            // Note: The current API response might not have browser/os in the mapped 'recentActivity' list
            // unless we added it. The controller maps: id, type, location, ip, site, path, title, timestamp, device.
            // So we only have those.
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-${project?.name}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const downloadHTML = () => {
        const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Activity Log - ${project?.name}</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f4f4f4; }
          .meta { margin-bottom: 20px; color: #666; }
        </style>
      </head>
      <body>
        <h1>Activity Log: ${project?.name}</h1>
        <div class="meta">Generated on ${new Date().toLocaleString()}</div>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Page Title</th>
              <th>URL</th>
              <th>IP</th>
              <th>Location</th>
              <th>Device</th>
            </tr>
          </thead>
          <tbody>
            ${activity.map(item => `
              <tr>
                <td>${new Date(item.timestamp).toLocaleString()}</td>
                <td>${item.title || '-'}</td>
                <td>${item.path}</td>
                <td>${item.ip}</td>
                <td>${item.location}</td>
                <td>${item.device}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-${project?.name}-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return <Spinner />;
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 print:hidden">
                    <div className="flex items-center gap-4">
                        <Link
                            to={`/dashboard/projects/${idOrName}`}
                            className="p-2 hover:bg-slate-900 rounded-lg transition-colors text-slate-400 hover:text-white"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Activity Log</h1>
                            <p className="text-slate-400">{project?.name}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={downloadJSON}
                            className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm hover:bg-slate-800 transition-colors"
                        >
                            <FileCode className="h-4 w-4 text-yellow-500" />
                            JSON
                        </button>
                        <button
                            onClick={downloadCSV}
                            className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm hover:bg-slate-800 transition-colors"
                        >
                            <FileText className="h-4 w-4 text-green-500" />
                            CSV
                        </button>
                        <button
                            onClick={downloadHTML}
                            className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm hover:bg-slate-800 transition-colors"
                        >
                            <Code className="h-4 w-4 text-blue-500" />
                            HTML
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 transition-colors"
                        >
                            <Printer className="h-4 w-4" />
                            Print / PDF
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-800 text-xs font-medium text-slate-400 uppercase tracking-wider bg-slate-900/50">
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">Page</th>
                                    <th className="px-6 py-4">Visitor</th>
                                    <th className="px-6 py-4">Device</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {activity.map((item, i) => (
                                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-mono">
                                            {new Date(item.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-white font-medium text-sm">{item.title || 'Untitled Page'}</span>
                                                <span className="text-slate-500 text-xs font-mono mt-0.5">{item.path}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-slate-300 text-sm font-mono">{item.ip === '::1' ? 'Localhost' : item.ip}</span>
                                                <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                                                    <Globe className="h-3 w-3" />
                                                    {item.location}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-300 text-sm">
                                                {getDeviceIcon(item.device)}
                                                <span className="capitalize">{item.device || 'Desktop'}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {activity.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                                            No activity found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
