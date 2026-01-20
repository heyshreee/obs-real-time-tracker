import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Trash2, Info, AlertTriangle, CheckCircle, AlertCircle, Shield, Activity, Settings, ChevronRight } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { useToast } from '../context/ToastContext';

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [activeTab, setActiveTab] = useState('all');
    const dropdownRef = useRef(null);
    const { showToast, notificationSpotlight } = useToast();

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const loadNotifications = async () => {
        try {
            const data = await apiRequest('/notifications');
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        } catch (err) {
            console.error('Failed to load notifications:', err);
        }
    };

    const markAsRead = async (id) => {
        try {
            await apiRequest(`/notifications/${id}/read`, { method: 'PUT' });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            showToast('Failed to mark as read', 'error');
        }
    };

    const markAllAsRead = async () => {
        try {
            await apiRequest('/notifications/read-all', { method: 'PUT' });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
            showToast('All notifications marked as read', 'success');
        } catch (err) {
            showToast('Failed to mark all as read', 'error');
        }
    };

    const deleteNotification = async (id, e) => {
        e.stopPropagation();
        try {
            await apiRequest(`/notifications/${id}`, { method: 'DELETE' });
            setNotifications(prev => prev.filter(n => n.id !== id));
            const notification = notifications.find(n => n.id === id);
            if (notification && !notification.is_read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            showToast('Failed to delete notification', 'error');
        }
    };

    const clearAll = async () => {
        // Since we don't have a clear-all endpoint, we'll just mark all as read for now or implement it if needed.
        // But the user asked for "Clear All" which usually means delete.
        // Let's iterate and delete or add a backend endpoint. 
        // For efficiency, let's assume we just clear the list locally and maybe call delete on each (bad) or add a new endpoint.
        // I'll add a new endpoint call but since I can't modify backend easily right now without context switch, 
        // I'll just iterate for now or better, just mark all read as "Clear" usually means "Dismiss" in some contexts, 
        // but "Delete" in others. The screenshot says "Clear All" with a trash icon usually.
        // Let's implement a loop for now as a fallback, or just mark all read if "Clear" means "Mark Read".
        // Wait, the screenshot has "Mark All Read" AND "Clear All". So Clear All = Delete All.
        // I will implement a loop for now to be safe without backend changes, or just show a toast "Not implemented" if too risky.
        // Actually, I can just filter out the deleted ones locally and send requests in background.

        if (!confirm('Are you sure you want to delete all notifications?')) return;

        const ids = notifications.map(n => n.id);
        try {
            // Ideally: await apiRequest('/notifications/clear', { method: 'DELETE' });
            // Fallback:
            await Promise.all(ids.map(id => apiRequest(`/notifications/${id}`, { method: 'DELETE' })));
            setNotifications([]);
            setUnreadCount(0);
            showToast('All notifications cleared', 'success');
        } catch (err) {
            showToast('Failed to clear notifications', 'error');
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle className="h-5 w-5 text-green-400" />;
            case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
            case 'error': return <AlertCircle className="h-5 w-5 text-red-400" />;
            case 'security': return <Shield className="h-5 w-5 text-orange-400" />;
            case 'activity': return <Activity className="h-5 w-5 text-blue-400" />;
            case 'system': return <Settings className="h-5 w-5 text-purple-400" />;
            default: return <Info className="h-5 w-5 text-slate-400" />;
        }
    };

    const getFilteredNotifications = () => {
        if (activeTab === 'all') return notifications;
        return notifications.filter(n => n.type === activeTab);
    };

    const filteredNotifications = getFilteredNotifications();

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Spotlight Overlay */}
            {notificationSpotlight && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-all duration-500 animate-in fade-in" />
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 rounded-full transition-all duration-200 
                    ${isOpen ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}
                    ${notificationSpotlight ? 'z-50 bg-slate-800 text-white ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-950 animate-pulse' : ''}
                `}
            >
                <Bell className={`h-5 w-5 ${notificationSpotlight ? 'animate-bounce' : ''}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-slate-950 animate-pulse" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-4 w-[400px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden ring-1 ring-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="p-5 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <h3 className="font-bold text-white text-lg">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">
                                        {unreadCount} NEW
                                    </span>
                                )}
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <p className="text-xs text-slate-500">Manage your platform alerts</p>

                        {/* Tabs */}
                        <div className="flex items-center gap-2 mt-4 overflow-x-auto no-scrollbar">
                            {['all', 'system', 'security', 'activity'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize whitespace-nowrap ${activeTab === tab
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="px-5 py-2 bg-slate-800/30 border-b border-slate-800 flex items-center justify-between">
                        <button
                            onClick={markAllAsRead}
                            className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 uppercase tracking-wider transition-colors"
                        >
                            <Check className="h-3 w-3" /> Mark all read
                        </button>
                        <button
                            onClick={clearAll}
                            className="text-[10px] font-bold text-slate-500 hover:text-red-400 flex items-center gap-1.5 uppercase tracking-wider transition-colors"
                        >
                            <Trash2 className="h-3 w-3" /> Clear all
                        </button>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar bg-slate-900">
                        {filteredNotifications.length > 0 ? (
                            <div className="divide-y divide-slate-800/50">
                                {filteredNotifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => !notification.is_read && markAsRead(notification.id)}
                                        className={`p-5 hover:bg-slate-800/50 transition-all cursor-pointer group relative ${!notification.is_read ? 'bg-slate-800/20' : ''}`}
                                    >
                                        <div className="flex gap-4">
                                            <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${!notification.is_read ? 'bg-slate-800 ring-1 ring-white/10' : 'bg-slate-800/50'}`}>
                                                {getIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2 mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${notification.type === 'security' ? 'text-orange-400' :
                                                            notification.type === 'system' ? 'text-purple-400' :
                                                                notification.type === 'error' ? 'text-red-400' :
                                                                    'text-blue-400'
                                                            }`}>
                                                            {notification.type}
                                                        </span>
                                                        {!notification.is_read && (
                                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-slate-500 whitespace-nowrap">
                                                        {getTimeAgo(new Date(notification.created_at))}
                                                    </span>
                                                </div>
                                                <h4 className={`text-sm font-bold mb-1 ${!notification.is_read ? 'text-white' : 'text-slate-300'}`}>
                                                    {notification.title}
                                                </h4>
                                                <p className="text-xs text-slate-400 leading-relaxed">
                                                    {notification.message}
                                                </p>

                                                {/* Action Link (Example) */}
                                                {notification.type === 'usage' && (
                                                    <button className="mt-3 text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                                        Upgrade Now <ChevronRight className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Delete button (visible on hover) */}
                                        <button
                                            onClick={(e) => deleteNotification(notification.id, e)}
                                            className="absolute top-4 right-4 p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                            title="Delete"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 px-8 text-center">
                                <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Bell className="h-8 w-8 text-slate-600" />
                                </div>
                                <h4 className="text-sm font-bold text-white mb-1">No notifications</h4>
                                <p className="text-xs text-slate-500">You're all caught up! Check back later for updates.</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-slate-800 bg-slate-900/50 backdrop-blur-xl">
                        <button className="w-full py-2 rounded-lg border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center gap-2">
                            See Notification History <ChevronRight className="h-3 w-3" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " mins ago";
    return "Just now";
}
