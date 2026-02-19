/**
 * FoodLink Campus - Authentication Context
 * Manages user authentication state and JWT tokens
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initialize auth state from localStorage
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('accessToken');
            const storedUser = localStorage.getItem('user');

            if (token && storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                    // Optionally verify token by fetching profile
                    // const response = await authAPI.getProfile();
                    // setUser(response.data);
                } catch (err) {
                    console.error('Auth init error:', err);
                    logout();
                }
            }

            setLoading(false);
        };

        initAuth();
    }, []);

    const login = useCallback(async (credentials) => {
        setError(null);
        setLoading(true);

        try {
            const response = await authAPI.login(credentials);
            if (response.data.require_otp) {
                setLoading(false);
                return { success: true, requireOtp: true, username: response.data.username };
            }

            const { user: userData, tokens } = response.data;

            // Store tokens
            localStorage.setItem('accessToken', tokens.access);
            localStorage.setItem('refreshToken', tokens.refresh);
            localStorage.setItem('user', JSON.stringify(userData));

            setUser(userData);
            setLoading(false);

            return { success: true, user: userData };
        } catch (err) {
            const message = err.response?.data?.error || 'Login failed. Please try again.';
            setError(message);
            setLoading(false);
            return { success: false, error: message };
        }
    }, []);

    const verifyOTP = useCallback(async (data) => {
        setError(null);
        setLoading(true);

        try {
            const response = await authAPI.verifyOTP(data);
            const { user: userData, tokens } = response.data;

            // Store tokens
            localStorage.setItem('accessToken', tokens.access);
            localStorage.setItem('refreshToken', tokens.refresh);
            localStorage.setItem('user', JSON.stringify(userData));

            setUser(userData);
            setLoading(false);

            return { success: true, user: userData };
        } catch (err) {
            const message = err.response?.data?.error || 'Verification failed. Please try again.';
            setError(message);
            setLoading(false);
            return { success: false, error: message };
        }
    }, []);

    // Google Login function
    const googleLogin = useCallback(async (tokenData) => {
        setError(null);
        setLoading(true);

        try {
            const response = await authAPI.googleLogin(tokenData);
            const { user: userData, tokens } = response.data;

            // Store tokens
            localStorage.setItem('accessToken', tokens.access);
            localStorage.setItem('refreshToken', tokens.refresh);
            localStorage.setItem('user', JSON.stringify(userData));

            setUser(userData);
            setLoading(false);

            return { success: true, user: userData };
        } catch (err) {
            const message = err.response?.data?.error || 'Google Login failed. Please try again.';
            setError(message);
            setLoading(false);
            return { success: false, error: message };
        }
    }, []);

    // Register function
    const register = useCallback(async (userData) => {
        setError(null);
        setLoading(true);

        try {
            const response = await authAPI.register(userData);

            // Check for OTP requirement
            if (response.data.require_otp) {
                setLoading(false);
                return {
                    success: true,
                    requireOtp: true,
                    user: { username: response.data.username, role: userData.role } // Minimal info
                };
            }

            const { user: newUser, tokens } = response.data;

            // Store tokens
            localStorage.setItem('accessToken', tokens.access);
            localStorage.setItem('refreshToken', tokens.refresh);
            localStorage.setItem('user', JSON.stringify(newUser));

            setUser(newUser);
            setLoading(false);

            return { success: true, user: newUser };
        } catch (err) {
            const message = err.response?.data?.error ||
                err.response?.data?.username?.[0] ||
                err.response?.data?.email?.[0] ||
                'Registration failed. Please try again.';
            setError(message);
            setLoading(false);
            return { success: false, error: message };
        }
    }, []);

    // Logout function
    const logout = useCallback(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
    }, []);

    // Update user profile
    const updateProfile = useCallback(async (data) => {
        try {
            const response = await authAPI.updateProfile(data);
            const updatedUser = response.data;

            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            return { success: true, user: updatedUser };
        } catch (err) {
            const message = err.response?.data?.error || 'Update failed.';
            return { success: false, error: message };
        }
    }, []);

    // Check if user has specific role
    const hasRole = useCallback((role) => {
        if (!user) return false;
        if (Array.isArray(role)) {
            return role.includes(user.role);
        }
        return user.role === role;
    }, [user]);

    // Get role-specific theme
    const getTheme = useCallback(() => {
        if (!user) return 'student';
        return user.role || 'student';
    }, [user]);

    const value = {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        verifyOTP,
        googleLogin,
        register,
        logout,
        updateProfile,
        hasRole,
        getTheme,
        clearError: () => setError(null),
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
