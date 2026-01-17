import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, ArrowRight } from 'lucide-react';

export default function Blog() {
    const posts = [
        {
            title: "How to Optimize Your Stream Latency",
            excerpt: "Learn the technical details behind reducing stream delay and interacting with your audience in real-time.",
            date: "Oct 12, 2025",
            author: "Sarah Jenkins",
            category: "Technical"
        },
        {
            title: "Understanding Viewer Retention Metrics",
            excerpt: "Why do viewers leave? We analyzed data from 1 million streams to find the common drop-off points.",
            date: "Sep 28, 2025",
            author: "Mike Chen",
            category: "Analytics"
        },
        {
            title: "OBS Tracker 2.0 Release Notes",
            excerpt: "Introducing multi-project management, team seats, and our new dark mode dashboard.",
            date: "Sep 15, 2025",
            author: "Team OBS Tracker",
            category: "Product"
        },
        {
            title: "The Future of Live Streaming",
            excerpt: "Predictions for 2026 and beyond. What creators need to know about upcoming platform changes.",
            date: "Aug 30, 2025",
            author: "Alex Rivera",
            category: "Industry"
        }
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
                </div>
            </header>

            <main className="pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Latest Updates</h1>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            News, tips, and insights from the OBS Tracker team.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {posts.map((post, i) => (
                            <article key={i} className="group bg-[#151921] border border-white/5 rounded-3xl overflow-hidden hover:border-white/10 transition-colors">
                                <div className="h-48 bg-gradient-to-br from-blue-900/20 to-purple-900/20 group-hover:from-blue-900/30 group-hover:to-purple-900/30 transition-colors"></div>
                                <div className="p-8">
                                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mb-4">
                                        <span className="text-blue-400 uppercase tracking-wider">{post.category}</span>
                                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {post.date}</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                                        {post.title}
                                    </h2>
                                    <p className="text-slate-400 mb-6 leading-relaxed">
                                        {post.excerpt}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-slate-300">
                                            <div className="h-6 w-6 rounded-full bg-slate-700"></div>
                                            {post.author}
                                        </div>
                                        <span className="text-blue-500 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                                            Read Article <ArrowRight className="h-4 w-4" />
                                        </span>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </main>

            <footer className="border-t border-white/5 py-12 bg-[#0B0E14] text-center">
                <p className="text-slate-600 text-sm">© 2026 OBS Tracker Inc. All rights reserved.</p>
            </footer>
        </div>
    );
}
