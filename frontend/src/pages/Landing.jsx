import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Activity,
    Zap,
    Shield,
    Globe,
    BarChart2,
    Clock,
    Check,
    Menu,
    X,
    ChevronRight,
    Users,
    Layers,
    Lock,
    Play,
    Layout,
    Bell,
    Star
} from 'lucide-react';

export default function Landing() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isVideoOpen, setIsVideoOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState([
        {
            id: 'free',
            name: 'Free',
            price_usd: 0,
            price_inr: 0,
            features: ['1 Project', '1 Allowed Origin', '1,000 events/mo', '60 sec refresh', 'Basic Analytics'],
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
            features: ['5 Projects', '3 Allowed Origins', 'Live Device Stats', '50,000 events/mo', '10 sec refresh', 'Real-time Analytics'],
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
            features: ['15 Projects', '10 Allowed Origins', 'Live Activity Logs', '500,000 events/mo', '1 sec refresh', 'Advanced Analytics', 'Priority Support'],
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
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                const baseUrl = API_URL.replace(/\/api\/?$/, '');
                const res = await fetch(`${baseUrl}/api/plans`);
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
                            WebPluse Analytics
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
                        WEBPLUSE ANALYTICS SOLUTIONS
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
                                <div className="ml-4 text-xs text-slate-500 font-mono">WebPluse Analytics Dashboard</div>
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
                        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                            <div className="text-xl font-bold text-white tracking-tight">Razorpay</div>
                            <div className="text-xl font-bold text-[#3ECF8E] tracking-tight">Supabase</div>
                            <div className="text-xl font-bold text-[#F9AB00] tracking-tight">Google Analytics</div>
                            <div className="text-xl font-bold text-[#F38020] tracking-tight">Cloudflare</div>
                            <div className="text-xl font-bold text-[#FF9900] tracking-tight">AWS</div>
                            <div className="text-xl font-bold text-white tracking-tight">Vercel</div>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section id="features" className="py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-bold text-white mb-4">Supercharge Your Stream</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">Everything you need to take your content to the next level.</p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8 mb-24">
                        {[
                            {
                                icon: <Activity className="h-6 w-6 text-blue-400" />,
                                color: "bg-blue-500/10",
                                title: "Real-time Activity Logs",
                                desc: "Track every visitor action as it happens — not minutes later. WebPulse captures live events such as page visits, session starts, and engagement activity in real time using WebSockets. This allows you to react instantly to audience behavior instead of guessing based on outdated data.",
                                get: ["Live visitor activity feed", "Real-time page and session tracking", "Instant data updates without refresh", "Low-latency event delivery"],
                                why: ["Perfect for live streams and launches", "Immediate insight into traffic spikes", "No waiting for analytics reports"]
                            },
                            {
                                icon: <Layout className="h-6 w-6 text-purple-400" />,
                                color: "bg-purple-500/10",
                                title: "Multi-Project Management",
                                desc: "Manage multiple websites, streams, or applications from one centralized dashboard. Each project is fully isolated with its own tracking ID and data stream. You can switch between projects instantly without losing context or data.",
                                get: ["Multiple project support", "Dedicated tracking IDs per project", "Fast project switching", "Secure data separation"],
                                why: ["Ideal for agencies, creators, and dev teams", "One account, many projects", "Clean organization without complexity"]
                            },
                            {
                                icon: <Bell className="h-6 w-6 text-teal-400" />,
                                color: "bg-teal-500/10",
                                title: "Instant Usage Alerts",
                                desc: "Stay informed the moment something changes. WebPulse monitors usage patterns and notifies you immediately when predefined thresholds are reached — whether that’s a surge in viewers or a sudden performance drop.",
                                get: ["Real-time usage notifications", "Viewer milestone alerts", "Performance degradation alerts", "Custom alert thresholds"],
                                why: ["React before problems escalate", "Never miss peak engagement moments", "Better stream and site reliability"]
                            }
                        ].map((feature, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-[#151921] border border-white/5 hover:border-white/10 transition-colors group flex flex-col">
                                <div className={`h-14 w-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                <p className="text-slate-400 leading-relaxed text-sm mb-8">{feature.desc}</p>

                                <div className="space-y-6 mt-auto">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">What you get</h4>
                                        <ul className="space-y-2">
                                            {feature.get.map((item, j) => (
                                                <li key={j} className="flex items-start gap-2 text-xs text-slate-400 font-medium">
                                                    <Check className="h-3.5 w-3.5 text-blue-500 mt-0.5" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">Why it matters</h4>
                                        <ul className="space-y-2">
                                            {feature.why.map((item, j) => (
                                                <li key={j} className="flex items-start gap-2 text-xs text-slate-400 font-medium">
                                                    <Star className="h-3.5 w-3.5 text-purple-500 mt-0.5" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Technical Highlights */}
                    <div className="max-w-4xl mx-auto rounded-3xl bg-[#0B0E14] border border-white/10 p-8 md:p-12">
                        <div className="text-center mb-10">
                            <h3 className="text-2xl font-bold text-white mb-4">Technical Highlights</h3>
                            <p className="text-slate-400">Built with performance and scalability in mind.</p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-x-12 gap-y-4">
                            {[
                                "WebSocket-based real-time updates",
                                "REST APIs for integration",
                                "Lightweight tracking script",
                                "Optimized for low CPU and memory usage",
                                "Works with React, Node.js, Express, and MongoDB",
                                "OBS overlay and dashboard friendly",
                                "No hardware. No plugins. No complex configuration."
                            ].map((tech, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                                    <span className="text-slate-300 text-sm font-medium">{tech}</span>
                                </div>
                            ))}
                        </div>
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
                                    "WebPluse Analytics is the only analytics tool that gives me the granularity I need to understand my audience retention. It's completely changed how I plan my content schedule."
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

                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                            {plans.map((plan) => {
                                const isPro = plan.id === 'pro';
                                const isBusiness = plan.id === 'business';
                                const isBasic = plan.id === 'basic';
                                const isFree = plan.id === 'free';

                                return (
                                    <div key={plan.id} className={`p-6 rounded-3xl flex flex-col transition-all duration-300 relative ${isPro
                                        ? 'bg-blue-600 border border-blue-500 shadow-2xl shadow-blue-900/20 transform lg:-translate-y-4'
                                        : isBusiness
                                            ? 'bg-gradient-to-b from-[#151921] to-blue-900/20 border border-blue-500/30 hover:border-blue-500/50'
                                            : 'bg-[#151921] border border-white/5 hover:border-white/10'
                                        }`}>
                                        {isPro && (
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-blue-500 rounded-full text-[10px] font-bold text-white border border-blue-400 tracking-wide">MOST POPULAR</div>
                                        )}

                                        <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 ${isPro ? 'text-blue-100' : isBasic || isBusiness ? 'text-blue-400' : 'text-slate-400'
                                            }`}>{plan.name}</h3>

                                        <div className="flex items-baseline gap-1 mb-1">
                                            <span className={`text-3xl font-bold ${isPro ? 'text-white' : 'text-white'}`}>
                                                {!plan.price_inr && !plan.price_usd ? 'Free' : `₹${plan.price_inr}`}
                                            </span>
                                            {(plan.price_inr > 0) && <span className={isPro ? 'text-blue-200' : 'text-slate-500'}>/mo</span>}
                                        </div>

                                        <div className={`text-xs mb-6 ${isPro ? 'text-blue-200' : 'text-slate-500'}`}>
                                            {plan.price_usd > 0 ? `$${plan.price_usd} / month` : '$0 / month'}
                                        </div>

                                        <p className={`text-sm mb-6 min-h-[40px] ${isPro ? 'text-blue-100' : 'text-slate-400'}`}>
                                            {plan.id === 'free' && 'Trying WebPulse'}
                                            {plan.id === 'basic' && 'Students & solo devs'}
                                            {plan.id === 'pro' && 'Streamers & growing apps'}
                                            {plan.id === 'business' && 'Scale-ups & teams'}
                                        </p>

                                        <ul className="space-y-3 mb-8 flex-1">
                                            {/* Feature list from plan features JSON if available, else usage limits */}
                                            {plan.features && plan.features.length > 0 ? (
                                                // If backend returns formatted features list (preferred for UI consistency)
                                                // Assuming specific structure or defaulting to constructing it
                                                plan.features.slice(0, 6).map((feature, idx) => ( // Show top 6 features
                                                    <li key={idx} className={`flex items-center gap-2 text-xs ${isPro ? 'text-white' : 'text-slate-300'}`}>
                                                        <Check className={`h-3.5 w-3.5 shrink-0 ${isPro ? 'text-white' : 'text-blue-500'}`} />
                                                        {feature.text || feature}
                                                    </li>
                                                ))
                                            ) : (
                                                // Fallback to constructing user-friendly list from limits if "features" array is empty/missing
                                                <>
                                                    <li className={`flex items-center gap-2 text-xs ${isPro ? 'text-white' : 'text-slate-300'}`}>
                                                        <Check className={`h-3.5 w-3.5 shrink-0 ${isPro ? 'text-white' : 'text-blue-500'}`} />
                                                        {plan.max_projects === 100 ? 'Unlimited' : plan.max_projects} Projects
                                                    </li>
                                                    <li className={`flex items-center gap-2 text-xs ${isPro ? 'text-white' : 'text-slate-300'}`}>
                                                        <Check className={`h-3.5 w-3.5 shrink-0 ${isPro ? 'text-white' : 'text-blue-500'}`} />
                                                        {plan.allowed_origins} Allowed Origin{plan.allowed_origins > 1 ? 's' : ''}
                                                    </li>
                                                    <li className={`flex items-center gap-2 text-xs ${isPro ? 'text-white' : 'text-slate-300'}`}>
                                                        <Check className={`h-3.5 w-3.5 shrink-0 ${isPro ? 'text-white' : 'text-blue-500'}`} />
                                                        {new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(plan.monthly_events)} events/mo
                                                    </li>
                                                    <li className={`flex items-center gap-2 text-xs ${isPro ? 'text-white' : 'text-slate-300'}`}>
                                                        <Check className={`h-3.5 w-3.5 shrink-0 ${isPro ? 'text-white' : 'text-blue-500'}`} />
                                                        {plan.refresh_rate === 0 ? 'Real-time' : `${plan.refresh_rate} sec`} dashboard refresh
                                                    </li>
                                                    {plan.live_logs && (
                                                        <li className={`flex items-center gap-2 text-xs ${isPro ? 'text-white' : 'text-slate-300'}`}>
                                                            <Check className={`h-3.5 w-3.5 shrink-0 ${isPro ? 'text-white' : 'text-blue-500'}`} />
                                                            Live Activity Logs
                                                        </li>
                                                    )}
                                                </>
                                            )}
                                        </ul>

                                        <Link
                                            to="/register"
                                            className={`block w-full py-2.5 px-4 rounded-xl text-center text-sm font-medium transition-colors ${isPro
                                                ? 'bg-white text-blue-600 hover:bg-blue-50'
                                                : isBasic
                                                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/50 hover:bg-blue-600/20'
                                                    : isBusiness
                                                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-900/20'
                                                        : 'border border-white/10 text-white hover:bg-white/5'
                                                }`}
                                        >
                                            {isFree ? 'Get Started' : `Choose ${plan.name}`}
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    )}
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
                            <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">Join thousands of creators who are using WebPluse Analytics to build their audience.</p>
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
                                    <span className="text-xl font-bold text-white">WebPluse Analytics</span>
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
                            <p className="text-slate-600 text-sm">© 2026 WebPluse Analytics Inc. All rights reserved.</p>
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
