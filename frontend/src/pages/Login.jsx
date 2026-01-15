import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, Moon } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { setToken } from '../utils/auth';
import { useToast } from '../context/ToastContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = await apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            setToken(data.token);
            showToast('Welcome back!', 'success');
            navigate('/dashboard');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
            {/* Header */}
            <header className="w-full max-w-7xl mx-auto p-6 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                        O
                    </div>
                    <span className="text-xl font-bold text-white">OBS Tracker</span>
                </Link>
                <button className="p-2 rounded-full hover:bg-slate-800 transition-colors text-slate-400 hover:text-white">
                    <Moon size={20} />
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Tabs */}
                    <div className="flex w-full bg-slate-900/50 p-1 rounded-xl mb-6 border border-slate-800">
                        <button className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm transition-all">
                            Login
                        </button>
                        <Link to="/register" className="flex-1 py-2 text-sm font-medium text-slate-400 hover:text-white text-center transition-all">
                            Register
                        </Link>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl"
                    >
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">
                                Welcome Back
                            </h2>
                            <p className="text-slate-400 text-sm">Please enter your details to access your dashboard.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                            placeholder="name@company.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="block text-sm font-medium text-slate-300">Password</label>
                                        <a href="#" className="text-xs text-blue-500 hover:text-blue-400 transition-colors">Forgot password?</a>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    'Sign In'
                                )}
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-800"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-slate-900 px-2 text-slate-500">Or continue with</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="w-full bg-slate-950/50 hover:bg-slate-900 border border-slate-800 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Google
                            </button>
                        </form>
                    </motion.div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full max-w-7xl mx-auto p-6 text-center text-slate-500 text-sm">
                <p className="mb-2">
                    By continuing, you agree to our <Link to="/terms" className="text-blue-500 hover:text-blue-400">Terms of Service</Link> and <Link to="/privacy" className="text-blue-500 hover:text-blue-400">Privacy Policy</Link>.
                </p>
                <p>© 2024 OBS Tracker. All rights reserved.</p>
            </footer>
        </div>
    );
}
