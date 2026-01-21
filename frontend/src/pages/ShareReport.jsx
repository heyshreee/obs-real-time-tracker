import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Loader2, Eye, Users, Clock, Globe, Monitor, Activity,
    TrendingUp, Calendar, ArrowUpRight
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { apiRequest } from '../utils/api';
import TrafficTrendsChart from '../components/TrafficTrendsChart';
import Spinner from '../components/Spinner';

export default function ShareReport() {
    const { shareToken } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [timeRange, setTimeRange] = useState('7d');

    useEffect(() => {
        const loadReport = async () => {
            try {
                const reportData = await apiRequest(`/projects/share/${shareToken}`);
                setData(reportData);
            } catch (err) {
                setError(err.message || 'Failed to load report');
            } finally {
                setLoading(false);
            }
        };

        loadReport();
    }, [shareToken]);

    if (loading) {
        return <Spinner />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-2">Report Not Found</h1>
                    <p className="text-slate-400">{error}</p>
                </div>
            </div>
        );
    }

    const { project, stats } = data;

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                            <span>Public Report</span>
                            <span>/</span>
                            <span>{new Date(project.created_at).getFullYear()}</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white">{project.name}</h1>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-slate-400">Timezone</p>
                        <p className="font-medium text-white">{project.timezone}</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-slate-400">Total Views</h3>
                            <Eye className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-white">{stats.total_views.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-slate-400">Unique Visitors</h3>
                            <Users className="h-5 w-5 text-purple-500" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-white">{stats.uniqueVisitors.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-slate-400">Current Month</h3>
                            <Calendar className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-white">{stats.current_month_views.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Traffic Trends */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">Traffic Trends</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <AreaChart data={stats.trafficData}>
                                <defs>
                                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#64748b"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#64748b"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                                    itemStyle={{ color: '#f8fafc' }}
                                    cursor={{ stroke: '#334155' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="views"
                                    stroke="#3B82F6"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorViews)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Referrers */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-6">Top Referrers</h3>
                        <div className="space-y-4">
                            {stats.topReferrers?.map((referrer, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-white font-medium">{referrer.name}</span>
                                        <span className="text-slate-400">{referrer.value.toLocaleString()} views</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${Math.min((referrer.value / (stats.topReferrers[0]?.value || 1)) * 100, 100)}%`,
                                                backgroundColor: referrer.color || '#3B82F6'
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                            {(!stats.topReferrers || stats.topReferrers.length === 0) && (
                                <p className="text-center text-slate-500 text-sm">No referrer data</p>
                            )}
                        </div>
                    </div>

                    {/* Device Stats */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-6">Device Breakdown</h3>
                        <div className="space-y-4">
                            {stats.deviceStats?.map((device, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
                                    <div className="flex items-center gap-3">
                                        {device.name.toLowerCase() === 'desktop' ? <Monitor className="h-4 w-4 text-blue-400" /> :
                                            device.name.toLowerCase() === 'mobile' ? <Smartphone className="h-4 w-4 text-green-400" /> :
                                                <Tablet className="h-4 w-4 text-orange-400" />}
                                        <span className="text-sm font-medium text-white">{device.name}</span>
                                    </div>
                                    <span className="text-sm text-slate-400">{device.value.toLocaleString()}</span>
                                </div>
                            ))}
                            {(!stats.deviceStats || stats.deviceStats.length === 0) && (
                                <p className="text-center text-slate-500 text-sm">No device data</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
