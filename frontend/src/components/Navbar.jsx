import { Link, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard } from 'lucide-react';
import { removeToken } from '../utils/auth';

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  return (
    <nav className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
              O
            </div>
            <Link to="/dashboard" className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              OBS Tracker
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {token ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
                >
                  Home
                </Link>
                <Link
                  to="/projects"
                  className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
                >
                  Projects
                </Link>
                <Link
                  to="/billing"
                  className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
                >
                  Billing
                </Link>
                <Link
                  to="/profile"
                  className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors ml-4"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-400 hover:text-white transition-colors">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
