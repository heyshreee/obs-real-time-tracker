import { Link } from 'react-router-dom';
import { ArrowLeft, Terminal, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeBlock = ({ code, language = 'javascript', title }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-[#151921] rounded-xl border border-white/10 overflow-hidden my-4">
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                <span className="text-xs font-medium text-slate-400">{title || language}</span>
                <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                >
                    {copied ? (
                        <>
                            <Check className="h-3.5 w-3.5 text-green-500" />
                            <span className="text-xs text-green-500">Copied</span>
                        </>
                    ) : (
                        <>
                            <Copy className="h-3.5 w-3.5" />
                            <span className="text-xs">Copy</span>
                        </>
                    )}
                </button>
            </div>
            <div className="p-6 overflow-x-auto">
                <SyntaxHighlighter
                    language={language}
                    style={atomDark}
                    customStyle={{
                        background: 'transparent',
                        padding: 0,
                        margin: 0,
                        fontSize: '0.875rem',
                        lineHeight: '1.5',
                    }}
                    wrapLongLines={true}
                >
                    {code}
                </SyntaxHighlighter>
            </div>
        </div>
    );
};

export default function API() {
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
                            <CodeBlock
                                title="cURL"
                                language="bash"
                                code={`curl https://api.obstracker.com/api/v1/projects \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                            />
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">Securing Your Tracking</h2>
                            <p className="text-slate-400 mb-6">
                                Ensure your tracking data is accurate and secure by preventing unauthorized usage.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                                <div className="p-6 rounded-xl bg-[#151921] border border-white/5">
                                    <h3 className="text-lg font-semibold text-white mb-2">No Cookies</h3>
                                    <p className="text-slate-400 text-sm">
                                        We don't use cookies, so you don't need a complex cookie banner for this.
                                    </p>
                                </div>
                                <div className="p-6 rounded-xl bg-[#151921] border border-white/5">
                                    <h3 className="text-lg font-semibold text-white mb-2">Reliable</h3>
                                    <p className="text-slate-400 text-sm">
                                        Uses <code>navigator.sendBeacon</code> to ensure data is sent even if the user closes the tab immediately.
                                    </p>
                                </div>
                                <div className="p-6 rounded-xl bg-[#151921] border border-white/5">
                                    <h3 className="text-lg font-semibold text-white mb-2">Privacy First</h3>
                                    <p className="text-slate-400 text-sm">
                                        We hash IP + UserAgent + ProjectID to count unique visitors without storing PII.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-3">Method 1: Allowed Origins (Recommended)</h3>
                                    <p className="text-slate-400 mb-4">
                                        Restrict tracking requests to specific domains. Go to your <strong>Project Settings</strong> and add your domains to the "Allowed Origins" list.
                                    </p>
                                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm">
                                        Requests from unauthorized domains will be blocked by the server.
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-3">Method 2: Production-Ready Snippet</h3>
                                    <p className="text-slate-400 mb-4">
                                        Use this script to track visitors. It uses <code>navigator.sendBeacon</code> to ensure data is sent even if the user closes the tab.
                                    </p>
                                    <CodeBlock
                                        title="HTML Script"
                                        language="html"
                                        code={`<script>
(function() {
  const TRACKING_ID = "YOUR_TRACKING_ID";
  const ENDPOINT = "https://api.obstracker.com/api/v1/track/" + TRACKING_ID;

  function track() {
    navigator.sendBeacon(
      ENDPOINT,
      JSON.stringify({
        pageUrl: location.href,
        referrer: document.referrer || null,
        screen: {
          width: screen.width,
          height: screen.height
        }
      })
    );
  }

  track();
})();
</script>`}
                                    />
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-3">Method 3: React / Next.js Hook</h3>
                                    <p className="text-slate-400 mb-4">
                                        For Single Page Applications (SPA), use this hook to track route changes correctly.
                                    </p>
                                    <CodeBlock
                                        title="usePageTracking.js"
                                        language="javascript"
                                        code={`import { useEffect } from "react";
import { useLocation } from "react-router-dom"; // or "next/router"

const TRACKING_ID = "YOUR_TRACKING_ID";
const TRACK_URL = "https://api.obstracker.com/api/v1/track/" + TRACKING_ID;

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    navigator.sendBeacon(
      TRACK_URL,
      JSON.stringify({
        pageUrl: window.location.href,
        referrer: document.referrer || null,
        screen: {
          width: screen.width,
          height: screen.height
        }
      })
    );
  }, [location.pathname]); // Trigger on route change
}`}
                                    />
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">Endpoints</h2>
                            <div className="space-y-4">
                                {[
                                    { method: 'GET', path: '/api/v1/projects', desc: 'List all projects' },
                                    { method: 'GET', path: '/api/v1/analytics/projects/:id/overview', desc: 'Get stats for a specific project' },
                                    { method: 'POST', path: '/api/v1/projects', desc: 'Create a new project' },
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
