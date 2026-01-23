import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Mail, Shield, LogOut, User, Globe, Building, Briefcase, Camera, Lock } from 'lucide-react';
import { removeToken } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

export default function Profile() {
    const { user } = useOutletContext();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        fullName: user?.name || 'Rishi Sharma',
        email: user?.email || 'rishi@gmail.com',
        username: 'rishisharma',
        timezone: 'Asia/Kolkata',
        jobTitle: '',
        organization: '',
        language: 'en-US'
    });

    const handleLogout = () => {
        removeToken();
        navigate('/login');
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            showToast('Profile updated successfully', 'success');
        } catch (error) {
            showToast('Failed to update profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <User className="h-6 w-6 text-blue-500" />
                    Profile Settings
                </h1>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-full border border-blue-500/20 uppercase tracking-wider">
                        {user?.plan || 'Free'} Plan
                    </span>
                    <span className="text-slate-500 text-sm">{user?.email}</span>
                </div>
            </div>

            {/* Profile Header Card */}
            <div className="bg-[#0B0E14] border border-slate-800 rounded-2xl p-8 mb-8 flex items-center gap-8">
                <div className="relative group">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-1">
                        <div className="w-full h-full rounded-xl bg-slate-900 overflow-hidden">
                            <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                    <button className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-500 transition-colors">
                        <Camera className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex-1">
                    <h2 className="text-3xl font-bold text-white mb-2">{formData.fullName}</h2>
                    <p className="text-slate-400 max-w-lg">
                        Account holder since Jan 2024. Manage your personal identity, security protocols, and platform preferences.
                    </p>
                </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-8">
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-blue-500/10 rounded-lg">
                            <User className="h-4 w-4 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">Personal Information</h3>
                    </div>

                    <div className="bg-[#0B0E14] border border-slate-800 rounded-2xl p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#151921] border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    Email Address
                                    <Lock className="h-3 w-3" />
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    disabled
                                    className="w-full px-4 py-3 bg-[#151921]/50 border border-slate-800 rounded-xl text-slate-400 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    Username
                                    <Lock className="h-3 w-3" />
                                </label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    disabled
                                    className="w-full px-4 py-3 bg-[#151921]/50 border border-slate-800 rounded-xl text-slate-400 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Timezone</label>
                                <div className="relative">
                                    <select
                                        value={formData.timezone}
                                        onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                                        className="w-full px-4 py-3 bg-[#151921] border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all appearance-none"
                                    >
                                        <option value="Asia/Kolkata">(GMT+05:30) India Standard Time</option>
                                        <option value="UTC">(GMT+00:00) UTC</option>
                                        <option value="America/New_York">(GMT-04:00) Eastern Time</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                        <Globe className="h-4 w-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Account Details */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-blue-500/10 rounded-lg">
                            <Briefcase className="h-4 w-4 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">Account Details</h3>
                    </div>

                    <div className="bg-[#0B0E14] border border-slate-800 rounded-2xl p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Job Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Senior Project Manager"
                                    value={formData.jobTitle}
                                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#151921] border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Organization</label>
                                <input
                                    type="text"
                                    placeholder="Company Name"
                                    value={formData.organization}
                                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#151921] border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Language Preference</label>
                                <div className="relative">
                                    <select
                                        value={formData.language}
                                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                        className="w-full px-4 py-3 bg-[#151921] border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all appearance-none"
                                    >
                                        <option value="en-US">English (US)</option>
                                        <option value="es">Spanish</option>
                                        <option value="fr">French</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                        <Globe className="h-4 w-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="px-6 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl font-medium transition-colors flex items-center gap-2"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Saving...' : 'Save Information'}
                    </button>
                </div>
            </div>
        </div>
    );
}
