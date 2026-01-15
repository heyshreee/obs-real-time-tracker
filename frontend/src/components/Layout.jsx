import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Folder, CreditCard, User, LogOut, Menu, X, Loader2 } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { removeToken } from '../utils/auth';
import { useToast } from '../context/ToastContext';

export default function Layout() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { showToast } = useToast();

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const userData = await apiRequest('/auth/me');
            setUser(userData);
        } catch (err) {
            // Silent redirect on auth error
            removeToken();
            navigate('/login');
            if (err.message !== 'Authentication required') {
                showToast('Session expired. Please login again.', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        removeToken();
        navigate('/login');
    };

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/projects', label: 'Projects', icon: Folder },
        { path: '/billing', label: 'Billing', icon: CreditCard },
        { path: '/profile', label: 'Profile', icon: User },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/80 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                <div className="h-16 flex items-center px-6 border-b border-slate-800">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold mr-3">
                        O
                    </div>
                    <span className="text-xl font-bold text-white">OBS Tracker</span>
                </div>

                <nav className="p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                            >
                                <Icon className="h-5 w-5" />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar */}
                <header className="h-16 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button
                            className="lg:hidden text-slate-400 hover:text-white"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        {/* Breadcrumbs or Page Title could go here */}
                    </div>

                    <div className="flex items-center gap-6">
                        {user && (
                            <>
                                <div className="hidden sm:flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${user.plan === 'pro' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                                        }`}>
                                        {user.plan} Plan
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right hidden sm:block">
                                        <div className="text-sm font-medium text-white">{user.email}</div>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                                        title="Logout"
                                    >
                                        <LogOut className="h-5 w-5" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
                    <Outlet context={{ user, loadUser }} />
                </main>
            </div>
        </div>
    );
}
