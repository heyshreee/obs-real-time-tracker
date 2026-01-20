import { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X, Shield, Activity, Settings } from 'lucide-react';

const variants = {
    success: {
        icon: CheckCircle,
        bg: 'bg-slate-900/90',
        border: 'border-green-500/20',
        iconBg: 'bg-green-500/20',
        iconColor: 'text-green-400',
        title: 'Success',
        glow: 'shadow-[0_0_30px_-10px_rgba(74,222,128,0.3)]'
    },
    error: {
        icon: XCircle,
        bg: 'bg-slate-900/90',
        border: 'border-red-500/20',
        iconBg: 'bg-red-500/20',
        iconColor: 'text-red-400',
        title: 'Error',
        glow: 'shadow-[0_0_30px_-10px_rgba(248,113,113,0.3)]'
    },
    warning: {
        icon: AlertTriangle,
        bg: 'bg-slate-900/90',
        border: 'border-yellow-500/20',
        iconBg: 'bg-yellow-500/20',
        iconColor: 'text-yellow-400',
        title: 'Warning',
        glow: 'shadow-[0_0_30px_-10px_rgba(250,204,21,0.3)]'
    },
    info: {
        icon: Info,
        bg: 'bg-slate-900/90',
        border: 'border-blue-500/20',
        iconBg: 'bg-blue-500/20',
        iconColor: 'text-blue-400',
        title: 'Info',
        glow: 'shadow-[0_0_30px_-10px_rgba(96,165,250,0.3)]'
    },
    security: {
        icon: Shield,
        bg: 'bg-slate-900/90',
        border: 'border-orange-500/20',
        iconBg: 'bg-orange-500/20',
        iconColor: 'text-orange-400',
        title: 'Security Alert',
        glow: 'shadow-[0_0_30px_-10px_rgba(251,146,60,0.3)]'
    },
    system: {
        icon: Activity,
        bg: 'bg-slate-900/90',
        border: 'border-purple-500/20',
        iconBg: 'bg-purple-500/20',
        iconColor: 'text-purple-400',
        title: 'System Update',
        glow: 'shadow-[0_0_30px_-10px_rgba(192,132,252,0.3)]'
    }
};

export default function Toast({ message, type = 'info', onClose, duration = 5000 }) {
    const [isVisible, setIsVisible] = useState(false);
    const variant = variants[type] || variants.info;
    const Icon = variant.icon;

    useEffect(() => {
        setIsVisible(true);
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for exit animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className={`fixed bottom-6 right-6 z-[100] transition-all duration-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className={`
                relative overflow-hidden
                flex items-center gap-4 p-4 pr-12
                min-w-[320px] max-w-md
                rounded-2xl backdrop-blur-xl
                border ${variant.border}
                ${variant.bg}
                ${variant.glow}
            `}>
                {/* Icon */}
                <div className={`p-2 rounded-xl ${variant.iconBg} ${variant.iconColor}`}>
                    <Icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1">
                    <h4 className={`text-sm font-bold ${variant.iconColor} mb-0.5`}>
                        {variant.title}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        {message}
                    </p>
                </div>

                {/* Close Button */}
                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>

                {/* Progress Bar (Optional visual flair) */}
                <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full opacity-50" />
            </div>
        </div>
    );
}
