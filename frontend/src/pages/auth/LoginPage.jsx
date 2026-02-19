/**
 * FoodLink Campus - Login Page
 * Clean, minimal login with role-aware theming
 */
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import { Leaf, Eye, EyeOff, ArrowRight, Sun, Moon } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

export default function LoginPage() {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1: Credentials, 2: OTP
    const [tempUsername, setTempUsername] = useState('');

    // Validation state
    const [inputType, setInputType] = useState(null); // 'email', 'phone', 'username'
    const [isValidFormat, setIsValidFormat] = useState(true);
    const [suggestion, setSuggestion] = useState(null);

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { login, verifyOTP, googleLogin } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const { error: showError, success: showSuccess } = useNotification();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';

    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsLoading(true);
            try {
                // 1. Get User Info from Google
                const userInfo = await axios.get(
                    'https://www.googleapis.com/oauth2/v3/userinfo',
                    { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
                );

                // 2. Send to Backend
                const result = await googleLogin({
                    id_token: tokenResponse.access_token,
                    email: userInfo.data.email,
                    name: userInfo.data.name,
                    google_id: userInfo.data.sub
                });

                if (result.success) {
                    const roleRoutes = {
                        student: '/student',
                        staff: '/staff',
                        charity: '/charity',
                        admin: '/admin',
                    };
                    navigate(roleRoutes[result.user.role] || from, { replace: true });
                } else {
                    showError(result.error);
                }
            } catch (err) {
                console.error(err);
                showError('Google Login failed');
            } finally {
                setIsLoading(false);
            }
        },
        onError: () => {
            showError('Google Login Failed');
            setIsLoading(false);
        }
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (name === 'username') {
            validateInput(value);
        }
    };

    const validateInput = (value) => {
        if (!value) {
            setInputType(null);
            setIsValidFormat(true);
            setSuggestion(null);
            return;
        }

        // Email detection
        if (value.includes('@')) {
            setInputType('email');
            // Stricter email regex:
            // 1. User part: alphanumeric + ._%+-
            // 2. Domain: alphanumeric + .-
            // 3. TLD: at least 2 letters (e.g. .com, .in, .org)
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            setIsValidFormat(emailRegex.test(value));

            // Suggest typos
            const parts = value.split('@');
            if (parts.length > 1) {
                const domain = parts[1];
                const typos = {
                    'gmai.com': 'gmail.com',
                    'gmil.com': 'gmail.com',
                    'gmal.com': 'gmail.com',
                    'gmai8.com': 'gmail.com',
                    'gnail.com': 'gmail.com',
                    'yaho.com': 'yahoo.com',
                    'outloo.com': 'outlook.com',
                    'gamil.com': 'gmail.com'
                };
                if (typos[domain]) {
                    setSuggestion(value.replace(domain, typos[domain]));
                } else {
                    setSuggestion(null);
                }
            } else {
                setSuggestion(null);
            }
            return;
        }

        // Phone detection (ONLY digits, +, spaces, dashes)
        if (/^[\d\s\-\+]+$/.test(value) && /\d/.test(value)) {
            setInputType('phone');
            // Phone regex: 10-15 digits
            const digits = value.replace(/\D/g, '');
            setIsValidFormat(digits.length >= 10 && digits.length <= 15);
            setSuggestion(null);
            return;
        }

        // Default to username
        setInputType('username');
        setIsValidFormat(true);
        setSuggestion(null);
    };

    const handleCredentialsSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const result = await login(formData);

        if (result.success) {
            if (result.requireOtp) {
                setTempUsername(result.username);
                setStep(2);
                showSuccess("OTP sent to your email!");
            } else {
                // Direct login (Admin or if OTP disabled)
                const roleRoutes = {
                    student: '/student',
                    staff: '/staff',
                    charity: '/charity',
                    admin: '/admin',
                };
                navigate(roleRoutes[result.user.role] || from, { replace: true });
            }
        } else {
            showError(result.error);
        }

        setIsLoading(false);
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const result = await verifyOTP({ username: tempUsername, otp });

        if (result.success) {
            const roleRoutes = {
                student: '/student',
                staff: '/staff',
                charity: '/charity',
                admin: '/admin',
            };
            navigate(roleRoutes[result.user.role] || from, { replace: true });
        } else {
            showError(result.error);
        }

        setIsLoading(false);
    };



    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-student-500 to-student-700 dark:from-student-600 dark:to-student-900 p-12 flex-col justify-between">
                {/* Theme Toggle for desktop branding panel */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3 text-white">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <Leaf className="w-7 h-7" />
                        </div>
                        <span className="text-2xl font-display font-bold">FoodLink</span>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                </div>

                <div className="text-white">
                    <h1 className="text-4xl font-display font-bold mb-4">
                        Every meal saved is a step towards sustainability
                    </h1>
                    <p className="text-white/80 text-lg">
                        Join our campus community in reducing food waste and making a real environmental impact.
                    </p>
                </div>

                <div className="flex gap-8 text-white/60 text-sm">
                    <div>
                        <div className="text-3xl font-bold text-white">500+</div>
                        <div>Meals Saved</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white">120</div>
                        <div>Active Students</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white">50kg</div>
                        <div>Food Rescued</div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-surface-50 dark:bg-surface-900 transition-colors duration-300 relative">
                {/* Theme Toggle for mobile (visible only on mobile) */}
                <button
                    onClick={toggleTheme}
                    className="lg:hidden absolute top-4 right-4 p-3 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors shadow-sm"
                    aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
                        <div className="w-10 h-10 bg-student-500 rounded-xl flex items-center justify-center">
                            <Leaf className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-display font-bold text-surface-900 dark:text-surface-100">FoodLink Campus</span>
                    </div>

                    {step === 1 ? (
                        <>
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-100">
                                    Welcome back
                                </h2>
                                <p className="text-surface-500 dark:text-surface-400 mt-2">
                                    Sign in to continue saving food
                                </p>
                            </div>

                            <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                                {/* Username */}
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                        Username, Email or Phone
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        placeholder="Enter username, email or phone"
                                        required
                                        className={`input ${!isValidFormat && formData.username
                                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                            : ''
                                            }`}
                                        autoComplete="username"
                                    />
                                    {/* Validation Feedback */}
                                    {formData.username && (
                                        <div className="mt-1 text-xs h-4">
                                            {inputType === 'email' && (
                                                <span className={isValidFormat ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                                                    {isValidFormat ? "✓ Valid Email Format" : "⚠ Invalid Email Format"}
                                                </span>
                                            )}
                                            {inputType === 'phone' && (
                                                <span className={isValidFormat ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                                                    {isValidFormat ? "✓ Valid Phone Format" : "⚠ Invalid Phone Format (10-15 digits)"}
                                                </span>
                                            )}
                                            {inputType === 'username' && (
                                                <span className="text-surface-500 dark:text-surface-400">
                                                    Using Username
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    {/* Typo Suggestion */}
                                    {suggestion && (
                                        <div className="text-xs mt-1 text-surface-500">
                                            Did you mean <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, username: suggestion }));
                                                    validateInput(suggestion);
                                                    setSuggestion(null);
                                                }}
                                                className="text-student-600 dark:text-student-400 font-medium hover:underline focus:outline-none"
                                            >
                                                {suggestion}
                                            </button>?
                                        </div>
                                    )}
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Enter your password"
                                            required
                                            className="input pr-12"
                                            autoComplete="current-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn-primary w-full"
                                >
                                    {isLoading ? (
                                        <span className="spinner" />
                                    ) : (
                                        <>
                                            Sign In
                                            <ArrowRight className="w-5 h-5 ml-2" />
                                        </>
                                    )}
                                </button>

                                {/* Google Login Button */}
                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-surface-200 dark:border-surface-700" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-surface-50 dark:bg-surface-900 text-surface-500">
                                            Or continue with
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => loginWithGoogle()}
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-surface-300 dark:border-surface-600 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 font-medium"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path
                                            fill="currentColor"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                    Sign in with Google
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-100">Verify Login</h2>
                                <p className="text-surface-500 dark:text-surface-400 mt-2">
                                    Enter the 6-digit code sent to your email
                                </p>
                            </div>

                            <form onSubmit={handleOtpSubmit} className="space-y-6">
                                <div className="flex justify-center">
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                            setOtp(val);
                                        }}
                                        className="font-mono text-3xl tracking-[0.5em] text-center w-full h-16 rounded-xl border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-student-500 focus:border-student-500"
                                        placeholder="000000"
                                        autoFocus
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || otp.length !== 6}
                                    className="btn-primary w-full py-3"
                                >
                                    {isLoading ? <span className="spinner" /> : 'Verify & Login'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="w-full text-center text-sm text-surface-500 hover:text-surface-800 dark:hover:text-surface-200"
                                >
                                    Back to Login
                                </button>
                            </form>
                        </>
                    )}

                    {/* Register Link */}
                    <p className="text-center mt-6 text-surface-500 dark:text-surface-400">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-student-600 dark:text-student-400 font-medium hover:underline">
                            Create one
                        </Link>
                    </p>

                    {/* Demo Accounts */}
                    <div className="mt-8 p-4 bg-surface-100 dark:bg-surface-800 rounded-xl">
                        <p className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">Demo Accounts:</p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-surface-600 dark:text-surface-400">
                            <div className="bg-white dark:bg-surface-700 p-2 rounded-lg">
                                <div className="font-medium">Student</div>
                                <div>demo_student / demo123</div>
                            </div>
                            <div className="bg-white dark:bg-surface-700 p-2 rounded-lg">
                                <div className="font-medium">Staff</div>
                                <div>demo_staff / demo123</div>
                            </div>
                            <div className="bg-white dark:bg-surface-700 p-2 rounded-lg">
                                <div className="font-medium">Charity</div>
                                <div>demo_charity / demo123</div>
                            </div>
                            <div className="bg-white dark:bg-surface-700 p-2 rounded-lg">
                                <div className="font-medium">Admin</div>
                                <div>demo_admin / demo123</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
