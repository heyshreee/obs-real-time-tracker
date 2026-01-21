import React from 'react';
import { Link } from 'react-router-dom';
import { Layout, Power, Share2, HelpCircle } from 'lucide-react';
import notFoundImage from '../assets/404-island.png';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col relative overflow-hidden font-sans">
            {/* Background Elements - Subtle Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px]" />
            </div>

            {/* Header */}
            <header className="relative z-10 flex justify-between items-center p-6 md:px-12 md:py-8">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-indigo-600 rounded-sm flex items-center justify-center">
                        <div className="w-3 h-3 bg-white/20 rounded-sm" />
                    </div>
                    <span className="font-bold tracking-wider text-sm">OBS TRACKER</span>
                </div>
                <nav className="hidden md:flex items-center gap-8 text-xs font-medium tracking-widest text-slate-400">
                    <a href="#" className="hover:text-white transition-colors">NETWORK STATUS</a>
                    <a href="#" className="hover:text-white transition-colors">SUPPORT</a>
                </nav>
            </header>

            {/* Main Content */}
            <main className="flex-1 relative z-10 flex flex-col items-center justify-center px-4 text-center">
                {/* 404 Image Container */}
                <div className="relative mb-8 md:mb-12">
                    {/* Background number watermark */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20rem] font-bold text-white/[0.02] pointer-events-none select-none leading-none">
                        404
                    </div>

                    {/* Floating Island Image */}
                    <div className="relative w-64 h-64 md:w-96 md:h-96 animate-float">
                        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-[60px] animate-pulse-slow" />
                        <img
                            src={notFoundImage}
                            alt="404 Floating Island"
                            className="w-full h-full object-contain relative z-10 drop-shadow-2xl"
                        />
                    </div>
                </div>

                {/* Text Content */}
                <div className="max-w-2xl mx-auto space-y-6">
                    <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-white mb-4">
                        You've reached a silent shore.
                    </h1>
                    <p className="text-slate-400 text-lg md:text-xl font-light leading-relaxed max-w-lg mx-auto">
                        The tracking data you're looking for has drifted beyond the horizon. Let's get you back to the stream.
                    </p>

                    {/* Actions */}
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-8">
                        <Link
                            to="/dashboard"
                            className="group relative px-8 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-full transition-all duration-300 flex items-center gap-3 overflow-hidden"
                        >
                            <Layout className="w-4 h-4 text-slate-300 group-hover:text-white transition-colors" />
                            <span className="text-sm font-medium tracking-wide text-slate-200 group-hover:text-white">BACK TO DASHBOARD</span>
                        </Link>

                        <Link
                            to="/dashboard/projects"
                            className="group px-8 py-3 bg-transparent hover:bg-white/5 rounded-full transition-all duration-300 flex items-center gap-3"
                        >
                            <Power className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                            <span className="text-sm font-medium tracking-wide text-slate-400 group-hover:text-white">TRACK NEW SESSION</span>
                        </Link>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 flex flex-col md:flex-row justify-between items-center p-6 md:px-12 md:py-8 gap-4">
                <div className="text-[10px] font-mono text-slate-600 tracking-widest uppercase">
                    Coordinates: 40.7128° N, 74.0060° W
                </div>

                <div className="flex items-center gap-4">
                    <button className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-600 transition-all">
                        <Share2 className="w-3 h-3" />
                    </button>
                    <button className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-600 transition-all">
                        <HelpCircle className="w-3 h-3" />
                    </button>
                </div>
            </footer>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                .animate-pulse-slow {
                    animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </div>
    );
}
