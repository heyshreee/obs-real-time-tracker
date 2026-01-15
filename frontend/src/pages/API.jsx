import { Link } from 'react-router-dom';
import { ArrowLeft, Terminal, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function API() {
    const [copied, setCopied] = useState(false);

    const copyCode = () => {
        navigator.clipboard.writeText('curl https://api.obstracker.com/v1/stats -H "Authorization: Bearer YOUR_API_KEY"');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/20 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-wide uppercase mb-6">
                            Developer API
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Build with OBS Tracker</h1>
                        <p className="text-xl text-slate-400">
                            Access your stream data programmatically. Integrate with your own tools, overlays, or bots.
                        </p>
                    </div>

                    <div className="space-y-12">
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">Authentication</h2>
                            <p className="text-slate-400 mb-6">
                                Authenticate your requests using your API key. You can generate a new key in your dashboard settings.
                            </p>
                            <div className="bg-[#151921] rounded-xl border border-white/10 p-6 font-mono text-sm relative group">
                                <button
                                    onClick={copyCode}
                                    className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                >
                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </button>
                                <div className="text-slate-500 mb-2"># Example Request</div>
                                <div className="text-blue-400">
                                    curl https://api.obstracker.com/v1/stats \<br />
                                    &nbsp;&nbsp;-H "Authorization: Bearer YOUR_API_KEY"
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">Endpoints</h2>
                            <div className="space-y-4">
                                {[
                                    { method: 'GET', path: '/v1/projects', desc: 'List all projects' },
                                    { method: 'GET', path: '/v1/projects/:id/stats', desc: 'Get stats for a specific project' },
                                    { method: 'POST', path: '/v1/projects', desc: 'Create a new project' },
                                ].map((endpoint, i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-[#151921] border border-white/5">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${endpoint.method === 'GET' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                                            {endpoint.method}
                                        </span>
                                        <span className="font-mono text-slate-300">{endpoint.path}</span>
                                        <span className="text-slate-500 text-sm ml-auto">{endpoint.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            <footer className="border-t border-white/5 py-12 bg-[#0B0E14] text-center">
                <p className="text-slate-600 text-sm">© 2026 OBS Tracker Inc. All rights reserved.</p>
            </footer>
        </div>
    );
}
