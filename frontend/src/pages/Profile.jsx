import { useOutletContext } from 'react-router-dom';
import { Mail, Calendar, Shield, LogOut } from 'lucide-react';
import { removeToken } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
    const { user } = useOutletContext();
    const navigate = useNavigate();

    const handleLogout = () => {
        removeToken();
        navigate('/login');
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-8">Profile</h1>

            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 max-w-2xl">
                <div className="space-y-6">

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
                        <div className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg text-white">
                            <Mail className="h-5 w-5 text-slate-500" />
                            {user.email}
                        </div>
                    </div>

                    {/* Plan */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Current Plan</label>
                        <div className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg text-white">
                            <Shield className="h-5 w-5 text-slate-500" />
                            <span className="capitalize">{user.plan} Plan</span>
                        </div>
                    </div>

                    {/* Created Date - Mocking since we might not have it in /me yet, or we can add it */}
                    {/* Assuming user object has created_at or we skip it for now if not available */}
                    {/* Let's skip created_at if not in user object to avoid errors, or show N/A */}

                    <div className="pt-6 border-t border-slate-800">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
                        >
                            <LogOut className="h-5 w-5" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
