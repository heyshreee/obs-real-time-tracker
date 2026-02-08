import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Legal({ type }) {
    const content = {
        privacy: {
            title: "Privacy Policy",
            lastUpdated: "January 14, 2026",
            body: (
                <>
                    <p>At WebPluse Analytics, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information.</p>
                    <h3>1. Information We Collect</h3>
                    <p>We collect information you provide directly to us, such as when you create an account, subscribe to our newsletter, or contact customer support.</p>
                    <h3>2. How We Use Your Information</h3>
                    <p>We use the information we collect to provide, maintain, and improve our services, to develop new ones, and to protect WebPluse Analytics and our users.</p>
                </>
            )
        },
        terms: {
            title: "Terms of Service",
            lastUpdated: "January 14, 2026",
            body: (
                <>
                    <p>By accessing or using WebPluse Analytics, you agree to be bound by these Terms of Service.</p>
                    <h3>1. Use of Service</h3>
                    <p>You must follow any policies made available to you within the Services. You may not misuse our Services.</p>
                    <h3>2. Account Responsibilities</h3>
                    <p>You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.</p>
                    <h3>3. Termination</h3>
                    <p>We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever.</p>
                </>
            )
        },
        cookies: {
            title: "Cookie Policy",
            lastUpdated: "January 14, 2026",
            body: (
                <>
                    <p>WebPluse Analytics uses cookies to improve your experience on our website.</p>
                    <h3>1. What are cookies?</h3>
                    <p>Cookies are small text files that are placed on your computer by websites that you visit.</p>
                    <h3>2. How we use cookies</h3>
                    <p>We use cookies to understand how you use our site and to improve your experience. This includes personalizing content and ads.</p>
                </>
            )
        }
    };

    const data = content[type] || content.privacy;

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
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-12">
                        <h1 className="text-4xl font-bold text-white mb-4">{data.title}</h1>
                        <p className="text-slate-500">Last updated: {data.lastUpdated}</p>
                    </div>

                    <div className="prose prose-invert prose-blue max-w-none">
                        {data.body}
                    </div>
                </div>
            </main>

            <footer className="border-t border-white/5 py-12 bg-[#0B0E14] text-center">
                <p className="text-slate-600 text-sm">© 2026 WebPluse Analytics Inc. All rights reserved.</p>
            </footer>
        </div>
    );
}
