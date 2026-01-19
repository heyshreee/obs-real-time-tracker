import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Zap, Layers } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

export default function Billing() {
    const { user } = useOutletContext();
    const [stats, setStats] = useState(null);
    const [usageStats, setUsageStats] = useState({
        totalViews: 0,
        monthlyLimit: 10000,
        storageUsed: 0,
        storageLimit: 1024 * 1024 * 1024,
        plan: 'free'
    });

    useEffect(() => {
        loadStats();
        loadUsage();
    }, []);

    const loadStats = async () => {
        try {
            const projects = await apiRequest('/projects');
            if (projects.length > 0) {
                const statsPromises = projects.map(p =>
                    apiRequest(`/analytics/projects/${p.id}/overview`).catch(() => null)
                );
                const allStats = await Promise.all(statsPromises);
                const totalViews = allStats.reduce((acc, curr) => acc + (curr?.current_month_views || 0), 0);
                setStats({ totalViews, projectsCount: projects.length });
            } else {
                setStats({ totalViews: 0, projectsCount: 0 });
            }
        } catch (err) {
            // Silent fail
        }
    };

    const loadUsage = async () => {
        try {
            const usage = await apiRequest('/usage');
            setUsageStats(usage);
        } catch (err) {
            // Silent fail
        }
    };

    const viewLimit = usageStats.monthlyLimit || 10000;
    const totalViewsUsed = usageStats.totalViews || 0;
    const viewPercentage = Math.min((totalViewsUsed / viewLimit) * 100, 100);
    const storagePercentage = Math.min((usageStats.storageUsed / usageStats.storageLimit) * 100, 100);

    const formatSize = (bytes) => {
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-8">Billing & Plans</h1>

            {/* 1. Usage Summary */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 mb-8">
                <h2 className="text-lg font-semibold text-white mb-4">Current Usage</h2>

                {/* Monthly Views */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-slate-300">
                        <Zap className="h-5 w-5 text-yellow-400" />
                        <span>Monthly Views</span>
                    </div>
                    <span className="text-white font-medium">
                        {totalViewsUsed.toLocaleString()} <span className="text-slate-500">/ {viewLimit.toLocaleString()}</span>
                    </span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden mb-6">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${viewPercentage}%` }}
                        className={`h-full rounded-full ${viewPercentage >= 90 ? 'bg-red-500' : 'bg-yellow-500'}`}
                    />
                </div>

                {/* Storage Usage */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-slate-300">
                        <Layers className="h-5 w-5 text-green-400" />
                        <span>Storage Used</span>
                    </div>
                    <span className="text-white font-medium">
                        {formatSize(usageStats.storageUsed)} <span className="text-slate-500">/ {formatSize(usageStats.storageLimit)}</span>
                    </span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden mb-6">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${storagePercentage}%` }}
                        className={`h-full rounded-full ${storagePercentage >= 90 ? 'bg-red-500' : 'bg-green-500'}`}
                    />
                </div>

                {/* Projects */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-slate-300">
                        <Layers className="h-5 w-5 text-blue-400" />
                        <span>Projects</span>
                    </div>
                    <span className="text-white font-medium">
                        {stats?.projectsCount || 0} <span className="text-slate-500">/ {user?.limits?.projectLimit || 10}</span>
                    </span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden mb-2">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${((stats?.projectsCount || 0) / (user?.limits?.projectLimit || 10)) * 100}%` }}
                        className={`h-full rounded-full ${(stats?.projectsCount || 0) >= (user?.limits?.projectLimit || 10) ? 'bg-red-500' : 'bg-blue-500'}`}
                    />
                </div>
                <p className="text-xs text-slate-500 mt-4">Usage data updates in real-time</p>
            </div>

            {/* 2. Plan Comparison */}
            <h2 className="text-xl font-bold text-white mb-6">Plan Comparison</h2>
            <div className="overflow-hidden rounded-2xl border border-slate-800">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-900 text-slate-200 uppercase font-medium">
                        <tr>
                            <th className="px-6 py-4">Feature</th>
                            <th className="px-6 py-4">Free</th>
                            <th className="px-6 py-4">Pro</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                        <tr>
                            <td className="px-6 py-4 font-medium text-white">Monthly Views</td>
                            <td className="px-6 py-4">10,000</td>
                            <td className="px-6 py-4 text-blue-400 font-bold">500,000</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 font-medium text-white">Projects</td>
                            <td className="px-6 py-4">10</td>
                            <td className="px-6 py-4 text-blue-400 font-bold">50</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 font-medium text-white">Support</td>
                            <td className="px-6 py-4">Community</td>
                            <td className="px-6 py-4 text-blue-400 font-bold">Priority</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* 3. Upgrade Action */}
            <div className="mt-8 text-center">
                {user.plan === 'free' ? (
                    <button disabled className="px-6 py-3 bg-slate-800 text-slate-400 rounded-lg cursor-not-allowed">
                        Upgrade Coming Soon
                    </button>
                ) : (
                    <p className="text-green-400 font-medium">You are on the Pro Plan</p>
                )}
            </div>
        </div>
    );
}
