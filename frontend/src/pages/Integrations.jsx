import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';

export default function Integrations() {
    const integrations = [
        {
            name: "OBS Studio",
            desc: "Native browser source integration for seamless tracking.",
            color: "text-white",
            bg: "bg-slate-800"
        },
        {
            name: "Streamlabs",
            desc: "Compatible with Streamlabs Desktop and widgets.",
            color: "text-teal-400",
            bg: "bg-teal-900/20"
        },
        {
            name: "Twitch",
            desc: "Connect your Twitch account for subscriber-only analytics.",
            color: "text-purple-400",
            bg: "bg-purple-900/20"
        },
        {
            name: "YouTube Live",
            desc: "Track YouTube Live viewer engagement metrics.",
            color: "text-red-400",
            bg: "bg-red-900/20"
        },
        {
            name: "Discord",
            desc: "Send stream alerts directly to your Discord server.",
            color: "text-indigo-400",
            bg: "bg-indigo-900/20"
        },
        {
            name: "Zapier",
            desc: "Connect OBS Tracker to 5,000+ other apps.",
            color: "text-orange-400",
            bg: "bg-orange-900/20"
        }
    ];

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
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Integrations</h1>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            Connect OBS Tracker with the tools you already use.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {integrations.map((item, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-[#151921] border border-white/5 hover:border-white/10 transition-colors group cursor-pointer">
                                <div className={`w-12 h-12 rounded-xl ${item.bg} ${item.color} flex items-center justify-center mb-4 font-bold text-xl`}>
                                    {item.name[0]}
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                    {item.name}
                                    <ExternalLink className="h-4 w-4 text-slate-600 group-hover:text-white transition-colors" />
                                </h3>
                                <p className="text-slate-400 text-sm">
                                    {item.desc}
                                </p>
                            </div>
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
