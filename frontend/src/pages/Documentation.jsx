import { Link } from 'react-router-dom';
import { ArrowLeft, Book, Code, Settings, PlayCircle } from 'lucide-react';

export default function Documentation() {
    const sections = [
        {
            title: "Getting Started",
            icon: <PlayCircle className="h-6 w-6 text-blue-400" />,
            links: ["Quick Start Guide", "Installation", "First Project Setup"]
        },
        {
            title: "Core Concepts",
            icon: <Book className="h-6 w-6 text-purple-400" />,
            links: ["Projects & Workspaces", "Understanding Metrics", "User Roles"]
        },
        {
            title: "Configuration",
            icon: <Settings className="h-6 w-6 text-teal-400" />,
            links: ["Account Settings", "Billing & Plans", "Notification Preferences"]
        },
        {
            title: "Advanced",
            icon: <Code className="h-6 w-6 text-yellow-400" />,
            links: ["API Reference", "Webhooks", "Custom CSS"]
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
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Documentation</h1>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            Learn how to get the most out of OBS Tracker.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {sections.map((section, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-[#151921] border border-white/5">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 rounded-xl bg-white/5">
                                        {section.icon}
                                    </div>
                                    <h2 className="text-xl font-bold text-white">{section.title}</h2>
                                </div>
                                <ul className="space-y-3">
                                    {section.links.map((link, j) => (
                                        <li key={j}>
                                            <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                                                {link}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
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
