/**
 * FoodLink Campus - Admin Dashboard
 * Analytics, user management, and AI reports
 */
import { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import { statsAPI, adminAPI } from '../../services/api';
import Navbar from '../../components/shared/Navbar';
import {
    BarChart3, Users, FileText, TrendingUp,
    Package, Leaf, UserCheck, Building2,
    RefreshCw, Download, AlertCircle, X
} from 'lucide-react';
import AdminSupportPage from './AdminSupportPage';

// Stats Component
function StatCard({ icon: Icon, label, value, subtext, color = 'surface' }) {
    return (
        <div className="card">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-surface-500 dark:text-surface-400">{label}</p>
                    <p className="text-3xl font-bold text-surface-900 dark:text-surface-100 mt-1">{value}</p>
                    {subtext && (
                        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">{subtext}</p>
                    )}
                </div>
                <div className={`w-12 h-12 bg-${color}-100 dark:bg-${color}-900/50 rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
                </div>
            </div>
        </div>
    );
}

// Admin Home
function AdminHome() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await statsAPI.getImpactStats();
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="page-container flex justify-center py-12">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold text-surface-900 dark:text-surface-100">
                        Admin Dashboard
                    </h1>
                    <p className="text-surface-500 dark:text-surface-400 mt-1">
                        Platform analytics and management
                    </p>
                </div>
                <button onClick={fetchStats} className="btn-ghost text-surface-600 dark:text-surface-400">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    icon={Package}
                    label="Total Listed"
                    value={stats?.total_food_items_listed || 0}
                    color="staff"
                />
                <StatCard
                    icon={Leaf}
                    label="Food Saved"
                    value={`${stats?.total_kg_saved?.toFixed(1) || 0} kg`}
                    color="student"
                />
                <StatCard
                    icon={UserCheck}
                    label="Students Active"
                    value={stats?.total_students_participated || 0}
                    color="student"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Collection Rate"
                    value={`${stats?.collection_rate_percent || 0}%`}
                    color="charity"
                />
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link to="/admin/users" className="card hover:shadow-lg transition-shadow group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-staff-100 dark:bg-staff-900/50 rounded-xl flex items-center justify-center group-hover:bg-staff-200 dark:group-hover:bg-staff-800 transition-colors">
                            <Users className="w-6 h-6 text-staff-600 dark:text-staff-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-surface-900 dark:text-surface-100">Manage Users</h3>
                            <p className="text-sm text-surface-500 dark:text-surface-400">View and manage all users</p>
                        </div>
                    </div>
                </Link>

                <Link to="/admin/reports" className="card hover:shadow-lg transition-shadow group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-student-100 dark:bg-student-900/50 rounded-xl flex items-center justify-center group-hover:bg-student-200 dark:group-hover:bg-student-800 transition-colors">
                            <FileText className="w-6 h-6 text-student-600 dark:text-student-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-surface-900 dark:text-surface-100">Impact Reports</h3>
                            <p className="text-sm text-surface-500 dark:text-surface-400">Generate AI-powered reports</p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}

// Users Management
function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState('all');
    const [viewingIdCard, setViewingIdCard] = useState(null);
    const { success, error: showError } = useNotification();

    useEffect(() => {
        fetchUsers();
    }, [roleFilter]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getUsers(roleFilter === 'all' ? null : roleFilter);
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivate = async (userId) => {
        if (!confirm('Are you sure you want to deactivate this user?')) return;

        try {
            await adminAPI.deactivateUser(userId);
            success('User deactivated');
            fetchUsers();
        } catch (error) {
            showError('Failed to deactivate user');
        }
    };

    const handleApprove = async (userId) => {
        try {
            await adminAPI.updateUser(userId, { is_approved: true });
            success('User approved');
            fetchUsers();
        } catch (error) {
            showError('Failed to approve user');
        }
    };

    const roleColors = {
        student: 'student',
        staff: 'staff',
        charity: 'charity',
        admin: 'surface',
    };

    return (
        <div className="page-container">
            {/* ... header and filters ... */}
            <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-100 mb-6">
                User Management
            </h1>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {['all', 'student', 'staff', 'charity', 'admin'].map((role) => (
                    <button
                        key={role}
                        onClick={() => setRoleFilter(role)}
                        className={`
              px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
              transition-colors duration-200
              ${roleFilter === role
                                ? 'bg-surface-800 dark:bg-surface-200 text-white dark:text-surface-900'
                                : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
                            }
            `}
                    >
                        {role === 'all' ? 'All Users' : role.charAt(0).toUpperCase() + role.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="spinner" />
                </div>
            ) : users.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-surface-200 dark:border-surface-700">
                                <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">User</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">Role</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">Status</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">Email</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => {
                                const color = roleColors[user.role] || 'surface';

                                return (
                                    <tr key={user.id} className="border-b border-surface-100 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 bg-${color}-100 dark:bg-${color}-900/50 rounded-lg flex items-center justify-center`}>
                                                    <Users className={`w-4 h-4 text-${color}-600 dark:text-${color}-400`} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-surface-900 dark:text-surface-100">{user.username}</p>
                                                    <p className="text-xs text-surface-500 dark:text-surface-400">{user.full_name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`badge bg-${color}-100 dark:bg-${color}-900/50 text-${color}-700 dark:text-${color}-300 capitalize`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {((user.role === 'staff' || user.role === 'student') && user.is_approved === false) ? (
                                                <span className="badge bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300">
                                                    Pending
                                                </span>
                                            ) : (
                                                <span className="badge bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                                                    Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-surface-600 dark:text-surface-400">{user.email}</td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                {user.id_card_image_url && (
                                                    <button
                                                        onClick={() => setViewingIdCard(user)}
                                                        className="text-sm text-student-600 hover:underline font-medium"
                                                    >
                                                        View ID
                                                    </button>
                                                )}
                                                {((user.role === 'staff' || user.role === 'student') && user.is_approved === false) && (
                                                    <button
                                                        onClick={() => handleApprove(user.id)}
                                                        className="text-sm text-green-600 hover:underline font-medium"
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeactivate(user.id)}
                                                    className="text-sm text-red-600 hover:underline"
                                                >
                                                    Deactivate
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="empty-state">
                    <Users className="empty-state-icon" />
                    <p className="empty-state-title">No users found</p>
                </div>
            )}
            {/* ID Card Modal */}
            {viewingIdCard && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 max-w-lg w-full relative animate-scale-in">
                        <button
                            onClick={() => setViewingIdCard(null)}
                            className="absolute top-4 right-4 p-2 text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-xl font-bold mb-4 text-surface-900 dark:text-surface-100">
                            Student Verification
                        </h3>

                        <div className="mb-4">
                            <p className="text-sm text-surface-500 dark:text-surface-400">Name</p>
                            <p className="font-semibold text-lg text-surface-900 dark:text-surface-100">{viewingIdCard.full_name || viewingIdCard.username}</p>
                        </div>

                        <div className="mb-6 bg-surface-100 dark:bg-surface-900 rounded-xl overflow-hidden flex items-center justify-center min-h-[200px] border border-surface-200 dark:border-surface-700">
                            <img
                                src={`http://127.0.0.1:8000${viewingIdCard.id_card_image_url}`}
                                alt="ID Card"
                                className="max-w-full max-h-[60vh] object-contain"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setViewingIdCard(null)}
                                className="btn-secondary flex-1"
                            >
                                Close
                            </button>
                            {!viewingIdCard.is_approved && (
                                <button
                                    onClick={() => {
                                        handleApprove(viewingIdCard.id);
                                        setViewingIdCard(null);
                                    }}
                                    className="btn-primary flex-1 bg-green-600 hover:bg-green-700"
                                >
                                    Approve Student
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Impact Reports
function ReportsPage() {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const { error: showError } = useNotification();

    const generateReport = async () => {
        setLoading(true);
        try {
            const response = await statsAPI.getImpactReport();
            setReport(response.data);
        } catch (error) {
            showError('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container max-w-3xl">
            <h1 className="text-2xl font-display font-bold text-surface-900 mb-6">
                Impact Reports
            </h1>

            {/* Generate Button */}
            <div className="card bg-student-50 border-student-200 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-surface-900">AI-Powered Report</h3>
                        <p className="text-sm text-surface-500">
                            Generate a narrative summary using Google Gemini
                        </p>
                    </div>
                    <button
                        onClick={generateReport}
                        disabled={loading}
                        className="btn-primary bg-student-500 hover:bg-student-600"
                    >
                        {loading ? (
                            <span className="spinner" />
                        ) : (
                            <>
                                <FileText className="w-4 h-4 mr-2" />
                                Generate Report
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Stats Preview */}
            {report && (
                <div className="space-y-6 animate-fade-in">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-surface-100 rounded-xl">
                            <p className="text-2xl font-bold text-surface-900">
                                {report.stats.total_food_items_listed}
                            </p>
                            <p className="text-xs text-surface-500">Items Listed</p>
                        </div>
                        <div className="text-center p-4 bg-student-100 rounded-xl">
                            <p className="text-2xl font-bold text-student-700">
                                {report.stats.total_kg_saved.toFixed(1)} kg
                            </p>
                            <p className="text-xs text-student-600">Food Saved</p>
                        </div>
                        <div className="text-center p-4 bg-staff-100 rounded-xl">
                            <p className="text-2xl font-bold text-staff-700">
                                {report.stats.total_meals_redistributed}
                            </p>
                            <p className="text-xs text-staff-600">Meals Given</p>
                        </div>
                        <div className="text-center p-4 bg-charity-100 rounded-xl">
                            <p className="text-2xl font-bold text-charity-700">
                                {report.stats.collection_rate_percent}%
                            </p>
                            <p className="text-xs text-charity-600">Success Rate</p>
                        </div>
                    </div>

                    {/* AI Report */}
                    <div className="card">
                        <div className="flex items-center gap-2 mb-4">
                            <Leaf className="w-5 h-5 text-student-600" />
                            <h3 className="font-semibold text-surface-900">Impact Summary</h3>
                            <span className="text-xs bg-surface-100 px-2 py-1 rounded-full text-surface-500">
                                {report.source === 'gemini' ? 'AI Generated' : 'Template'}
                            </span>
                        </div>

                        <div className="prose prose-sm max-w-none text-surface-700">
                            <p className="whitespace-pre-line">{report.report}</p>
                        </div>
                    </div>

                    {/* Export Options */}
                    <div className="flex gap-3">
                        <button className="btn-secondary flex-1">
                            <Download className="w-4 h-4 mr-2" />
                            Export PDF
                        </button>
                        <button className="btn-ghost flex-1 text-surface-600">
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                        </button>
                    </div>
                </div>
            )}

            {!report && !loading && (
                <div className="empty-state">
                    <BarChart3 className="empty-state-icon" />
                    <p className="empty-state-title">No report generated</p>
                    <p className="empty-state-text">
                        Click "Generate Report" to create an AI-powered impact summary
                    </p>
                </div>
            )}
        </div>
    );
}

// Main Admin Dashboard Router
export default function AdminDashboard() {
    return (
        <div data-theme="admin">
            <Navbar />
            <Routes>
                <Route index element={<AdminHome />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="support" element={<AdminSupportPage />} />
            </Routes>
        </div>
    );
}
