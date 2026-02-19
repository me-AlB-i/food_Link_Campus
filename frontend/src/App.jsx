/**
 * FoodLink Campus - Main App Component
 * Handles routing and layout with code-splitting
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAuth } from './context/AuthContext';
import ProtectedRoute, { RoleRedirect } from './components/shared/ProtectedRoute';
import { CartProvider } from './context/CartContext';

// Lazy-loaded Auth Pages (code-splitting)
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));

// Lazy-loaded Dashboard Pages (code-splitting)
const StaffDashboard = lazy(() => import('./pages/staff/StaffDashboard'));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const CharityDashboard = lazy(() => import('./pages/charity/CharityDashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

// Lazy-loaded Shared Components
const NiyomBot = lazy(() => import('./components/shared/NiyomBot'));

// Loading component for Suspense fallback
const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900">
        <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-surface-600 dark:text-surface-400">Loading...</p>
        </div>
    </div>
);

import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
    const { isAuthenticated, getTheme } = useAuth();
    const theme = getTheme();
    // Using a public demo client ID (or user provided one).
    // User should replace this.
    const googleClientId = "360404497680-nvcha548kon47jtpfv6h507dg3lmc552.apps.googleusercontent.com"; // User provided Client ID

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <CartProvider>
                <div data-theme={theme} className="min-h-screen bg-surface-50 dark:bg-surface-900 transition-colors duration-300">
                    {/* Floating NIYOM (visible on all authenticated pages) */}
                    {isAuthenticated && <NiyomBot />}

                    <Suspense fallback={<PageLoader />}>
                        <Routes>
                            {/* Public Routes */}
                            <Route
                                path="/login"
                                element={
                                    isAuthenticated ? <RoleRedirect /> : <LoginPage />
                                }
                            />
                            <Route
                                path="/register"
                                element={
                                    isAuthenticated ? <RoleRedirect /> : <RegisterPage />
                                }
                            />

                            {/* Protected Routes - Staff */}
                            <Route
                                path="/staff/*"
                                element={
                                    <ProtectedRoute allowedRoles={['staff', 'admin']}>
                                        <StaffDashboard />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Protected Routes - Student */}
                            <Route
                                path="/student/*"
                                element={
                                    <ProtectedRoute allowedRoles={['student']}>
                                        <StudentDashboard />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Protected Routes - Charity */}
                            <Route
                                path="/charity/*"
                                element={
                                    <ProtectedRoute allowedRoles={['charity']}>
                                        <CharityDashboard />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Protected Routes - Admin */}
                            <Route
                                path="/admin/*"
                                element={
                                    <ProtectedRoute allowedRoles={['admin']}>
                                        <AdminDashboard />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Root redirect */}
                            <Route
                                path="/"
                                element={
                                    isAuthenticated ? <RoleRedirect /> : <Navigate to="/login" replace />
                                }
                            />

                            {/* 404 Fallback */}
                            <Route
                                path="*"
                                element={
                                    <div className="min-h-screen flex items-center justify-center">
                                        <div className="text-center">
                                            <h1 className="text-4xl font-bold text-surface-900 mb-2">404</h1>
                                            <p className="text-surface-500 mb-4">Page not found</p>
                                            <a href="/" className="btn-primary">Go Home</a>
                                        </div>
                                    </div>
                                }
                            />
                        </Routes>
                    </Suspense>
                </div>
            </CartProvider>
        </GoogleOAuthProvider>
    );
}

export default App;
