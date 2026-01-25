import { useState, useEffect } from 'react';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Shield, Bell, BarChart2, Briefcase,
    Save, Loader, Upload, Trash2, Monitor, Smartphone, Globe,
    Check, AlertTriangle, LogOut, Settings as SettingsIcon, Edit2
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/Spinner';

export default function Settings() {
    const { user, loadUser } = useOutletContext();
    const { tab } = useParams();
    const navigate = useNavigate();
    const activeTab = tab || 'profile';
    const { showToast } = useToast();

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'usage', label: 'Usage & Quota', icon: BarChart2 },
        { id: 'projects', label: 'Projects & Teams', icon: Briefcase },
    ];

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Sidebar */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-4 sticky top-24">
                        <h2 className="text-lg font-bold text-white mb-4 px-4">Settings</h2>
                        <nav className="space-y-1">
                            {tabs.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => navigate(`/dashboard/settings/${t.id}`)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === t.id
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                        }`}
                                >
                                    <t.icon className="h-4 w-4" />
                                    {t.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'profile' && <ProfileSection user={user} loadUser={loadUser} showToast={showToast} />}
                            {activeTab === 'security' && <SecuritySection user={user} showToast={showToast} />}
                            {activeTab === 'notifications' && <NotificationsSection user={user} showToast={showToast} />}
                            {activeTab === 'usage' && <UsageSection user={user} />}
                            {activeTab === 'projects' && <ProjectsSection user={user} />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

function ProfileSection({ user, loadUser, showToast }) {
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        bio: user?.bio || '',
        timezone: user?.timezone || 'UTC',
        language: user?.language || 'en-US',
        job_title: user?.job_title || ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiRequest('/user/profile', {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
            await loadUser();
            showToast('Profile updated successfully', 'success');
            setIsEditing(false);
        } catch (error) {
            showToast('Failed to update profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-8">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-white">Profile Information</h3>
                        <p className="text-sm text-slate-500 mt-1">Update your profile basics.</p>
                    </div>
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors flex items-center gap-2 ${isEditing
                            ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                            : 'bg-blue-600 hover:bg-blue-500 text-white border-transparent'
                            }`}
                    >
                        {isEditing ? (
                            <>Cancel</>
                        ) : (
                            <>
                                <Edit2 className="h-4 w-4" />
                                Edit
                            </>
                        )}
                    </button>
                </div>

                <div className="flex items-center gap-6 mb-8">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-blue-600/20">
                        {user?.avatar_url ? (
                            <img src={user.avatar_url} alt={user.name} className="h-full w-full rounded-full object-cover" />
                        ) : (
                            (user?.name?.[0] || user?.email?.[0] || '?').toUpperCase()
                        )}
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-white mb-1">Profile Picture</h4>
                        <p className="text-sm text-slate-400 mb-4">JPG, GIF or PNG. Max size 800K</p>
                        <div className="flex gap-3">
                            <button
                                disabled={!isEditing}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Upload className="h-4 w-4" />
                                Upload New
                            </button>
                            <button
                                disabled={!isEditing}
                                className="px-4 py-2 bg-slate-800/50 hover:bg-red-500/10 text-slate-400 hover:text-red-500 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Trash2 className="h-4 w-4" />
                                Remove
                            </button>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    disabled={!isEditing}
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                {isEditing && <Edit2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Job Title</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    disabled={!isEditing}
                                    value={formData.job_title}
                                    onChange={e => setFormData({ ...formData, job_title: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
                                    placeholder="e.g. Senior Developer"
                                />
                                {isEditing && <Edit2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Bio</label>
                        <div className="relative">
                            <textarea
                                value={formData.bio}
                                disabled={!isEditing}
                                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                rows={4}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder="Tell us a little about yourself..."
                            />
                            {isEditing && <Edit2 className="absolute right-3 top-4 h-4 w-4 text-slate-600 pointer-events-none" />}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Language</label>
                            <select
                                value={formData.language}
                                disabled={!isEditing}
                                onChange={e => setFormData({ ...formData, language: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="en-US">English (US)</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                                <option value="de">German</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Timezone</label>
                            <select
                                value={formData.timezone}
                                disabled={!isEditing}
                                onChange={e => setFormData({ ...formData, timezone: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="UTC">UTC</option>
                                <option value="EST">Eastern Standard Time (EST)</option>
                                <option value="PST">Pacific Standard Time (PST)</option>
                                <option value="IST">India Standard Time (IST)</option>
                            </select>
                        </div>
                    </div>

                    {isEditing && (
                        <div className="flex justify-end pt-4 border-t border-slate-800/50">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Save Changes
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

function SecuritySection({ user, showToast }) {
    const [loading, setLoading] = useState(false);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            const data = await apiRequest('/user/sessions');
            setSessions(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingSessions(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            showToast('New passwords do not match', 'error');
            return;
        }
        setLoading(true);
        try {
            await apiRequest('/user/password', {
                method: 'PUT',
                body: JSON.stringify({
                    currentPassword: passwords.current,
                    newPassword: passwords.new
                })
            });
            showToast('Password updated successfully', 'success');
            setPasswords({ current: '', new: '', confirm: '' });
            setIsEditing(false);
        } catch (error) {
            showToast(error.message || 'Failed to update password', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loadingSessions) return <Spinner />;

    return (
        <div className="space-y-6">
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-8">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-bold text-white">Change Password</h3>
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors flex items-center gap-2 ${isEditing
                            ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                            : 'bg-blue-600 hover:bg-blue-500 text-white border-transparent'
                            }`}
                    >
                        {isEditing ? 'Cancel' : (
                            <>
                                <Edit2 className="h-4 w-4" />
                                Edit
                            </>
                        )}
                    </button>
                </div>
                <form onSubmit={handlePasswordUpdate} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Current Password</label>
                        <input
                            type="password"
                            disabled={!isEditing}
                            value={passwords.current}
                            onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">New Password</label>
                            <input
                                type="password"
                                disabled={!isEditing}
                                value={passwords.new}
                                onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Confirm New Password</label>
                            <input
                                type="password"
                                disabled={!isEditing}
                                value={passwords.confirm}
                                onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>
                    {isEditing && (
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Update Password
                            </button>
                        </div>
                    )}
                </form>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-white mb-6">Active Sessions</h3>
                <div className="space-y-4">
                    {sessions.map((session, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-900 rounded-lg text-slate-400">
                                    {session.device?.includes('Mobile') ? <Smartphone className="h-6 w-6" /> : <Monitor className="h-6 w-6" />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{session.device || 'Unknown Device'}</p>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                        <span>{session.location}</span>
                                        <span>•</span>
                                        <span>{new Date(session.lastActive).toLocaleDateString()}</span>
                                        {session.isCurrent && (
                                            <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full font-bold uppercase tracking-wider text-[10px]">Current</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {!session.isCurrent && (
                                <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                                    <LogOut className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function NotificationsSection({ user, showToast }) {
    const [isEditing, setIsEditing] = useState(false);
    const [preferences, setPreferences] = useState(user?.notification_preferences || {
        email: true,
        browser: true,
        security: true,
        marketing: false
    });

    const handleToggle = async (key) => {
        if (!isEditing) return;
        const newPrefs = { ...preferences, [key]: !preferences[key] };
        setPreferences(newPrefs);
        try {
            await apiRequest('/user/notifications', {
                method: 'PUT',
                body: JSON.stringify({ preferences: newPrefs })
            });
        } catch (error) {
            showToast('Failed to update preferences', 'error');
            setPreferences(preferences); // Revert
        }
    };

    return (
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-8">
            <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-white">Notification Preferences</h3>
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors flex items-center gap-2 ${isEditing
                        ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                        : 'bg-blue-600 hover:bg-blue-500 text-white border-transparent'
                        }`}
                >
                    {isEditing ? 'Done' : (
                        <>
                            <Edit2 className="h-4 w-4" />
                            Edit
                        </>
                    )}
                </button>
            </div>
            <div className="space-y-6">
                {[
                    { id: 'email', label: 'Email Notifications', desc: 'Receive daily summaries and critical alerts via email.' },
                    { id: 'browser', label: 'Browser Push Notifications', desc: 'Get real-time updates when you are online.' },
                    { id: 'security', label: 'Security Alerts', desc: 'Get notified about new logins and password changes.' },
                    { id: 'marketing', label: 'Product Updates', desc: 'Receive news about new features and improvements.' }
                ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                        <div>
                            <p className="text-sm font-bold text-white">{item.label}</p>
                            <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                        </div>
                        <button
                            onClick={() => handleToggle(item.id)}
                            disabled={!isEditing}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${preferences[item.id] ? 'bg-blue-600' : 'bg-slate-700'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences[item.id] ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function UsageSection({ user }) {
    const [usage, setUsage] = useState(null);

    useEffect(() => {
        apiRequest('/usage').then(setUsage).catch(console.error);
    }, []);

    if (!usage) return <Spinner />;

    const getPercentage = (used, limit) => Math.min((used / limit) * 100, 100);

    return (
        <div className="space-y-6">
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-8">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold text-white">Usage & Quota</h3>
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-full uppercase tracking-wider border border-blue-500/20">
                        {usage.plan} Plan
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-6">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <p className="text-sm font-medium text-slate-400">Monthly Views</p>
                                <p className="text-2xl font-bold text-white mt-1">{usage.totalViews.toLocaleString()}</p>
                            </div>
                            <p className="text-xs text-slate-500">Limit: {usage.monthlyLimit.toLocaleString()}</p>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${getPercentage(usage.totalViews, usage.monthlyLimit)}%` }}
                            />
                        </div>
                    </div>

                    <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-6">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <p className="text-sm font-medium text-slate-400">Storage Used</p>
                                <p className="text-2xl font-bold text-white mt-1">{(usage.storageUsed / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <p className="text-xs text-slate-500">Limit: {(usage.storageLimit / 1024 / 1024 / 1024).toFixed(1)} GB</p>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                                style={{ width: `${getPercentage(usage.storageUsed, usage.storageLimit)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProjectsSection({ user }) {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        apiRequest('/projects')
            .then(setProjects)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Spinner />;

    return (
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-8">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white">Projects & Teams</h3>
                    <p className="text-sm text-slate-500 mt-1">Manage your projects and team members.</p>
                </div>
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors flex items-center gap-2 ${isEditing
                        ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                        : 'bg-blue-600 hover:bg-blue-500 text-white border-transparent'
                        }`}
                >
                    {isEditing ? 'Done' : (
                        <>
                            <SettingsIcon className="h-4 w-4" />
                            Edit
                        </>
                    )}
                </button>
            </div>

            <div className="space-y-4">
                {projects.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        No projects found. Create one to get started.
                    </div>
                ) : (
                    projects.map((project) => (
                        <div key={project.id} className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-xl group hover:border-slate-700 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-slate-400 font-bold border border-slate-700">
                                    {project.name[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{project.name}</p>
                                    <p className="text-xs text-slate-500">{project.domain}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="px-2 py-1 bg-slate-800 text-slate-400 text-xs font-bold rounded uppercase tracking-wider">
                                    Owner
                                </span>
                                <button
                                    disabled={!isEditing}
                                    className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
