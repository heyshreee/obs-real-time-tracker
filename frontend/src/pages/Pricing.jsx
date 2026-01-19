import { Link } from 'react-router-dom';
import { Check, HelpCircle, ArrowLeft } from 'lucide-react';

export default function Pricing() {
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

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-32">
                        {/* STARTER */}
                        <div className="p-8 rounded-3xl bg-[#151921] border border-white/5 flex flex-col">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">STARTER</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-bold text-white">$0</span>
                                <span className="text-slate-500">/mo</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-slate-300 text-sm">
                                    <Check className="h-4 w-4 text-green-500" /> 10k events/mo
                                </li>
                                <li className="flex items-center gap-3 text-slate-300 text-sm">
                                    <Check className="h-4 w-4 text-green-500" /> 10 Projects
                                </li>
                                <li className="flex items-center gap-3 text-slate-300 text-sm">
                                    <Check className="h-4 w-4 text-green-500" /> Basic Analytics
                                </li>
                            </ul>
                            <Link to="/register" className="block w-full py-3 px-4 rounded-xl border border-white/10 text-white text-center font-medium hover:bg-white/5 transition-colors">
                                Get Started
                            </Link>
                        </div>

                        {/* PRO STREAMER */}
                        <div className="p-8 rounded-3xl bg-blue-600 border border-blue-500 shadow-2xl shadow-blue-900/20 flex flex-col relative transform md:-translate-y-4">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-blue-500 rounded-full text-xs font-bold text-white border border-blue-400">MOST POPULAR</div>
                            <h3 className="text-sm font-bold text-blue-200 uppercase tracking-wider mb-2">PRO STREAMER</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-bold text-white">$29</span>
                                <span className="text-blue-200">/mo</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-white text-sm">
                                    <Check className="h-4 w-4 text-white" /> 500k events/mo
                                </li>
                                <li className="flex items-center gap-3 text-white text-sm">
                                    <Check className="h-4 w-4 text-white" /> Unlimited Projects
                                </li>
                                <li className="flex items-center gap-3 text-white text-sm">
                                    <Check className="h-4 w-4 text-white" /> AI-Powered Insights
                                </li>
                                <li className="flex items-center gap-3 text-white text-sm">
                                    <Check className="h-4 w-4 text-white" /> Email Notifications
                                </li>
                            </ul>
                            <Link to="/register" className="block w-full py-3 px-4 rounded-xl bg-white text-blue-600 text-center font-bold hover:bg-blue-50 transition-colors">
                                Start Free Trial
                            </Link>
                        </div>

                        {/* SCALE / ORG */}
                        <div className="p-8 rounded-3xl bg-[#151921] border border-white/5 flex flex-col">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">SCALE / ORG</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-bold text-white">Custom</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-slate-300 text-sm">
                                    <Check className="h-4 w-4 text-green-500" /> Custom volume
                                </li>
                                <li className="flex items-center gap-3 text-slate-300 text-sm">
                                    <Check className="h-4 w-4 text-green-500" /> Unlimited Projects
                                </li>
                                <li className="flex items-center gap-3 text-slate-300 text-sm">
                                    <Check className="h-4 w-4 text-green-500" /> Advanced AI Models
                                </li>
                                <li className="flex items-center gap-3 text-slate-300 text-sm">
                                    <Check className="h-4 w-4 text-green-500" /> Custom Email Reports
                                </li>
                            </ul>
                            <Link to="/register" className="block w-full py-3 px-4 rounded-xl border border-white/10 text-white text-center font-medium hover:bg-white/5 transition-colors">
                                Contact Sales
                            </Link>
                        </div>
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
