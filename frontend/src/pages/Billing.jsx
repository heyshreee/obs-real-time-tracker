import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Zap, Layers, X, ArrowUpRight, Download, CreditCard, Calendar, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { useToast } from '../context/ToastContext';

export default function Billing() {
    const { user, loadUser } = useOutletContext();
    const [stats, setStats] = useState(null);
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [usageStats, setUsageStats] = useState({
        totalViews: 0,
        monthlyLimit: 1000,
        storageUsed: 0,
        storageLimit: 1024 * 1024 * 1024,
        plan: 'free',
        projectLimit: 5
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

    const viewLimit = usageStats.monthlyLimit || 1000;
    const totalViewsUsed = usageStats.totalViews || 0;
    const viewPercentage = Math.min((totalViewsUsed / viewLimit) * 100, 100);
    const projectsCount = stats?.projectsCount || 0;
    const projectLimit = usageStats?.projectLimit || 5;
    const projectPercentage = Math.min((projectsCount / projectLimit) * 100, 100);

    const getNextResetDate = () => {
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return nextMonth.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    };

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleUpgrade = async (planId) => {
        setLoading(true);
        try {
            const res = await loadRazorpay();

            if (!res) {
                showToast('Razorpay SDK failed to load', 'error');
                return;
            }

            // 1. Create Order
            const { order } = await apiRequest('/payment/order', {
                method: 'POST',
                body: JSON.stringify({ planId })
            });

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Enter the Key ID generated from the Dashboard
                amount: order.amount,
                currency: order.currency,
                name: "OBS Tracker",
                description: `Upgrade to ${planId} Plan`,
                image: "https://example.com/your_logo", // You can add a logo here
                order_id: order.id,
                handler: async function (response) {
                    try {
                        // 2. Verify Payment
                        await apiRequest('/payment/verify', {
                            method: 'POST',
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                planId
                            })
                        });

                        showToast(`Successfully upgraded to ${planId} plan!`, 'success');
                        loadUsage(); // Reload usage to reflect new limits
                        if (loadUser) loadUser(); // Reload user to reflect new plan
                    } catch (error) {
                        showToast('Payment verification failed', 'error');
                        console.error(error);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                        console.log('Payment cancelled by user');
                    }
                },
                prefill: {
                    name: user?.name || '',
                    email: user?.email || '',
                    contact: ''
                },
                theme: {
                    color: "#2563EB"
                },

            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();

        } catch (error) {
            console.error('Payment error:', error);
            showToast('Failed to initiate payment', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-white">Billing & Subscription</h1>
                <div className="flex items-center gap-4">
                    <button className="p-2 text-slate-400 hover:text-white transition-colors">
                        <Clock className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Top Section: Current Plan & Usage */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                {/* Current Plan Card */}
                <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -mr-32 -mt-32 rounded-full"></div>

                    <div className="flex justify-between items-start mb-12 relative z-10">
                        <div>
                            <p className="text-sm font-medium text-slate-400 mb-1">Current Plan</p>
                            <div className="flex items-center gap-3">
                                <h2 className="text-4xl font-bold text-white capitalize">{usageStats.plan} Plan</h2>
                                <span className="px-2.5 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-bold rounded-full uppercase tracking-wider border border-slate-700">Current</span>
                            </div>
                        </div>
                        <button
                            onClick={() => handleUpgrade('pro')}
                            disabled={usageStats.plan === 'pro' || loading}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                            {usageStats.plan === 'pro' ? 'Current Plan' : 'Upgrade Now'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                        <div className="bg-slate-950/40 border border-slate-800/50 rounded-2xl p-5">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Monthly Limit</p>
                            <p className="text-xl font-bold text-white">{viewLimit.toLocaleString()} views</p>
                        </div>
                        <div className="bg-slate-950/40 border border-slate-800/50 rounded-2xl p-5">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Next Reset</p>
                            <p className="text-xl font-bold text-white">{getNextResetDate()}</p>
                        </div>
                    </div>
                </div>

                {/* Usage Card */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-8 flex flex-col">
                    <div className="flex items-center gap-2 mb-8">
                        <Zap className="h-5 w-5 text-blue-400 fill-blue-400/20" />
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Usage This Month</h3>
                    </div>

                    <div className="space-y-8 flex-1">
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <p className="text-sm font-medium text-slate-400">Project Views</p>
                                <p className="text-sm font-bold text-white">
                                    {totalViewsUsed.toLocaleString()} <span className="text-slate-500">/ {viewLimit.toLocaleString()}</span>
                                </p>
                            </div>
                            <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${viewPercentage}%` }}
                                    className="h-full bg-blue-500 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.5)]"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <p className="text-sm font-medium text-slate-400">Active Projects</p>
                                <p className="text-sm font-bold text-white">
                                    {projectsCount} <span className="text-slate-500">/ {projectLimit}</span>
                                </p>
                            </div>
                            <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${projectPercentage}%` }}
                                    className="h-full bg-blue-500 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.5)]"
                                />
                            </div>
                        </div>
                    </div>

                    <p className="text-[10px] text-slate-500 mt-8 italic leading-relaxed">
                        Resets automatically at the start of next billing cycle.
                    </p>
                </div>
            </div>

            {/* Plan Comparison Section */}
            <div className="mb-16">
                <h2 className="text-2xl font-bold text-white mb-2">Choose your plan</h2>
                <p className="text-slate-400 text-sm mb-10">Pick the best plan that fits your growth needs.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Free Plan */}
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-8 flex flex-col h-full hover:border-slate-700/50 transition-colors group">
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-white mb-2">Free</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">Perfect for side projects and small experiments.</p>
                        </div>

                        <div className="mb-10">
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-bold text-white">$0</span>
                                <span className="text-slate-500 font-medium">/month</span>
                            </div>
                        </div>

                        <div className="space-y-4 mb-10 flex-1">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                    <Check className="h-3 w-3 text-green-500" />
                                </div>
                                <span className="text-slate-300">{(usageStats?.monthlyViews || 1000).toLocaleString()} Views / mo</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                    <Check className="h-3 w-3 text-green-500" />
                                </div>
                                <span className="text-slate-300">{usageStats?.projectLimit || 5} Active Projects</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-500">
                                <div className="w-5 h-5 rounded-full bg-slate-800/50 flex items-center justify-center flex-shrink-0">
                                    <X className="h-3 w-3" />
                                </div>
                                <span>Priority Support</span>
                            </div>
                        </div>

                        <button
                            disabled={usageStats.plan === 'free'}
                            className="w-full py-4 rounded-2xl font-bold transition-all border border-slate-800 text-slate-400 hover:bg-slate-800/50 disabled:bg-slate-800/30 disabled:text-slate-500 disabled:cursor-default"
                        >
                            {usageStats.plan === 'free' ? 'Active Plan' : 'Downgrade'}
                        </button>
                    </div>

                    {/* Pro Plan */}
                    <div className="bg-slate-900/40 backdrop-blur-xl border-2 border-blue-600/50 rounded-3xl p-8 flex flex-col h-full relative shadow-[0_0_40px_rgba(37,99,235,0.1)] group">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                            <span className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-full uppercase tracking-widest shadow-lg shadow-blue-600/20">Recommended</span>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">Scale your monitoring with unlimited power.</p>
                        </div>

                        <div className="mb-10">
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-bold text-white">$29</span>
                                <span className="text-slate-500 font-medium">/month</span>
                            </div>
                        </div>

                        <div className="space-y-4 mb-10 flex-1">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                    <Check className="h-3 w-3 text-green-500" />
                                </div>
                                <span className="text-slate-300">Unlimited Views</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                    <Check className="h-3 w-3 text-green-500" />
                                </div>
                                <span className="text-slate-300">Unlimited Projects</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                    <Check className="h-3 w-3 text-green-500" />
                                </div>
                                <span className="text-slate-300">Priority Email Support</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                    <Check className="h-3 w-3 text-green-500" />
                                </div>
                                <span className="text-slate-300">Custom Domain Tracking</span>
                            </div>
                        </div>

                        <button
                            onClick={() => handleUpgrade('pro', 29)}
                            disabled={usageStats.plan === 'pro' || loading}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-default"
                        >
                            {usageStats.plan === 'pro' ? 'Active Plan' : 'Upgrade to Pro'}
                        </button>
                    </div>

                    {/* Enterprise Plan */}
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-8 flex flex-col h-full hover:border-slate-700/50 transition-colors group">
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">Custom features and dedicated infrastructure.</p>
                        </div>

                        <div className="mb-10">
                            <h3 className="text-4xl font-bold text-white">Custom</h3>
                        </div>

                        <div className="space-y-4 mb-10 flex-1">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                    <Check className="h-3 w-3 text-green-500" />
                                </div>
                                <span className="text-slate-300">White-label Reports</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                    <Check className="h-3 w-3 text-green-500" />
                                </div>
                                <span className="text-slate-300">API Access</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                    <Check className="h-3 w-3 text-green-500" />
                                </div>
                                <span className="text-slate-300">Dedicated Manager</span>
                            </div>
                        </div>

                        <button className="w-full py-4 rounded-2xl font-bold transition-all border border-slate-800 text-slate-400 hover:bg-slate-800/50 active:scale-[0.98]">
                            Contact Sales
                        </button>
                    </div>
                </div>
            </div>

            {/* Payment History Section */}
            <div className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-2">Payment History</h2>
                <p className="text-slate-400 text-sm mb-8">Download your previous invoices and receipts.</p>

                <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-3xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800/50 bg-slate-950/30">
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Invoice ID</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/30">
                                {/* Placeholder row if no history */}
                                <tr className="group hover:bg-slate-800/10 transition-colors">
                                    <td className="px-8 py-6 text-sm font-medium text-slate-300">INV-2024-001</td>
                                    <td className="px-8 py-6 text-sm text-slate-400">Jan 01, 2024</td>
                                    <td className="px-8 py-6 text-sm font-bold text-white">$0.00</td>
                                    <td className="px-8 py-6">
                                        <span className="px-2.5 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-bold rounded-full uppercase tracking-wider border border-green-500/20">Paid</span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all">
                                            <Download className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div >
    );
}
