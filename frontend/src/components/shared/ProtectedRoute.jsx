/**
 * FoodLink Campus - Protected Route Component
 * Handles role-based access control and authentication redirects
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Loading spinner component
function LoadingScreen() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900">
            <div className="text-center">
                <div className="spinner mx-auto mb-4" />
                <p className="text-surface-500 dark:text-surface-400">Loading...</p>
            </div>
        </div>
    );
}

// Unauthorized page component
function UnauthorizedPage() {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900">
            <div className="text-center max-w-md px-6">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                        className="w-10 h-10 text-red-500 dark:text-red-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-2">
                    Access Denied
                </h1>

                <p className="text-surface-500 dark:text-surface-400 mb-6">
                    You don't have permission to access this page.
                    {user && (
                        <span className="block mt-1">
                            Your role: <strong className="capitalize">{user.role}</strong>
                        </span>
                    )}
                </p>

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => window.history.back()}
                        className="btn-secondary"
                    >
                        Go Back
                    </button>

                    <button
                        onClick={logout}
                        className="btn-ghost text-red-600 hover:bg-red-50"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * ProtectedRoute - Wrapper for protected pages
 * @param {string[]} allowedRoles - Array of roles that can access this route
 * @param {React.ReactNode} children - Child components to render
 */
export default function ProtectedRoute({ allowedRoles = [], children }) {
    const { user, isAuthenticated, loading } = useAuth();
    const location = useLocation();

    // Show loading while checking auth
    if (loading) {
        return <LoadingScreen />;
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role-based access
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return <UnauthorizedPage />;
    }

    // Render protected content
    return children;
}

/**
 * RoleRedirect - Redirects users to their role-specific dashboard
 */
export function RoleRedirect() {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingScreen />;
    }

    // Redirect based on role
    const roleRoutes = {
        student: '/student',
        staff: '/staff',
        charity: '/charity',
        admin: '/admin',
    };

    const redirectTo = roleRoutes[user?.role] || '/login';
    return <Navigate to={redirectTo} replace />;
}
