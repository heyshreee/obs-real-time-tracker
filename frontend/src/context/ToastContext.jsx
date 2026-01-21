import { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/Toast';

const ToastContext = createContext();

export function ToastProvider({ children }) {
    const [toast, setToast] = useState(null);
    const [notificationSpotlight, setNotificationSpotlight] = useState(false);

    const showToast = useCallback((message, type = 'info') => {
        setToast({ message, type });
    }, []);

    const hideToast = useCallback(() => {
        setToast(null);
    }, []);

    const triggerNotificationSpotlight = useCallback((duration = 3000) => {
        setNotificationSpotlight(true);
        setTimeout(() => setNotificationSpotlight(false), duration);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, notificationSpotlight, triggerNotificationSpotlight }}>
            {children}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={hideToast}
                />
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
