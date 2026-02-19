/**
 * FoodLink Campus - Navbar Component
 * Role-aware navigation with notifications and theme toggle
 */
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { notificationAPI } from '../../services/api';
import {
    Leaf, Bell, User, LogOut, Menu, X, Sun, Moon,
    Home, PlusCircle, ShoppingBag, Trophy, MapPin, BarChart3, Users, Gift, Headphones,
    ShoppingCart
} from 'lucide-react';
import SupportChatWidget from './SupportChatWidget';

const roleNavItems = {
    student: [
        { path: '/student', icon: Home, label: 'Feed' },
        { path: '/student/reservations', icon: ShoppingBag, label: 'My Reservations' },
        { path: '/student/leaderboard', icon: Trophy, label: 'Leaderboard' },
        { path: '/student/rewards', icon: Gift, label: 'Rewards' },
    ],
    staff: [
        { path: '/staff', icon: Home, label: 'Dashboard' },
        { path: '/staff/add', icon: PlusCircle, label: 'List Food' },
        { path: '/staff/listings', icon: ShoppingBag, label: 'My Listings' },
    ],
    charity: [
        { path: '/charity', icon: Home, label: 'Dashboard' },
        { path: '/charity/pickups', icon: MapPin, label: 'Pickups' },
        { path: '/charity/routes', icon: MapPin, label: 'Routes' },
    ],
    admin: [
        { path: '/admin', icon: Home, label: 'Dashboard' },
        { path: '/admin/users', icon: Users, label: 'Users' },
        { path: '/admin/reports', icon: BarChart3, label: 'Reports' },
        { path: '/admin/support', icon: Headphones, label: 'Support' },
    ],
};

const roleColors = {
    student: 'student',
    staff: 'staff',
    charity: 'charity',
    admin: 'surface',
};

export default function Navbar() {
    const { user, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const location = useLocation();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const [showNotifications, setShowNotifications] = useState(false);
    const [showSupport, setShowSupport] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const [unreadCount, setUnreadCount] = useState(0);

    const { cartCount } = useCart();

    const navItems = roleNavItems[user?.role] || [];
    const color = roleColors[user?.role] || 'student';

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Poll for notifications every minute
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const res = await notificationAPI.getAll();
            setNotifications(res.data);
            setUnreadCount(res.data.filter(n => !n.is_read).length);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    const markAllRead = async () => {
        try {
            await notificationAPI.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) { }
    };

    const markRead = async (id) => {
        try {
            await notificationAPI.markRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) { }
    };

    return (
        <nav className="bg-white dark:bg-surface-900 border-b border-surface-100 dark:border-surface-700 sticky top-0 z-40 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className={`w-9 h-9 bg-${color}-500 rounded-xl flex items-center justify-center`}>
                            <Leaf className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-display font-bold text-lg text-surface-900 dark:text-surface-100 hidden sm:block">
                            FoodLink
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg
                    font-medium text-sm transition-colors
                    ${isActive
                                            ? `bg-${color}-50 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-400`
                                            : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                                        }
                  `}
                                >
                                    <Icon className="w-4 h-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-2">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {isDark ? (
                                <Sun className="w-5 h-5" />
                            ) : (
                                <Moon className="w-5 h-5" />
                            )}
                        </button>

                        {/* Cart (Student Only) */}
                        {user?.role === 'student' && (
                            <Link
                                to="/student/cart"
                                className="p-2 rounded-lg text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors relative"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                {cartCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                )}
                            </Link>
                        )}

                        {/* Notifications */}
                        {/* Support Chat */}
                        <button
                            onClick={() => setShowSupport(!showSupport)}
                            className="p-2 rounded-lg text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                            aria-label="Customer Support"
                        >
                            <Headphones className="w-5 h-5" />
                        </button>

                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 rounded-lg text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                )}
                            </button>

                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-surface-800 rounded-xl shadow-lg border border-surface-100 dark:border-surface-700 py-2 animate-fade-in z-50">
                                    <div className="flex items-center justify-between px-4 py-2 border-b border-surface-100 dark:border-surface-700">
                                        <h3 className="font-semibold text-surface-900 dark:text-surface-100">Notifications</h3>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllRead}
                                                className="text-xs text-student-600 dark:text-student-400 hover:underline"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                    </div>

                                    <div className="max-h-96 overflow-y-auto">
                                        {notifications.length > 0 ? (
                                            notifications.map(notification => (
                                                <div
                                                    key={notification.id}
                                                    onClick={() => !notification.is_read && markRead(notification.id)}
                                                    className={`
                                                        px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-700 cursor-pointer transition-colors border-b border-surface-50 dark:border-surface-700 last:border-0
                                                        ${!notification.is_read ? 'bg-student-50/50 dark:bg-student-900/10' : ''}
                                                    `}
                                                >
                                                    <div className="flex gap-3">
                                                        <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${!notification.is_read ? 'bg-student-500' : 'bg-transparent'}`} />
                                                        <div>
                                                            <p className={`text-sm ${!notification.is_read ? 'font-semibold text-surface-900 dark:text-surface-100' : 'text-surface-600 dark:text-surface-400'}`}>
                                                                {notification.title}
                                                            </p>
                                                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 line-clamp-2">
                                                                {notification.message}
                                                            </p>
                                                            <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-1">
                                                                {new Date(notification.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-8 text-center text-surface-500">
                                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                                <p className="text-sm">No notifications</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Profile Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="flex items-center gap-2 p-1.5 pr-3 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                            >
                                <div className={`w-8 h-8 bg-${color}-100 dark:bg-${color}-900/50 text-${color}-700 dark:text-${color}-400 rounded-lg flex items-center justify-center`}>
                                    <User className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-surface-700 dark:text-surface-300 hidden sm:block">
                                    {user?.full_name || user?.username}
                                </span>
                            </button>

                            {showProfileMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-surface-800 rounded-xl shadow-lg border border-surface-100 dark:border-surface-700 py-2 animate-fade-in">
                                    <div className="px-4 py-2 border-b border-surface-100 dark:border-surface-700">
                                        <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{user?.username}</p>
                                        <p className="text-xs text-surface-500 dark:text-surface-400 capitalize">{user?.role}</p>
                                    </div>

                                    {user?.role === 'student' && (
                                        <div className="px-4 py-2 border-b border-surface-100 dark:border-surface-700">
                                            <p className="text-xs text-surface-500 dark:text-surface-400">Green Points</p>
                                            <p className={`text-lg font-bold text-${color}-600 dark:text-${color}-400`}>
                                                {user?.sustainability_points || 0}
                                            </p>
                                        </div>
                                    )}

                                    <Link
                                        to="/student/profile"
                                        className={`block w-full px-4 py-2 text-left text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 flex items-center gap-2`}
                                        onClick={() => setShowProfileMenu(false)}
                                    >
                                        <User className="w-4 h-4" />
                                        My Profile
                                    </Link>

                                    <button
                                        onClick={logout}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setIsMobileOpen(!isMobileOpen)}
                            className="md:hidden p-2 rounded-lg text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"
                        >
                            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isMobileOpen && (
                <div className="md:hidden border-t border-surface-100 dark:border-surface-700 bg-white dark:bg-surface-900 animate-fade-in">
                    <div className="px-4 py-3 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileOpen(false)}
                                    className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    font-medium transition-colors
                    ${isActive
                                            ? `bg-${color}-50 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-400`
                                            : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                                        }
                  `}
                                >
                                    <Icon className="w-5 h-5" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
            {/* Support Widget */}
            <SupportChatWidget isOpen={showSupport} onClose={() => setShowSupport(false)} />
        </nav>
    );
}

