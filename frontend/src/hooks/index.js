/**
 * FoodLink Campus - Custom React Hooks
 * Reusable hooks for common functionality
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { foodAPI, notificationAPI } from '../services/api';

/**
 * Hook for fetching and managing food items
 * @param {Object} options - Options for fetching
 * @returns {Object} Food items state and actions
 */
export function useFoodItems(options = {}) {
    const [foods, setFoods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { status = 'available', autoRefresh = false, refreshInterval = 30000 } = options;

    const fetchFoods = useCallback(async () => {
        try {
            setError(null);
            const response = await foodAPI.getAll({ status });
            setFoods(response.data);
        } catch (err) {
            setError(err.message || 'Failed to fetch food items');
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        fetchFoods();

        if (autoRefresh) {
            const interval = setInterval(fetchFoods, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [fetchFoods, autoRefresh, refreshInterval]);

    const refresh = useCallback(() => {
        setLoading(true);
        fetchFoods();
    }, [fetchFoods]);

    return { foods, loading, error, refresh, setFoods };
}

/**
 * Hook for managing notifications
 * @returns {Object} Notifications state and actions
 */
export function useNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await notificationAPI.getAll();
            setNotifications(response.data);
            setUnreadCount(response.data.filter(n => !n.is_read).length);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const markAsRead = useCallback(async (id) => {
        try {
            await notificationAPI.markRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            await notificationAPI.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    }, []);

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        refresh: fetchNotifications,
    };
}

/**
 * Hook for handling window resize
 * @returns {Object} Window dimensions and device type
 */
export function useWindowSize() {
    const [size, setSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    useEffect(() => {
        const handleResize = () => {
            setSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return {
        ...size,
        isMobile: size.width < 768,
        isTablet: size.width >= 768 && size.width < 1024,
        isDesktop: size.width >= 1024,
    };
}

/**
 * Hook for debounced values
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in ms
 * @returns {any} Debounced value
 */
export function useDebounce(value, delay = 300) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Hook for local storage state
 * @param {string} key - Storage key
 * @param {any} initialValue - Initial value
 * @returns {Array} [value, setValue] tuple
 */
export function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch {
            return initialValue;
        }
    });

    const setValue = useCallback((value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error('useLocalStorage error:', error);
        }
    }, [key, storedValue]);

    return [storedValue, setValue];
}

/**
 * Hook for handling click outside an element
 * @param {Function} handler - Handler function
 * @returns {Object} Ref to attach to element
 */
export function useClickOutside(handler) {
    const ref = useRef(null);

    useEffect(() => {
        const listener = (event) => {
            if (!ref.current || ref.current.contains(event.target)) {
                return;
            }
            handler(event);
        };

        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);

        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [handler]);

    return ref;
}

/**
 * Hook for countdown timer
 * @param {Date|string} targetDate - Target end date
 * @returns {Object} Time remaining
 */
export function useCountdown(targetDate) {
    const [countdown, setCountdown] = useState({
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: false,
    });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = new Date(targetDate) - new Date();

            if (difference <= 0) {
                setCountdown({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
                return;
            }

            setCountdown({
                hours: Math.floor(difference / (1000 * 60 * 60)),
                minutes: Math.floor((difference / (1000 * 60)) % 60),
                seconds: Math.floor((difference / 1000) % 60),
                isExpired: false,
            });
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    return countdown;
}

/**
 * Hook for async operations with loading/error states
 * @param {Function} asyncFn - Async function to execute
 * @returns {Object} Execute function and state
 */
export function useAsync(asyncFn) {
    const [state, setState] = useState({
        data: null,
        loading: false,
        error: null,
    });

    const execute = useCallback(async (...args) => {
        setState({ data: null, loading: true, error: null });

        try {
            const data = await asyncFn(...args);
            setState({ data, loading: false, error: null });
            return { success: true, data };
        } catch (error) {
            setState({ data: null, loading: false, error });
            return { success: false, error };
        }
    }, [asyncFn]);

    return { ...state, execute };
}
