import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Mail, MessageSquare } from 'lucide-react';

export default function HelpCenter() {
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
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">How can we help?</h1>

                    <div className="relative max-w-xl mx-auto mb-16">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search for answers..."
                            className="w-full bg-[#151921] border border-white/10 rounded-full py-4 pl-12 pr-6 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 text-left">
                        <div className="p-6 rounded-2xl bg-[#151921] border border-white/5 hover:border-white/10 transition-colors">
                            <h3 className="text-lg font-bold text-white mb-2">Account & Billing</h3>
                            <ul className="space-y-2 text-slate-400 text-sm">
                                <li><a href="#" className="hover:text-blue-400">Reset your password</a></li>
                                <li><a href="#" className="hover:text-blue-400">Update payment method</a></li>
                                <li><a href="#" className="hover:text-blue-400">Cancel subscription</a></li>
                            </ul>
                        </div>
                        <div className="p-6 rounded-2xl bg-[#151921] border border-white/5 hover:border-white/10 transition-colors">
                            <h3 className="text-lg font-bold text-white mb-2">Troubleshooting</h3>
                            <ul className="space-y-2 text-slate-400 text-sm">
                                <li><a href="#" className="hover:text-blue-400">Browser source not loading</a></li>
                                <li><a href="#" className="hover:text-blue-400">Data discrepancy</a></li>
                                <li><a href="#" className="hover:text-blue-400">Connection issues</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-20 pt-12 border-t border-white/5">
                        <h2 className="text-2xl font-bold text-white mb-8">Still need help?</h2>
                        <div className="flex justify-center gap-6">
                            <a href="mailto:support@obstracker.com" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors">
                                <Mail className="h-5 w-5" /> Email Support
                            </a>
                            <a href="#" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10 transition-colors">
                                <MessageSquare className="h-5 w-5" /> Live Chat
                            </a>
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
