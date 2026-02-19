/**
 * FoodLink Campus - Staff Dashboard
 * Main hub for canteen staff operations
 */
import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { foodAPI, reservationAPI } from '../../services/api';
import QRScanner, { QRScannerButton } from '../../components/staff/QRScanner';
import Navbar from '../../components/shared/Navbar';
import FoodCard from '../../components/food/FoodCard';
import HygieneChecklist, { isHygieneValid } from '../../components/forms/HygieneChecklist';
import {
    Plus, Package, Clock, CheckCircle, AlertCircle,
    Leaf, Drumstick, MapPin, ArrowRight, QrCode, User, Calendar, Camera, Image as ImageIcon,
    Trash2, Edit, Save, X as XIcon
} from 'lucide-react';

// Stats Card Component
function StatCard({ icon: Icon, label, value, color = 'student' }) {
    return (
        <div className={`bg-${color}-50 dark:bg-${color}-900/30 rounded-2xl p-5 border border-${color}-100 dark:border-${color}-800`}>
            <div className={`w-10 h-10 bg-${color}-100 dark:bg-${color}-800 rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`} />
            </div>
            <p className="text-sm text-surface-500 dark:text-surface-400">{label}</p>
            <p className={`text-2xl font-bold text-${color}-700 dark:text-${color}-300`}>{value}</p>
        </div>
    );
}

// Dashboard Home
function StaffHome() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        available: 0,
        reserved: 0,
        collected: 0,
        total: 0,
    });
    const [recentListings, setRecentListings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await foodAPI.getMyListings();
            const listings = response.data;

            setRecentListings(listings.slice(0, 4));
            setStats({
                available: listings.filter(f => f.status === 'available').length,
                reserved: listings.filter(f => f.status === 'reserved').length,
                collected: listings.filter(f => f.status === 'collected').length,
                total: listings.length,
            });
        } catch (error) {
            console.error('Failed to fetch listings:', error);
        } finally {
            setLoading(false);
        }
    };

    const isApproved = user?.is_approved !== false; // Default true if field missing for old users

    return (
        <div className="page-container">
            {/* Approval Warning */}
            {!isApproved && (
                <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 p-4 rounded-xl mb-6 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-orange-800 dark:text-orange-200">Account Pending Verification</h3>
                        <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                            Your account is currently under review. You cannot list food items until an administrator approves your account.
                            Please contact support if this persists.
                        </p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold text-surface-900 dark:text-surface-100">
                        Staff Dashboard
                    </h1>
                    <p className="text-surface-500 dark:text-surface-400 mt-1">Manage your food listings</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/staff/claims" className="btn-secondary">
                        <QrCode className="w-5 h-5 mr-2" />
                        View Claims
                    </Link>
                    {isApproved && (
                        <Link to="/staff/add" className="btn-primary">
                            <Plus className="w-5 h-5 mr-2" />
                            List Food
                        </Link>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={Package} label="Total Listed" value={stats.total} color="staff" />
                <StatCard icon={Clock} label="Available" value={stats.available} color="student" />
                <StatCard icon={AlertCircle} label="Reserved" value={stats.reserved} color="charity" />
                <StatCard icon={CheckCircle} label="Collected" value={stats.collected} color="staff" />
            </div>

            {/* Recent Listings */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="section-title mb-0">Recent Listings</h2>
                <Link to="/staff/listings" className="text-staff-600 text-sm font-medium hover:underline flex items-center gap-1">
                    View all <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="spinner" />
                </div>
            ) : recentListings.length > 0 ? (
                <div className="dashboard-grid">
                    {recentListings.map((food) => (
                        <FoodCard key={food.id} food={food} showReserveButton={false} />
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <Package className="empty-state-icon" />
                    <p className="empty-state-title">No food listed yet</p>
                    <p className="empty-state-text">Start by adding surplus food from your canteen</p>
                    <Link to="/staff/add" className="btn-primary mt-4">
                        <Plus className="w-5 h-5 mr-2" />
                        List Food
                    </Link>
                </div>
            )}
        </div>
    );
}

// Add Food Form
function AddFoodPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { success, error: showError } = useNotification();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (user?.is_approved === false) {
            showError("Your account is pending verification.");
            navigate('/staff');
        }
    }, [user, navigate, showError]);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        quantity: '',
        unit: 'plates',
        food_type: 'veg',
        pickup_window_end: '',
        location_name: '',
        latitude: '',
        longitude: '',
        price: '',
    });
    const [isLocating, setIsLocating] = useState(false);

    const [hygieneChecks, setHygieneChecks] = useState({
        temp_check: false,
        packaging_clean: false,
        safe_storage: false,
    });

    const [imageFile, setImageFile] = useState(null);

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            showError("Geolocation is not supported by your browser");
            return;
        }

        setIsLocating(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setFormData(prev => ({
                    ...prev,
                    latitude: latitude.toString(),
                    longitude: longitude.toString()
                }));
                setIsLocating(false);
                success("Location captured successfully!");
            },
            (error) => {
                console.error("Error getting location:", error);
                showError("Failed to get location. Please allow location access.");
                setIsLocating(false);
            }
        );
    };

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isHygieneValid(hygieneChecks)) {
            showError('Please complete all hygiene checks before listing');
            return;
        }

        setIsLoading(true);

        try {
            // Create FormData for file upload
            const data = new FormData();
            data.append('name', formData.name);
            data.append('description', formData.description);
            data.append('quantity', parseInt(formData.quantity));
            data.append('unit', formData.unit);
            data.append('food_type', formData.food_type);
            data.append('pickup_window_end', formData.pickup_window_end);
            data.append('location_name', formData.location_name);
            data.append('latitude', formData.latitude);
            data.append('longitude', formData.longitude);
            data.append('price', formData.price || 0);
            data.append('retail_price', formData.retail_price || 0); // Add this
            data.append('hygiene_checks', JSON.stringify(hygieneChecks)); // Backend needs to parse this? 

            // Wait, standard DRF serializer expects nested objects directly if JSON. 
            // But with FormData, everything is string.
            // I need to ensure backend handles 'hygiene_checks' as JSON string OR I send fields individually.
            // MongoEngine EmbeddedDocumentField handling in DRF might require dot notation or JSON string.
            // Simplest: Send individual fields and constructing dict in view? 
            // OR checks definitions show it expects checks.
            // Let's rely on standard practice: Send JSON string and update backend to parse if needed.
            // Or simple hacks: Send 'hygiene_checks.temp_check' etc.

            // Let's append individually to be safe with standard parsers
            data.append('hygiene_checks.temp_check', hygieneChecks.temp_check);
            data.append('hygiene_checks.packaging_clean', hygieneChecks.packaging_clean);
            data.append('hygiene_checks.safe_storage', hygieneChecks.safe_storage);

            if (imageFile) {
                data.append('image', imageFile);
            }

            // Send request to create food item
            await foodAPI.create(data);

            // Show success state
            setIsLoading(false);
            setIsSuccess(true);
            success('Food listed successfully!');

            // Navigate after brief animation
            setTimeout(() => {
                navigate('/staff/listings');
            }, 1500);
        } catch (err) {
            console.error('Failed to create food:', err);
            showError(err.response?.data?.error || 'Failed to list food');
            setIsLoading(false);
        }
    };

    // Set default pickup window (2 hours from now)
    useEffect(() => {
        const twoHoursLater = new Date(Date.now() + 2 * 60 * 60 * 1000);
        const formatted = twoHoursLater.toISOString().slice(0, 16);
        setFormData(prev => ({ ...prev, pickup_window_end: formatted }));
    }, []);

    const canSubmit = isHygieneValid(hygieneChecks) && formData.name && formData.quantity;

    return (
        <div className="page-container max-w-2xl">
            <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-100 mb-6">
                List Surplus Food
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info Card */}
                <div className="card">
                    <h2 className="font-semibold text-surface-900 dark:text-surface-100 mb-4">Food Details</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                Food Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="input"
                                placeholder="e.g., Vegetable Biryani"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={2}
                                className="input resize-none"
                                placeholder="Brief description of the food..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                Food Photo
                            </label>
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                                {imageFile ? (
                                    <div className="relative w-full h-full">
                                        <img
                                            src={URL.createObjectURL(imageFile)}
                                            alt="Preview"
                                            className="w-full h-full object-cover rounded-xl"
                                        />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-xl">
                                            <p className="text-white font-medium">Change Photo</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-surface-500">
                                        <Camera className="w-8 h-8 mb-2" />
                                        <p className="text-sm font-medium">Click to upload photo</p>
                                        <p className="text-xs text-surface-400 mt-1">JPG, PNG (max 5MB)</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                    Quantity *
                                </label>
                                <input
                                    type="number"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    required
                                    min="1"
                                    className="input"
                                    placeholder="10"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                    Unit
                                </label>
                                <select
                                    name="unit"
                                    value={formData.unit}
                                    onChange={handleChange}
                                    className="input"
                                >
                                    <option value="plates">Plates</option>
                                    <option value="kg">Kilograms</option>
                                    <option value="liters">Liters</option>
                                    <option value="pieces">Pieces</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                Food Type *
                            </label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, food_type: 'veg' }))}
                                    className={`
                    flex-1 p-3 rounded-xl border-2 flex items-center justify-center gap-2
                    transition-all duration-200
                    ${formData.food_type === 'veg'
                                            ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                            : 'border-surface-200 dark:border-surface-600 hover:border-surface-300 dark:hover:border-surface-500 text-surface-700 dark:text-surface-300'
                                        }
                  `}
                                >
                                    <Leaf className="w-5 h-5" />
                                    Veg
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, food_type: 'non-veg' }))}
                                    className={`
                    flex-1 p-3 rounded-xl border-2 flex items-center justify-center gap-2
                    transition-all duration-200
                    ${formData.food_type === 'non-veg'
                                            ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                            : 'border-surface-200 dark:border-surface-600 hover:border-surface-300 dark:hover:border-surface-500 text-surface-700 dark:text-surface-300'
                                        }
                  `}
                                >
                                    <Drumstick className="w-5 h-5" />
                                    Non-Veg
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                    Pickup Window End *
                                </label>
                                <input
                                    type="datetime-local"
                                    name="pickup_window_end"
                                    value={formData.pickup_window_end}
                                    onChange={handleChange}
                                    required
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                    Location
                                </label>
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        name="location_name"
                                        value={formData.location_name}
                                        onChange={handleChange}
                                        className="input"
                                        placeholder="Main Canteen"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleGetLocation}
                                        disabled={isLocating}
                                        className={`
                                            w-full py-2 px-3 rounded-lg text-sm font-medium border-2 
                                            flex items-center justify-center gap-2 transition-colors
                                            ${formData.latitude
                                                ? 'border-green-500 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400'
                                                : 'border-surface-200 dark:border-surface-600 hover:border-surface-300 dark:hover:border-surface-500 text-surface-600 dark:text-surface-400'
                                            }
                                        `}
                                    >
                                        {isLocating ? (
                                            <>
                                                <span className="spinner w-4 h-4" /> Getting Location...
                                            </>
                                        ) : formData.latitude ? (
                                            <>
                                                <MapPin className="w-4 h-4" /> Location Captured
                                            </>
                                        ) : (
                                            <>
                                                <MapPin className="w-4 h-4" /> Use Current Location
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Price Section */}
                <div className="card">
                    <h2 className="font-semibold text-surface-900 dark:text-surface-100 mb-4">Pricing & Discount</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                Original Price (₹)
                            </label>
                            <input
                                type="number"
                                name="retail_price"
                                value={formData.retail_price}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className="input"
                                placeholder="e.g. 150"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                Offer Price (₹)
                            </label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className="input"
                                placeholder="e.g. 50"
                            />
                        </div>
                    </div>
                    {/* Discount Preview */}
                    {formData.retail_price > 0 && formData.price > 0 && (
                        <div className="mt-2 text-sm text-green-600 dark:text-green-400 font-medium">
                            {Math.round(((formData.retail_price - formData.price) / formData.retail_price) * 100)}% OFF
                        </div>
                    )}
                </div>

                {/* Hygiene Checklist Card */}
                <div className="card">
                    <HygieneChecklist
                        values={hygieneChecks}
                        onChange={setHygieneChecks}
                    />
                </div>

                {/* Submit Button with States */}
                <button
                    type="submit"
                    disabled={!canSubmit || isLoading || isSuccess}
                    className={`
                        w-full py-4 rounded-xl font-semibold text-base
                        flex items-center justify-center gap-2
                        transition-all duration-300 transform
                        ${isSuccess
                            ? 'bg-green-500 text-white scale-[1.02]'
                            : 'btn-primary'
                        }
                        ${isLoading ? 'cursor-wait' : ''}
                        disabled:opacity-70
                    `}
                >
                    {isSuccess ? (
                        <>
                            <CheckCircle className="w-6 h-6 animate-bounce" />
                            <span>Listed Successfully!</span>
                        </>
                    ) : isLoading ? (
                        <>
                            <span className="spinner" />
                            <span>Listing Food...</span>
                        </>
                    ) : (
                        <>
                            <Plus className="w-5 h-5" />
                            <span>List Food Item</span>
                        </>
                    )}
                </button>
            </form >
        </div >
    );
}


// My Listings Page
function MyListingsPage() {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const { success, error: showError } = useNotification();

    // Edit State
    const [editingFood, setEditingFood] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', quantity: '', pickup_window_end: '', price: '' });
    const [editImage, setEditImage] = useState(null);

    useEffect(() => {
        fetchListings();
    }, []);

    const fetchListings = async () => {
        try {
            const response = await foodAPI.getMyListings();
            setListings(response.data);
        } catch (error) {
            console.error('Failed to fetch listings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this listing?')) return;

        try {
            await foodAPI.delete(id);
            success('Listing deleted successfully');
            setListings(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            showError('Failed to delete listing');
        }
    };

    const startEdit = (food) => {
        setEditingFood(food);
        // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
        const dateStr = food.pickup_window_end ? new Date(food.pickup_window_end).toISOString().slice(0, 16) : '';
        setEditForm({
            name: food.name,
            quantity: food.quantity,
            pickup_window_end: dateStr,
            price: food.price || 0,
            retail_price: food.retail_price || 0
        });
        setEditImage(null);
    };

    const handleUpdate = async () => {
        if (!editForm.name || editForm.quantity < 1) return;

        try {
            const data = new FormData();
            data.append('name', editForm.name);
            data.append('quantity', parseInt(editForm.quantity));
            data.append('pickup_window_end', editForm.pickup_window_end);
            data.append('price', parseFloat(editForm.price || 0));
            data.append('retail_price', parseFloat(editForm.retail_price || 0));

            if (editImage) {
                data.append('image', editImage);
            }

            await foodAPI.update(editingFood.id, data);

            success('Listing updated successfully');
            setEditingFood(null);
            fetchListings();
        } catch (err) {
            console.error(err);
            showError('Failed to update listing');
        }
    };



    const filteredListings = filter === 'all'
        ? listings
        : listings.filter(f => f.status === filter);

    return (
        <div className="page-container">
            <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-100 mb-6">
                My Listings
            </h1>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {['all', 'available', 'reserved', 'collected', 'escalated'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`
              px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
              transition-colors duration-200
              ${filter === status
                                ? 'bg-staff-500 text-white'
                                : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
                            }
            `}
                    >
                        {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="spinner" />
                </div>
            ) : filteredListings.length > 0 ? (
                <div className="dashboard-grid">
                    {filteredListings.map((food) => (
                        <div key={food.id} className="relative group flex flex-col h-full">
                            <FoodCard food={food} showReserveButton={false} />

                            {/* Action Buttons */}
                            <div className="mt-2 flex gap-2">
                                <button
                                    onClick={() => startEdit(food)}
                                    className="flex-1 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Edit size={16} /> Edit Qty
                                </button>
                                <button
                                    onClick={() => handleDelete(food.id)}
                                    className="flex-1 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Trash2 size={16} /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <Package className="empty-state-icon" />
                    <p className="empty-state-title">No listings found</p>
                    <p className="empty-state-text">
                        {filter === 'all'
                            ? "You haven't listed any food yet"
                            : `No ${filter} items`
                        }
                    </p>
                </div>
            )}

            {/* Edit Modal */}
            {editingFood && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 w-full max-w-sm shadow-xl animate-scale-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">Edit Listing</h3>
                            <button onClick={() => setEditingFood(null)} className="text-surface-500 hover:text-surface-700 dark:hover:text-surface-300">
                                <XIcon size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Name Input */}
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                    Food Name
                                </label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))}
                                    className="input w-full"
                                />
                            </div>

                            {/* Quantity Input */}
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                    Quantity
                                </label>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setEditForm(p => ({ ...p, quantity: Math.max(1, parseInt(p.quantity || 0) - 1) }))}
                                        className="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-lg font-bold"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        value={editForm.quantity}
                                        onChange={(e) => setEditForm(p => ({ ...p, quantity: e.target.value }))}
                                        className="flex-1 text-center text-xl font-bold bg-transparent border-b-2 border-surface-200 dark:border-surface-700 focus:border-staff-500 outline-none py-1"
                                        min="1"
                                    />
                                    <button
                                        onClick={() => setEditForm(p => ({ ...p, quantity: parseInt(p.quantity || 0) + 1 }))}
                                        className="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-lg font-bold"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Timer Input */}
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                    Pickup Window Ends
                                </label>
                                <input
                                    type="datetime-local"
                                    value={editForm.pickup_window_end}
                                    onChange={(e) => setEditForm(p => ({ ...p, pickup_window_end: e.target.value }))}
                                    className="input w-full"
                                />
                            </div>

                            {/* Price Inputs */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                        Original Price (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={editForm.retail_price}
                                        onChange={(e) => setEditForm(p => ({ ...p, retail_price: e.target.value }))}
                                        min="0"
                                        step="0.01"
                                        className="input w-full"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                        Offer Price (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={editForm.price}
                                        onChange={(e) => setEditForm(p => ({ ...p, price: e.target.value }))}
                                        min="0"
                                        step="0.01"
                                        className="input w-full"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            {parseFloat(editForm.retail_price) > parseFloat(editForm.price) && parseFloat(editForm.price) > 0 && (
                                <p className="text-xs text-green-600 font-medium text-right">
                                    {Math.round(((editForm.retail_price - editForm.price) / editForm.retail_price) * 100)}% OFF
                                </p>
                            )}

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                                    Update Photo
                                </label>
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors relative overflow-hidden">
                                    {editImage ? (
                                        <img src={URL.createObjectURL(editImage)} className="w-full h-full object-cover" />
                                    ) : editingFood.image_url ? (
                                        <img src={editingFood.image_url} className="w-full h-full object-cover opacity-50" />
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <Camera className="w-6 h-6 mb-1 text-surface-400" />
                                            <span className="text-xs text-surface-500">Tap to change</span>
                                        </div>
                                    )}

                                    {(editImage || editingFood.image_url) && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                                            <Camera className="text-white w-8 h-8" />
                                        </div>
                                    )}

                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => e.target.files?.[0] && setEditImage(e.target.files[0])}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>

                        <button
                            onClick={handleUpdate}
                            className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-6"
                        >
                            <Save size={18} /> Save Changes
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Claims Page - View student reservations and verify pickups
function ClaimsPage() {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('active');
    const [showScanner, setShowScanner] = useState(false);
    const { success } = useNotification();

    useEffect(() => {
        fetchClaims();
    }, [filter]);

    const fetchClaims = async () => {
        setLoading(true);
        try {
            const response = await reservationAPI.getStaffClaims(filter === 'all' ? null : filter);
            setClaims(response.data);
        } catch (error) {
            console.error('Failed to fetch claims:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleScanSuccess = () => {
        setShowScanner(false);
        success('Pickup verified successfully!');
        fetchClaims(); // Refresh list
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'collected': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'expired': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'cancelled': return 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400';
            default: return 'bg-surface-100 text-surface-600';
        }
    };

    return (
        <div className="page-container">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-100">
                        Student Claims
                    </h1>
                    <p className="text-surface-500 dark:text-surface-400 mt-1">View and verify food pickups</p>
                </div>
                <button
                    onClick={() => setShowScanner(true)}
                    className="btn-primary"
                >
                    <QrCode className="w-5 h-5 mr-2" />
                    Scan QR
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {['active', 'collected', 'expired', 'all'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`
                            px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                            transition-colors duration-200
                            ${filter === status
                                ? 'bg-staff-500 text-white'
                                : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
                            }
                        `}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>

            {/* Claims List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="spinner" />
                </div>
            ) : claims.length > 0 ? (
                <div className="space-y-4">
                    {claims.map((claim) => (
                        <div
                            key={claim.id}
                            className="card hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    {/* Food Item Name */}
                                    <h3 className="font-semibold text-surface-900 dark:text-surface-100">
                                        {claim.food_item?.name || 'Unknown Item'}
                                    </h3>

                                    {/* Student Info */}
                                    <div className="flex items-center gap-2 mt-2 text-sm text-surface-600 dark:text-surface-400">
                                        <User className="w-4 h-4" />
                                        <span>{claim.student?.username || 'Unknown Student'}</span>
                                        {claim.student?.college_id && (
                                            <span className="text-surface-400">({claim.student.college_id})</span>
                                        )}
                                    </div>

                                    {/* Timestamps */}
                                    <div className="flex items-center gap-4 mt-2 text-xs text-surface-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            Reserved: {formatDate(claim.created_at)}
                                        </span>
                                        {claim.collected_at && (
                                            <span className="flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3 text-green-500" />
                                                Collected: {formatDate(claim.collected_at)}
                                            </span>
                                        )}
                                    </div>

                                    {/* QR Code Info (for debugging/manual entry) */}
                                    {claim.status === 'active' && claim.qr_code_string && (
                                        <div className="mt-3 p-2 bg-surface-50 dark:bg-surface-800 rounded-lg">
                                            <p className="text-xs text-surface-500 dark:text-surface-400 font-mono break-all">
                                                QR: {claim.qr_code_string}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Status Badge & Points */}
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(claim.status)}`}>
                                        {claim.status}
                                    </span>
                                    {claim.points_awarded > 0 && (
                                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                            +{claim.points_awarded} pts
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <Package className="empty-state-icon" />
                    <p className="empty-state-title">No claims found</p>
                    <p className="empty-state-text">
                        {filter === 'active'
                            ? 'No pending pickups at the moment'
                            : `No ${filter} claims`
                        }
                    </p>
                </div>
            )}

            {/* QR Scanner Modal */}
            <QRScanner
                isOpen={showScanner}
                onClose={() => setShowScanner(false)}
            />

            {/* Floating Scan Button */}
            <QRScannerButton onClick={() => setShowScanner(true)} />
        </div>
    );
}

// Main Staff Dashboard Router
export default function StaffDashboard() {
    return (
        <div data-theme="staff">
            <Navbar />
            <Routes>
                <Route index element={<StaffHome />} />
                <Route path="add" element={<AddFoodPage />} />
                <Route path="listings" element={<MyListingsPage />} />
                <Route path="claims" element={<ClaimsPage />} />
            </Routes>
        </div>
    );
}
