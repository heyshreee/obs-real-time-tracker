import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    BarChart2,
    Shield,
    Zap,
    Check,
    Play,
    Layout,
    Bell,
    Star,
    Users,
    Activity,
    Clock,
    Menu,
    X
} from 'lucide-react';

export default function Landing() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isVideoOpen, setIsVideoOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#0B0E14] text-white selection:bg-blue-500/30 font-sans">
            {/* Header */}
            <header className="fixed top-0 w-full z-50 bg-[#0B0E14]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <BarChart2 className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">
                            OBS Tracker
                        </span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                        <Link to="/" className="hover:text-white transition-colors">Home</Link>
                        <Link to="/features" className="hover:text-white transition-colors">Features</Link>
                        <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
                        <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
                    </nav>

                    <div className="hidden md:flex items-center gap-4">
                        <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                            Log In
                        </Link>
                        <Link
                            to="/register"
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-full transition-all hover:shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)]"
                        >
                            Start Tracking
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-slate-400 hover:text-white"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-[#0B0E14] border-b border-white/5 px-4 py-4 space-y-4">
                        <Link to="/" className="block text-slate-400 hover:text-white font-medium">Home</Link>
                        <Link to="/features" className="block text-slate-400 hover:text-white font-medium">Features</Link>
                        <Link to="/pricing" className="block text-slate-400 hover:text-white font-medium">Pricing</Link>
                        <Link to="/blog" className="block text-slate-400 hover:text-white font-medium">Blog</Link>
                        <div className="pt-4 border-t border-white/5 flex flex-col gap-4">
                            <Link to="/login" className="block text-center text-slate-400 hover:text-white font-medium">
                                Log In
                            </Link>
                            <Link
                                to="/register"
                                className="block text-center px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-full"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            <main className="pt-32">
                {/* Hero Section */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/20 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-wide uppercase mb-8">
                        OBS TRACKER SOLUTIONS
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
                        Track Every <span className="text-blue-500">Frame</span>.
                        <br />
                        Know Every <span className="text-purple-500">Viewer</span>.
                    </h1>

                    <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Stop guessing who's watching. Get granular, real-time analytics for every stream.
                        Understand your audience, optimize your content, and grow your channel.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                        <Link
                            to="/register"
                            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-full transition-all hover:shadow-[0_0_30px_-5px_rgba(37,99,235,0.5)] min-w-[180px]"
                        >
                            Start Tracking Now
                        </Link>
                        <button
                            onClick={() => setIsVideoOpen(true)}
                            className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-full border border-white/10 transition-all flex items-center gap-2 min-w-[180px] justify-center"
                        >
                            <Play className="h-4 w-4 fill-current" /> Watch Demo
                        </button>
                    </div>

                    {/* Mockup */}
                    <div className="relative max-w-5xl mx-auto rounded-xl border border-white/10 bg-[#151921] p-2 shadow-2xl shadow-blue-500/5">
                        <div className="bg-[#0B0E14] rounded-lg overflow-hidden border border-white/5 aspect-[16/9] relative group">
                            {/* Fake UI Header */}
                            <div className="h-10 border-b border-white/5 bg-[#151921] flex items-center px-4 gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
                                </div>
                                <div className="ml-4 text-xs text-slate-500 font-mono">OBS Tracker Dashboard</div>
                            </div>
                            {/* Fake UI Content */}
                            <div className="p-6 grid grid-cols-4 gap-6 h-full">
                                <div className="col-span-1 border-r border-white/5 pr-6 space-y-4">
                                    <div className="h-8 w-3/4 bg-white/5 rounded"></div>
                                    <div className="h-4 w-1/2 bg-white/5 rounded"></div>
                                    <div className="h-4 w-2/3 bg-white/5 rounded"></div>
                                    <div className="h-4 w-1/2 bg-white/5 rounded"></div>
                                </div>
                                <div className="col-span-3 space-y-6">
                                    <div className="flex gap-4">
                                        <div className="h-24 w-1/3 bg-blue-500/10 border border-blue-500/20 rounded-xl"></div>
                                        <div className="h-24 w-1/3 bg-purple-500/10 border border-purple-500/20 rounded-xl"></div>
                                        <div className="h-24 w-1/3 bg-green-500/10 border border-green-500/20 rounded-xl"></div>
                                    </div>
                                    <div className="h-64 bg-white/5 rounded-xl border border-white/5"></div>
                                </div>
                            </div>

                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-transparent to-transparent opacity-50"></div>
                        </div>
                    </div>
                </section>

                {/* Logos */}
                <section className="py-12 border-y border-white/5 bg-white/[0.02]">
                    <div className="max-w-7xl mx-auto px-4 text-center">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8">Integrated with your favorite platforms</p>
                        <div className="flex justify-center items-center gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                            <div className="flex items-center gap-2 text-xl font-bold text-white"><span className="text-[#9146FF]">Twitch</span></div>
                            <div className="flex items-center gap-2 text-xl font-bold text-white"><span className="text-[#FF0000]">YouTube</span> Live</div>
                            <div className="flex items-center gap-2 text-xl font-bold text-white">OBS Studio</div>
                            <div className="flex items-center gap-2 text-xl font-bold text-white">Streamlabs</div>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section id="features" className="py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-bold text-white mb-4">Supercharge Your Stream</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">Everything you need to take your content to the next level.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Activity className="h-6 w-6 text-blue-400" />,
                                color: "bg-blue-500/10",
                                title: "Real-time Performance Tracking",
                                desc: "Monitor stream health, viewer latency, and engagement metrics as they happen. Never miss a drop in quality."
                            },
                            {
                                icon: <Layout className="h-6 w-6 text-purple-400" />,
                                color: "bg-purple-500/10",
                                title: "Multi-Project Management",
                                desc: "Manage multiple channels or shows from a single dashboard. Switch contexts instantly without losing data."
                            },
                            {
                                icon: <Bell className="h-6 w-6 text-teal-400" />,
                                color: "bg-teal-500/10",
                                title: "Instant Usage Alerts",
                                desc: "Get notified immediately when you hit viewer milestones or if stream performance degrades."
                            }
                        ].map((feature, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-[#151921] border border-white/5 hover:border-white/10 transition-colors group">
                                <div className={`h-14 w-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                <p className="text-slate-400 leading-relaxed text-sm">{feature.desc}</p>

                                <ul className="mt-6 space-y-2">
                                    <li className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div> Instant setup
                                    </li>
                                    <li className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div> No hardware required
                                    </li>
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Testimonial */}
                <section id="testimonials" className="py-20 bg-gradient-to-b from-[#151921] to-[#0B0E14] border-y border-white/5">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-6">
                                    Trusted by over 5,000+ top-tier creators.
                                </h2>
                                <p className="text-slate-400 mb-8 leading-relaxed">
                                    "OBS Tracker is the only analytics tool that gives me the granularity I need to understand my audience retention. It's completely changed how I plan my content schedule."
                                </p>
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-slate-800 border border-white/10"></div>
                                    <div>
                                        <div className="font-bold text-white">Alex Rivera</div>
                                        <div className="text-sm text-slate-500">Professional Streamer, 500k+ Subs</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[#0B0E14] p-8 rounded-2xl border border-white/5 relative">
                                <div className="flex gap-1 mb-4">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                                    ))}
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                                        <div className="text-sm text-slate-300">"The real-time alerts saved my stream twice last week. Indispensable."</div>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                                        <div className="text-sm text-slate-300">"Finally, analytics that actually look good and make sense."</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pricing */}
                <section id="pricing" className="py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-bold text-white mb-4">Transparent Pricing</h2>
                        <p className="text-slate-400">The perfect plan for every stage of your journey.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {/* Starter */}
                        <div className="p-8 rounded-3xl bg-[#151921] border border-white/5 flex flex-col">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Starter</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-bold text-white">$0</span>
                                <span className="text-slate-500">/mo</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-slate-300 text-sm">
                                    <Check className="h-4 w-4 text-green-500" /> 10,000 views/month
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

                        {/* Pro Streamer */}
                        <div className="p-8 rounded-3xl bg-blue-600 border border-blue-500 shadow-2xl shadow-blue-900/20 flex flex-col relative transform md:-translate-y-4">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-blue-500 rounded-full text-xs font-bold text-white border border-blue-400">MOST POPULAR</div>
                            <h3 className="text-sm font-bold text-blue-200 uppercase tracking-wider mb-2">Pro Streamer</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-bold text-white">$29</span>
                                <span className="text-blue-200">/mo</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-white text-sm">
                                    <Check className="h-4 w-4 text-white" /> Unlimited views
                                </li>
                                <li className="flex items-center gap-3 text-white text-sm">
                                    <Check className="h-4 w-4 text-white" /> Unlimited Projects
                                </li>
                                <li className="flex items-center gap-3 text-white text-sm">
                                    <Check className="h-4 w-4 text-white" /> Advanced Audience Insights
                                </li>
                                <li className="flex items-center gap-3 text-white text-sm">
                                    <Check className="h-4 w-4 text-white" /> Priority Support
                                </li>
                            </ul>
                            <Link to="/register" className="block w-full py-3 px-4 rounded-xl bg-white text-blue-600 text-center font-bold hover:bg-blue-50 transition-colors">
                                Start Free Trial
                            </Link>
                        </div>

                        {/* Studio */}
                        <div className="p-8 rounded-3xl bg-[#151921] border border-white/5 flex flex-col">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Studio / Org</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-bold text-white">$99</span>
                                <span className="text-slate-500">/mo</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-slate-300 text-sm">
                                    <Check className="h-4 w-4 text-green-500" /> Everything in Pro
                                </li>
                                <li className="flex items-center gap-3 text-slate-300 text-sm">
                                    <Check className="h-4 w-4 text-green-500" /> API Access
                                </li>
                                <li className="flex items-center gap-3 text-slate-300 text-sm">
                                    <Check className="h-4 w-4 text-green-500" /> White-label Reports
                                </li>
                                <li className="flex items-center gap-3 text-slate-300 text-sm">
                                    <Check className="h-4 w-4 text-green-500" /> Dedicated Account Manager
                                </li>
                            </ul>
                            <Link to="/register" className="block w-full py-3 px-4 rounded-xl border border-white/10 text-white text-center font-medium hover:bg-white/5 transition-colors">
                                Contact Sales
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Stats */}
                <section className="py-20 border-t border-white/5">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                            <div>
                                <div className="text-4xl font-bold text-white mb-2">500M+</div>
                                <div className="text-sm text-slate-500 uppercase tracking-wider">Views Tracked</div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold text-white mb-2">12K+</div>
                                <div className="text-sm text-slate-500 uppercase tracking-wider">Active Creators</div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold text-white mb-2">99.9%</div>
                                <div className="text-sm text-slate-500 uppercase tracking-wider">Uptime</div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold text-white mb-2">24/7</div>
                                <div className="text-sm text-slate-500 uppercase tracking-wider">Support</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20 px-4">
                    <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-r from-blue-600 to-purple-600 p-12 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Your growth starts with better data.</h2>
                            <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">Join thousands of creators who are using OBS Tracker to build their audience.</p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link
                                    to="/register"
                                    className="px-8 py-4 bg-white text-blue-600 font-bold rounded-full hover:bg-blue-50 transition-colors"
                                >
                                    Get Started Free
                                </Link>
                                <Link
                                    to="/pricing"
                                    className="px-8 py-4 bg-blue-700/50 text-white font-bold rounded-full hover:bg-blue-700 transition-colors border border-white/20"
                                >
                                    View Pricing
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-white/5 py-16 bg-[#0B0E14]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-4 gap-12 mb-12">
                            <div className="col-span-1 md:col-span-1">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="bg-blue-600 p-1.5 rounded-lg">
                                        <BarChart2 className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="text-xl font-bold text-white">OBS Tracker</span>
                                </div>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    The advanced analytics platform for modern content creators. Track, analyze, and grow.
                                </p>
                            </div>
                            <div>
                                <h4 className="text-white font-bold mb-6">Product</h4>
                                <ul className="space-y-4 text-sm text-slate-500">
                                    <li><Link to="/features" className="hover:text-blue-400 transition-colors">Features</Link></li>
                                    <li><Link to="/pricing" className="hover:text-blue-400 transition-colors">Pricing</Link></li>
                                    <li><Link to="/api" className="hover:text-blue-400 transition-colors">API</Link></li>
                                    <li><Link to="/integrations" className="hover:text-blue-400 transition-colors">Integrations</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-white font-bold mb-6">Resources</h4>
                                <ul className="space-y-4 text-sm text-slate-500">
                                    <li><Link to="/blog" className="hover:text-blue-400 transition-colors">Blog</Link></li>
                                    <li><Link to="/docs" className="hover:text-blue-400 transition-colors">Documentation</Link></li>
                                    <li><Link to="/community" className="hover:text-blue-400 transition-colors">Community</Link></li>
                                    <li><Link to="/help" className="hover:text-blue-400 transition-colors">Help Center</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-white font-bold mb-6">Legal</h4>
                                <ul className="space-y-4 text-sm text-slate-500">
                                    <li><Link to="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                                    <li><Link to="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
                                    <li><Link to="/cookies" className="hover:text-blue-400 transition-colors">Cookie Policy</Link></li>
                                </ul>
                            </div>
                        </div>
                        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                            <p className="text-slate-600 text-sm">© 2026 OBS Tracker Inc. All rights reserved.</p>
                            <div className="flex gap-6 text-slate-500">
                                <a href="#" className="hover:text-white transition-colors">Twitter</a>
                                <a href="#" className="hover:text-white transition-colors">GitHub</a>
                                <a href="#" className="hover:text-white transition-colors">Discord</a>
                            </div>
                        </div>
                    </div>
                </footer>
            </main>

            {/* Video Modal */}
            {isVideoOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                        <button
                            onClick={() => setIsVideoOpen(false)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-white/20 transition-colors z-10"
                        >
                            <X className="h-6 w-6" />
                        </button>
                        <iframe
                            width="100%"
                            height="100%"
                            src="https://www.youtube.com/embed/gNTU9WCmgbk?si=jsn0X5wxM76jv54c&autoplay=1"
                            title="Product Demo"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                    <div
                        className="absolute inset-0 -z-10"
                        onClick={() => setIsVideoOpen(false)}
                    ></div>
                </div>
            )}
        </div>
    );
}
