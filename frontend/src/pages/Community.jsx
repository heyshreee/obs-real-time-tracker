import { Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Github, Twitter } from 'lucide-react';

export default function Community() {
    return (
        <div className="min-h-screen bg-[#0B0E14] text-white font-sans selection:bg-blue-500/30">
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
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Join the Community</h1>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            Connect with other streamers, developers, and the OBS Tracker team.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <a href="#" className="p-8 rounded-3xl bg-[#5865F2]/10 border border-[#5865F2]/20 hover:bg-[#5865F2]/20 transition-colors text-center group">
                            <MessageCircle className="h-12 w-12 text-[#5865F2] mx-auto mb-6 group-hover:scale-110 transition-transform" />
                            <h2 className="text-2xl font-bold text-white mb-2">Discord</h2>
                            <p className="text-slate-400">Join our active Discord server for support, feature requests, and chat.</p>
                        </a>

                        <a href="#" className="p-8 rounded-3xl bg-[#1DA1F2]/10 border border-[#1DA1F2]/20 hover:bg-[#1DA1F2]/20 transition-colors text-center group">
                            <Twitter className="h-12 w-12 text-[#1DA1F2] mx-auto mb-6 group-hover:scale-110 transition-transform" />
                            <h2 className="text-2xl font-bold text-white mb-2">Twitter</h2>
                            <p className="text-slate-400">Follow us for the latest updates, tips, and shoutouts.</p>
                        </a>

                        <a href="#" className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-center group">
                            <Github className="h-12 w-12 text-white mx-auto mb-6 group-hover:scale-110 transition-transform" />
                            <h2 className="text-2xl font-bold text-white mb-2">GitHub</h2>
                            <p className="text-slate-400">Contribute to our open-source projects or report bugs.</p>
                        </a>
                    </div>
                </div>
            </main>

            <footer className="border-t border-white/5 py-12 bg-[#0B0E14] text-center">
                <p className="text-slate-600 text-sm">© 2026 OBS Tracker Inc. All rights reserved.</p>
            </footer>
        </div>
    );
}
