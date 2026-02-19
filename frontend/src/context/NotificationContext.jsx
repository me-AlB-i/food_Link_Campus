/**
 * FoodLink Campus - Notification Context
 * Manages toast notifications and alerts
 */
import { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const NotificationContext = createContext(null);

// Notification types and their styles
const notificationStyles = {
    success: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        icon: CheckCircle,
        iconColor: 'text-green-500',
    },
    error: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        icon: AlertCircle,
        iconColor: 'text-red-500',
    },
    warning: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-800',
        icon: AlertTriangle,
        iconColor: 'text-amber-500',
    },
    info: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        icon: Info,
        iconColor: 'text-blue-500',
    },
};

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);

    // Add a notification
    const addNotification = useCallback((message, type = 'info', duration = 5000) => {
        const id = Date.now() + Math.random();

        const notification = {
            id,
            message,
            type,
            createdAt: Date.now(),
        };

        setNotifications((prev) => [...prev, notification]);

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }

        return id;
    }, []);

    // Remove a notification
    const removeNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    // Convenience methods
    const success = useCallback((message, duration) =>
        addNotification(message, 'success', duration), [addNotification]);

    const error = useCallback((message, duration) =>
        addNotification(message, 'error', duration), [addNotification]);

    const warning = useCallback((message, duration) =>
        addNotification(message, 'warning', duration), [addNotification]);

    const info = useCallback((message, duration) =>
        addNotification(message, 'info', duration), [addNotification]);

    // Clear all notifications
    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    const value = {
        notifications,
        addNotification,
        removeNotification,
        success,
        error,
        warning,
        info,
        clearAll,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}

            {/* Notification Container */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 w-full max-w-sm">
                {notifications.map((notification) => {
                    const styles = notificationStyles[notification.type];
                    const Icon = styles.icon;

                    return (
                        <div
                            key={notification.id}
                            className={`
                ${styles.bg} ${styles.border} ${styles.text}
                border rounded-xl p-4 shadow-lg
                flex items-start gap-3
                animate-slide-up
              `}
                        >
                            <Icon className={`w-5 h-5 ${styles.iconColor} flex-shrink-0 mt-0.5`} />

                            <p className="flex-1 text-sm font-medium">
                                {notification.message}
                            </p>

                            <button
                                onClick={() => removeNotification(notification.id)}
                                className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}

export default NotificationContext;
