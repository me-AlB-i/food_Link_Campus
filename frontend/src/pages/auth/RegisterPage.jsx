/**
 * FoodLink Campus - Register Page
 * Role-based registration with validation
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import {
    Leaf, Eye, EyeOff, ArrowRight, ArrowLeft,
    User, Building2, Heart, Shield, Sun, Moon
} from 'lucide-react';

const roles = [
    { id: 'student', label: 'Student', icon: User, color: 'student', desc: 'Reserve and collect food' },
    { id: 'staff', label: 'Canteen Staff', icon: Building2, color: 'staff', desc: 'List surplus food' },
    { id: 'charity', label: 'Charity', icon: Heart, color: 'charity', desc: 'Collect bulk food' },
];

export default function RegisterPage() {
    const [step, setStep] = useState(1);
    const [otp, setOtp] = useState('');
    const [tempUsername, setTempUsername] = useState('');
    const [formData, setFormData] = useState({
        role: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        college_id: '',
        phone: '',
        countryCode: '+91',
        organization_name: '',
        organization_address: '',
        institution_type: 'Canteen',
        institution_name: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { register, verifyOTP } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const { error: showError, success: showSuccess } = useNotification();
    const navigate = useNavigate();

    const countryCodes = [
        { code: '+91', country: 'IN' },
        { code: '+1', country: 'US' },
        { code: '+44', country: 'UK' },
        { code: '+61', country: 'AU' },
        { code: '+81', country: 'JP' },
        { code: '+86', country: 'CN' },
        { code: '+971', country: 'AE' },
        { code: '+49', country: 'DE' },
        { code: '+33', country: 'FR' },
    ];

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleRoleSelect = (role) => {
        setFormData((prev) => ({ ...prev, role }));
        setStep(2);
    };

    const handleBack = () => {
        setStep(1);
    };

    const validateForm = () => {
        if (formData.password !== formData.confirmPassword) {
            showError('Passwords do not match');
            return false;
        }
        if (formData.password.length < 6) {
            showError('Password must be at least 6 characters');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);

        const { confirmPassword, countryCode, phone, ...rest } = formData;

        // Strip non-digits from phone input
        const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
        // Combine phone if provided
        const fullPhone = cleanPhone ? `${countryCode}${cleanPhone}` : '';

        const submitData = {
            ...rest,
            phone: fullPhone
        };

        const result = await register(submitData);

        if (result.success) {
            // Check if OTP is required (server should return requireOtp: true)
            // Note: register in AuthContext needs to be updated to pass this through if it doesn't already
            if (result.user?.require_otp || result.requireOtp) {
                setTempUsername(result.user?.username || formData.username);
                setStep(3);
                showSuccess('Current step: Verify Email. OTP sent!');
                setIsLoading(false);
                return;
            }

            // Fallback for direct login (if no OTP required)
            showSuccess('Account created successfully!');
            const roleRoutes = {
                student: '/student',
                staff: '/staff',
                charity: '/charity',
            };
            navigate(roleRoutes[result.user.role] || '/', { replace: true });
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
            showSuccess('Email verified! Logging in...');
            const roleRoutes = {
                student: '/student',
                staff: '/staff',
                charity: '/charity',
            };
            navigate(roleRoutes[result.user.role] || '/', { replace: true });
        } else {
            showError(result.error);
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-surface-50 dark:bg-surface-900 transition-colors duration-300">
            {/* Theme Toggle - Fixed Position */}
            <button
                onClick={toggleTheme}
                className="fixed top-4 right-4 p-3 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors shadow-sm z-50"
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="w-full max-w-lg">
                {/* Logo */}
                <div className="flex items-center gap-3 mb-8 justify-center">
                    <div className="w-10 h-10 bg-student-500 rounded-xl flex items-center justify-center">
                        <Leaf className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-display font-bold text-surface-900 dark:text-surface-100">FoodLink Campus</span>
                </div>

                <div className="card">
                    {/* Step 1: Select Role */}
                    {step === 1 && (
                        <div className="animate-fade-in">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-100">
                                    Join FoodLink Campus
                                </h2>
                                <p className="text-surface-500 dark:text-surface-400 mt-2">
                                    Select your role to get started
                                </p>
                            </div>

                            <div className="space-y-3">
                                {roles.map((role) => {
                                    const Icon = role.icon;
                                    return (
                                        <button
                                            key={role.id}
                                            onClick={() => handleRoleSelect(role.id)}
                                            className={`
                        w-full p-4 rounded-xl border-2 text-left
                        flex items-center gap-4
                        transition-all duration-200
                        hover:border-${role.color}-500 hover:bg-${role.color}-50 dark:hover:bg-${role.color}-900/30
                        ${formData.role === role.id
                                                    ? `border-${role.color}-500 bg-${role.color}-50 dark:bg-${role.color}-900/30`
                                                    : 'border-surface-200 dark:border-surface-600'
                                                }
                      `}
                                        >
                                            <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center
                        bg-${role.color}-100 dark:bg-${role.color}-900/50 text-${role.color}-600 dark:text-${role.color}-400
                      `}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-surface-900 dark:text-surface-100">{role.label}</div>
                                                <div className="text-sm text-surface-500 dark:text-surface-400">{role.desc}</div>
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-surface-400 dark:text-surface-500 ml-auto" />
                                        </button>
                                    );
                                })}
                            </div>

                            <p className="text-center mt-6 text-surface-500 dark:text-surface-400">
                                Already have an account?{' '}
                                <Link to="/login" className="text-student-600 dark:text-student-400 font-medium hover:underline">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    )}

                    {/* Step 2: Account Details */}
                    {step === 2 && (
                        <form onSubmit={handleSubmit} className="animate-fade-in">
                            <button
                                type="button"
                                onClick={handleBack}
                                className="flex items-center gap-2 text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 mb-6"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </button>

                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-100">
                                    Create your account
                                </h2>
                                <p className="text-surface-500 dark:text-surface-400 mt-1">
                                    Registering as <span className="font-medium capitalize">{formData.role}</span>
                                </p>
                            </div>

                            <div className="space-y-4">
                                {/* Common Fields */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                            Username *
                                        </label>
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            required
                                            className="input"
                                            placeholder="johndoe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            name="full_name"
                                            value={formData.full_name}
                                            onChange={handleChange}
                                            className="input"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="input"
                                        placeholder="john@campus.edu"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                        Phone Number {formData.role === 'staff' ? '*' : ''}
                                    </label>
                                    <div className="flex gap-2">
                                        <select
                                            name="countryCode"
                                            value={formData.countryCode}
                                            onChange={handleChange}
                                            className="input w-24 bg-white dark:bg-surface-800"
                                        >
                                            {countryCodes.map((c) => (
                                                <option key={c.country} value={c.code}>
                                                    {c.code} ({c.country})
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required={formData.role === 'staff'}
                                            className="input flex-1"
                                            placeholder="9876543210"
                                        />
                                    </div>
                                </div>

                                {/* Role-specific fields */}
                                {formData.role === 'staff' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                                Institution Type *
                                            </label>
                                            <select
                                                name="institution_type"
                                                value={formData.institution_type}
                                                onChange={handleChange}
                                                className="input bg-white dark:bg-surface-800"
                                            >
                                                <option value="Canteen">Canteen</option>
                                                <option value="School">School</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                                Institution Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="institution_name"
                                                value={formData.institution_name}
                                                onChange={handleChange}
                                                required
                                                className="input"
                                                placeholder="Enter School or College Name"
                                            />
                                        </div>
                                    </>
                                )}
                                {formData.role === 'student' && (
                                    <div>
                                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                            College ID
                                        </label>
                                        <input
                                            type="text"
                                            name="college_id"
                                            value={formData.college_id}
                                            onChange={handleChange}
                                            className="input"
                                            placeholder="UKP22CS001"
                                        />
                                    </div>
                                )}

                                {formData.role === 'charity' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                                Organization Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="organization_name"
                                                value={formData.organization_name}
                                                onChange={handleChange}
                                                required
                                                className="input"
                                                placeholder="Food Bank NGO"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                                Organization Address
                                            </label>
                                            <input
                                                type="text"
                                                name="organization_address"
                                                value={formData.organization_address}
                                                onChange={handleChange}
                                                className="input"
                                                placeholder="123 Main Street"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Password Fields */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                            Password *
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                required
                                                minLength={6}
                                                className="input pr-10"
                                                placeholder="••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                            Confirm *
                                        </label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            required
                                            className="input"
                                            placeholder="••••••"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn-primary w-full mt-6"
                                >
                                    {isLoading ? (
                                        <span className="spinner" />
                                    ) : (
                                        <>
                                            Create Account
                                            <ArrowRight className="w-5 h-5 ml-2" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 3: OTP Verification */}
                    {step === 3 && (
                        <div className="animate-fade-in">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-100">
                                    Verify Email
                                </h2>
                                <p className="text-surface-500 dark:text-surface-400 mt-2">
                                    Enter the 6-digit code sent to {formData.email}
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
                                    {isLoading ? <span className="spinner" /> : 'Verify & Create Account'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

