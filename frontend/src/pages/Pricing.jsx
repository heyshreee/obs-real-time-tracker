import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, HelpCircle, ArrowLeft } from 'lucide-react';

export default function Pricing() {
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState([
        {
            id: 'free',
            name: 'Free',
            price_usd: 0,
            price_inr: 0,
            description: "For personal projects", color: "slate",
            features: ['1 Project', '1 Allowed Origin', '1,000 events/mo', '60 sec refresh'],
            max_projects: 1,
            allowed_origins: 1,
            monthly_events: 1000,
            live_logs: false
        },
        {
            id: 'basic',
            name: 'Basic',
            price_usd: 4,
            price_inr: 299,
            description: "For serious hobbyists", color: "blue",
            features: ['5 Projects', '3 Allowed Origins', 'Live Device Stats', '50,000 events/mo', '10 sec refresh'],
            max_projects: 5,
            allowed_origins: 3,
            monthly_events: 50000,
            live_logs: false
        },
        {
            id: 'pro',
            name: 'Pro',
            price_usd: 12,
            price_inr: 999,
            description: "For professional creators", color: "indigo",
            features: ['15 Projects', '10 Allowed Origins', 'Live Activity Logs', '500,000 events/mo', '1 sec refresh'],
            max_projects: 15,
            allowed_origins: 10,
            monthly_events: 500000,
            live_logs: true
        },
        {
            id: 'business',
            name: 'Business',
            price_usd: 39,
            price_inr: 2999,
            description: "For scaling teams", color: "purple",
            features: ['Unlimited Projects', '100 Allowed Origins', '5,000,000 events/mo', 'Real-time / SLA', 'Team access'],
            max_projects: 100,
            allowed_origins: 100,
            monthly_events: 5000000,
            live_logs: true
        }
    ]);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const res = await fetch(`${API_URL}/api/plans`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) {
                        setPlans(data);
                    }
                }
            } catch (error) {
                console.error('Error fetching plans:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    // Helper to get plan attribute safely
    const getPlanAttr = (id, attr, fallback) => {
        const plan = plans.find(p => p.id === id);
        if (!plan) return fallback;
        if (attr === 'price') return plan.price_usd > 0 ? `$${plan.price_usd}` : 'Free';
        if (attr === 'monthly_events') return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(plan.monthly_events);
        if (attr === 'max_projects') return plan.max_projects === 100 ? 'Unlimited*' : plan.max_projects;
        if (attr === 'allowed_origins') return plan.allowed_origins;
        if (attr === 'retention_days') return `${plan.retention_days || 30} days`;
        return plan[attr] || fallback;
    }

    const featureRows = [
        { feature: "Projects", free: getPlanAttr('free', 'max_projects', '1'), basic: getPlanAttr('basic', 'max_projects', '5'), pro: getPlanAttr('pro', 'max_projects', '15'), business: getPlanAttr('business', 'max_projects', 'Unlimited*') },
        { feature: "Allowed Origins", free: getPlanAttr('free', 'allowed_origins', '1'), basic: getPlanAttr('basic', 'allowed_origins', '3'), pro: getPlanAttr('pro', 'allowed_origins', '10'), business: getPlanAttr('business', 'allowed_origins', '100') },
        { feature: "Events / month", free: getPlanAttr('free', 'monthly_events', '1,000'), basic: getPlanAttr('basic', 'monthly_events', '50,000'), pro: getPlanAttr('pro', 'monthly_events', '500,000'), business: getPlanAttr('business', 'monthly_events', '5,000,000') },
        { feature: "Real-time analytics", free: "Basic", basic: "Yes", pro: "Advanced", business: "Advanced" },
        { feature: "Dashboard refresh rate", free: "60 sec", basic: "10 sec", pro: "1 sec", business: "Real-time (WebSocket)" },
        { feature: "OBS overlay", free: "Default only", basic: "Custom text & theme", pro: "Fully customizable", business: "Fully customizable" },
        { feature: "Visitor geolocation", free: "—", basic: "—", pro: "Country-level", business: "Country-level" },
        { feature: "Device & browser stats", free: "—", basic: "Live", pro: "Yes", business: "Yes" },
        { feature: "Live Activity Logs", free: "—", basic: "—", pro: "Yes", business: "Yes" },
        { feature: "Tracking URL + API key", free: "—", basic: "Yes", pro: "Yes", business: "Yes" },
        { feature: "Team access / roles", free: "—", basic: "—", pro: "—", business: "Yes" },
        { feature: "Private dashboards", free: "—", basic: "—", pro: "—", business: "Yes" },
        { feature: "Custom domain tracking", free: "—", basic: "—", pro: "—", business: "Yes" },
        { feature: "Data retention", free: getPlanAttr('free', 'retention_days', '1 day'), basic: getPlanAttr('basic', 'retention_days', '7 days'), pro: getPlanAttr('pro', 'retention_days', '30 days'), business: getPlanAttr('business', 'retention_days', '90 days') },
        { feature: "Email support", free: "Community", basic: "Standard", pro: "Priority", business: "Dedicated" },
    ];

    const displayPlans = [
        { id: 'free', name: "Free", price: getPlanAttr('free', 'price', 'Free'), color: "slate" },
        { id: 'basic', name: "Basic", price: getPlanAttr('basic', 'price', '$4'), color: "blue" },
        { id: 'pro', name: "Pro", price: getPlanAttr('pro', 'price', '$12'), color: "indigo" },
        { id: 'business', name: "Business", price: getPlanAttr('business', 'price', '$39'), color: "purple" }
    ];

    return (
        <div className="min-h-screen bg-[#0B0E14] text-white font-sans selection:bg-blue-500/30">
            {/* Header */}
            <header className="fixed top-0 w-full z-50 bg-[#0B0E14]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                        <span className="font-medium">Back to Home</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                            Log In
                        </Link>
                        <Link
                            to="/register"
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-full transition-all hover:shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)]"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </header>

            <main className="pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Simple, Transparent Pricing</h1>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            Choose the plan that fits your growth stage. No hidden fees, cancel anytime.
                        </p>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-32">
                        {/* Free */}
                        <div className="p-6 rounded-3xl bg-[#151921] border border-white/5 flex flex-col hover:border-white/10 transition-all">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Free</h3>
                            <div className="flex items-baseline gap-1 mb-1">
                                <span className="text-3xl font-bold text-white">₹0</span>
                                <span className="text-slate-500">/mo</span>
                            </div>
                            <div className="text-xs text-slate-500 mb-6">$0 / month</div>
                            <p className="text-sm text-slate-400 mb-6 min-h-[40px]">Trying WebPulse</p>

                            <Link to="/register" className="block w-full py-2.5 px-4 rounded-xl border border-white/10 text-white text-center text-sm font-medium hover:bg-white/5 transition-colors">
                                Get Started
                            </Link>
                        </div>

                        {/* Basic */}
                        <div className="p-6 rounded-3xl bg-[#151921] border border-white/5 flex flex-col hover:border-white/10 transition-all">
                            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-2">Basic</h3>
                            <div className="flex items-baseline gap-1 mb-1">
                                <span className="text-3xl font-bold text-white">₹299</span>
                                <span className="text-slate-500">/mo</span>
                            </div>
                            <div className="text-xs text-slate-500 mb-6">$4 / month</div>
                            <p className="text-sm text-slate-400 mb-6 min-h-[40px]">Students & solo devs</p>

                            <Link to="/register" className="block w-full py-2.5 px-4 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/50 text-center text-sm font-medium hover:bg-blue-600/20 transition-colors">
                                Choose Basic
                            </Link>
                        </div>

                        {/* Pro */}
                        <div className="p-6 rounded-3xl bg-blue-600 border border-blue-500 shadow-2xl shadow-blue-900/20 flex flex-col relative transform lg:-translate-y-4">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-blue-500 rounded-full text-[10px] font-bold text-white border border-blue-400 tracking-wide">MOST POPULAR</div>
                            <h3 className="text-sm font-bold text-blue-100 uppercase tracking-wider mb-2">Pro</h3>
                            <div className="flex items-baseline gap-1 mb-1">
                                <span className="text-3xl font-bold text-white">₹999</span>
                                <span className="text-blue-200">/mo</span>
                            </div>
                            <div className="text-xs text-blue-200 mb-6">$12 / month</div>
                            <p className="text-sm text-blue-100 mb-6 min-h-[40px]">Streamers & growing apps</p>

                            <Link to="/register" className="block w-full py-2.5 px-4 rounded-xl bg-white text-blue-600 text-center text-sm font-bold hover:bg-blue-50 transition-colors">
                                Start Free Trial
                            </Link>
                        </div>

                        {/* Business */}
                        <div className="p-6 rounded-3xl bg-[#151921] border border-white/5 flex flex-col hover:border-white/10 transition-all">
                            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-2">Business</h3>
                            <div className="flex items-baseline gap-1 mb-1">
                                <span className="text-3xl font-bold text-white">₹2,999</span>
                                <span className="text-slate-500">/mo</span>
                            </div>
                            <div className="text-xs text-slate-500 mb-6">$39 / month</div>
                            <p className="text-sm text-slate-400 mb-6 min-h-[40px]">Teams & high traffic</p>

                            <Link to="/register" className="block w-full py-2.5 px-4 rounded-xl border border-white/10 text-white text-center text-sm font-medium hover:bg-white/5 transition-colors">
                                Contact Sales
                            </Link>
                        </div>
                    </div>

                    {/* Feature Comparison Table */}
                    <div className="max-w-7xl mx-auto mb-32 overflow-x-auto">
                        <h2 className="text-3xl font-bold text-white mb-12 text-center">Compare Plans</h2>
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="py-6 px-4 text-sm font-semibold text-slate-400">Feature</th>
                                        {displayPlans.map((plan) => (
                                            <th key={plan.id} className={`py-6 px-4 text-left`}>
                                                <div className="text-xl font-bold text-white mb-1">{plan.name}</div>
                                                <div className={`text-sm text-${plan.color}-400`}>{plan.price}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {featureRows.map((row, index) => (
                                        <tr key={index} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="py-4 px-4 text-sm font-medium text-slate-300">{row.feature}</td>
                                            <td className="py-4 px-4 text-sm text-slate-400">{row.free}</td>
                                            <td className="py-4 px-4 text-sm text-slate-400">{row.basic}</td>
                                            <td className="py-4 px-4 text-sm text-white font-medium">{row.pro}</td>
                                            <td className="py-4 px-4 text-sm text-white font-medium">{row.business}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* FAQ */}
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-3xl font-bold text-white mb-12 text-center">Frequently Asked Questions</h2>
                        <div className="space-y-8">
                            {[
                                {
                                    q: "Can I upgrade or downgrade anytime?",
                                    a: "Yes, you can change your plan at any time. Changes take effect immediately, and we'll prorate any payments."
                                },
                                {
                                    q: "What happens if I exceed my view limit?",
                                    a: "On the free plan, tracking will pause until the next billing cycle. We'll notify you before this happens so you can upgrade if needed."
                                },
                                {
                                    q: "Do you offer discounts for non-profits?",
                                    a: "Yes! Contact our sales team with proof of your non-profit status for a 50% discount on all plans."
                                }
                            ].map((faq, i) => (
                                <div key={i} className="p-6 rounded-2xl bg-[#151921] border border-white/5">
                                    <h3 className="text-lg font-bold text-white mb-2 flex items-start gap-3">
                                        <HelpCircle className="h-5 w-5 text-blue-500 mt-1 shrink-0" />
                                        {faq.q}
                                    </h3>
                                    <p className="text-slate-400 ml-8 leading-relaxed">
                                        {faq.a}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <footer className="border-t border-white/5 py-12 bg-[#0B0E14] text-center">
                <p className="text-slate-600 text-sm">© 2026 OBS Tracker Inc. All rights reserved.</p>
            </footer>
        </div>
    );
}
