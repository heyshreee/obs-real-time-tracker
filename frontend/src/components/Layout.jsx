import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Folder,
    CreditCard,
    User,
    LogOut,
    Menu,
    X,
    Loader2,
    Activity,
    Key,
    ChevronDown,
    Globe
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { io } from 'socket.io-client';
import Notifications from './Notifications';

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000')).replace(/\/$/, '');

export default function Layout() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [pinnedProjects, setPinnedProjects] = useState([]);
    const [usageStats, setUsageStats] = useState({
        totalViews: 0,
        monthlyLimit: 10000,
        storageUsed: 0,
        storageLimit: 1024 * 1024 * 1024,
        plan: 'free'
    });
    const location = useLocation();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const socketRef = useRef(null);

    useEffect(() => {
        loadUser();
        loadSidebarData();

        // Socket connection (Skip on Vercel)
        if (!API_URL.includes('vercel.app')) {
            socketRef.current = io(API_URL, {
                withCredentials: true,
                transports: ['websocket', 'polling']
            });

            socketRef.current.on('connect', () => {
                if (user) {
                    socketRef.current.emit('join', `user_${user.id}`);
                }
            });

            socketRef.current.on('usage_update', (data) => {
                setUsageStats(prev => ({
                    ...prev,
                    totalViews: data.totalViews,
                    storageUsed: data.storageUsed,
                    storageLimit: data.storageLimit
                }));
            });

            socketRef.current.on('new_notification', (data) => {
                window.dispatchEvent(new CustomEvent('notification_received', { detail: data }));
            });
        }

        const interval = setInterval(() => loadSidebarData(), 5000); // Poll every 5s

        return () => {
            clearInterval(interval);
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [user?.id]);

    const loadUser = async () => {
        try {
            const userData = await apiRequest('/auth/me');
            setUser(userData);
        } catch (err) {
            navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    const loadSidebarData = async () => {
        try {
            const [projects, usage] = await Promise.all([
                apiRequest('/projects'),
                apiRequest('/usage')
            ]);

            setPinnedProjects(projects.filter(p => p.is_pinned));
            setUsageStats(usage);
        } catch (error) {
            console.error('Failed to load sidebar data', error);
        }
    };

    const handleLogout = async () => {
        try {
            await apiRequest('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout failed', error);
        }
        navigate('/login');
    };

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/dashboard/projects', label: 'Projects', icon: Folder },
        { path: '/dashboard/api-key', label: 'API Keys', icon: Key },
        { path: '/dashboard/billing', label: 'Billing', icon: CreditCard },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    const usagePercentage = Math.min((usageStats.totalViews / usageStats.monthlyLimit) * 100, 100);

    return (
        <div className="h-screen overflow-hidden bg-slate-950 flex font-sans text-slate-200">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/80 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-200 ease-in-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-slate-800">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold mr-3 shadow-lg shadow-blue-500/20">
                        <Activity className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">OBS Tracker</span>
                </div>



                {/* Main Navigation */}
                <div className="px-4 py-2">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Main Menu</h3>
                    <nav className="space-y-0.5">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Pinned Projects */}
                <div className="px-4 py-4 flex-1">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Pinned</h3>
                    <div className="space-y-0.5">
                        {pinnedProjects.length > 0 ? (
                            pinnedProjects.map((project) => (
                                <Link
                                    key={project.id}
                                    to={`/dashboard/projects/${encodeURIComponent(project.name)}`}
                                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800/50 cursor-pointer group transition-colors"
                                >
                                    <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors truncate">{project.name}</span>
                                    <span className={`w-2 h-2 rounded-full bg-green-500`}></span>
                                </Link>
                            ))
                        ) : (
                            <p className="text-xs text-slate-600 px-3 py-2">No pinned projects</p>
                        )}
                    </div>
                </div>

                {/* Bottom Widget: Events Tracked */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-slate-400 uppercase">Events Tracked</span>
                            <span className="text-xs font-bold text-white">{Math.round(usagePercentage)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-3">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                                style={{ width: `${usagePercentage}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500 mb-3">
                            <span>{usageStats.totalViews.toLocaleString()} / {usageStats.monthlyLimit.toLocaleString()} <span className="hidden sm:inline">limit</span></span>
                        </div>

                        {/* Storage Usage */}
                        <div className="mb-3 pt-3 border-t border-slate-700/30">
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[10px] font-semibold text-slate-400 uppercase">Storage Used ({usageStats.plan})</span>
                                <span className="text-[10px] font-bold text-white">
                                    {usageStats.storageUsed < 1024 * 1024
                                        ? `${(usageStats.storageUsed / 1024).toFixed(2)} KB`
                                        : usageStats.storageUsed < 1024 * 1024 * 1024
                                            ? `${(usageStats.storageUsed / (1024 * 1024)).toFixed(2)} MB`
                                            : `${(usageStats.storageUsed / (1024 * 1024 * 1024)).toFixed(2)} GB`
                                    } <span className="text-slate-500 font-normal">/ {usageStats.storageLimit < 1024 * 1024 * 1024 ? `${(usageStats.storageLimit / (1024 * 1024)).toFixed(0)} MB` : `${(usageStats.storageLimit / (1024 * 1024 * 1024)).toFixed(0)} GB`}</span>
                                </span>
                            </div>
                            <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min((usageStats.storageUsed / usageStats.storageLimit) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        <Link to="/dashboard/billing" className="block w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-blue-500/20 text-center">
                            Upgrade Plan
                        </Link>
                    </div>

                    <div className="mt-4 flex items-center justify-between px-2">
                        <Link to="/help" className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
                            <div className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold">?</div>
                            Help & Docs
                        </Link>
                        <button className="text-slate-500 hover:text-slate-300">
                            <span className="sr-only">Collapse</span>
                            <ChevronDown className="h-4 w-4 rotate-90" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar */}
                {/* Topbar */}
                <header className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button
                            className="lg:hidden text-slate-400 hover:text-white"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Notifications */}
                        <Notifications />

                        <div className="h-6 w-px bg-slate-800"></div>

                        {user && (
                            <div className="flex items-center gap-3 pl-2">
                                <div className="text-right hidden sm:block leading-tight">
                                    <div className="text-sm font-bold text-white">{user.email}</div>
                                    <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                                        {user.plan === 'pro' ? 'Enterprise Pro' : 'Free Plan'}
                                    </div>
                                </div>
                                <div className="relative group">
                                    <button className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 border border-slate-500 flex items-center justify-center text-white font-bold overflow-hidden">
                                        <User className="h-5 w-5" />
                                    </button>

                                    {/* Dropdown Menu */}
                                    <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right z-50">
                                        <div className="py-1">
                                            <Link to="/dashboard/profile" className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">Profile Settings</Link>
                                            <Link to="/dashboard/billing" className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">Billing</Link>
                                            <div className="border-t border-slate-800 my-1"></div>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-800 hover:text-red-300"
                                            >
                                                Sign out
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {/* Page Content */}
                < main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8" >
                    <Outlet context={{ user, loadUser, loadSidebarData, usageStats }} />
                </main >
            </div >
        </div >
    );
}
