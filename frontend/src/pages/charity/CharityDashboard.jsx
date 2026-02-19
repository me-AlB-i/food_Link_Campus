/**
 * FoodLink Campus - Charity Dashboard
 * Escalated food pickups and route management
 */
import { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { foodAPI, routeAPI } from '../../services/api';
import Navbar from '../../components/shared/Navbar';
import FoodCard from '../../components/food/FoodCard';
import MapView from '../../components/maps/MapView';
import {
    MapPin, Package, Truck, CheckCircle, Play,
    Navigation, Clock, AlertCircle
} from 'lucide-react';

// Mock Map removed - using shared MapView component

// Dashboard Home
function CharityHome() {
    const { user } = useAuth();
    const [escalatedItems, setEscalatedItems] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [itemsRes, routesRes] = await Promise.all([
                foodAPI.getEscalated(),
                routeAPI.getAll()
            ]);
            setEscalatedItems(itemsRes.data);
            setRoutes(routesRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        available: escalatedItems.length,
        activeRoutes: routes.filter(r => r.status === 'in_progress').length,
        completed: routes.filter(r => r.status === 'completed').length,
    };

    return (
        <div className="page-container">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-display font-bold text-surface-900 dark:text-surface-100">
                    Welcome, {user?.organization_name || user?.username}
                </h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">
                    Manage food pickups and routes
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="card bg-charity-50 dark:bg-charity-900/30 border-charity-100 dark:border-charity-800">
                    <Package className="w-8 h-8 text-charity-600 dark:text-charity-400 mb-2" />
                    <p className="text-sm text-surface-500 dark:text-surface-400">Available</p>
                    <p className="text-2xl font-bold text-charity-700 dark:text-charity-300">{stats.available}</p>
                </div>
                <div className="card bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800">
                    <Truck className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                    <p className="text-sm text-surface-500 dark:text-surface-400">Active Routes</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.activeRoutes}</p>
                </div>
                <div className="card bg-green-50 dark:bg-green-900/30 border-green-100 dark:border-green-800">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" />
                    <p className="text-sm text-surface-500 dark:text-surface-400">Completed</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.completed}</p>
                </div>
            </div>

            {/* Map Preview */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="section-title mb-0">Pickup Locations</h2>
                    <Link to="/charity/pickups" className="text-charity-600 text-sm font-medium hover:underline">
                        View all pickups →
                    </Link>
                </div>
                <MapView items={escalatedItems.slice(0, 6)} />
            </div>

            {/* Quick Actions */}
            {escalatedItems.length > 0 && (
                <div className="card bg-charity-50 dark:bg-charity-900/30 border-charity-200 dark:border-charity-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-surface-900 dark:text-surface-100">
                                {escalatedItems.length} items ready for pickup
                            </h3>
                            <p className="text-sm text-surface-500 dark:text-surface-400">
                                Create a route to optimize your pickups
                            </p>
                        </div>
                        <Link to="/charity/routes" className="btn-primary bg-charity-500 hover:bg-charity-600">
                            <Navigation className="w-4 h-4 mr-2" />
                            Plan Route
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

// Pickups Page
function PickupsPage() {
    const [items, setItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const { success, error: showError } = useNotification();

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const response = await foodAPI.getEscalated();
            setItems(response.data);
        } catch (error) {
            console.error('Failed to fetch items:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (itemId) => {
        setSelectedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const createRoute = async () => {
        if (selectedItems.length === 0) {
            showError('Please select at least one item');
            return;
        }

        try {
            await routeAPI.create(selectedItems);
            success('Route created successfully!');
            setSelectedItems([]);
            // Refresh items
            fetchItems();
        } catch (error) {
            showError('Failed to create route');
        }
    };

    return (
        <div className="page-container">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-100">
                    Available Pickups
                </h1>
                {selectedItems.length > 0 && (
                    <button onClick={createRoute} className="btn-primary bg-charity-500 hover:bg-charity-600">
                        Create Route ({selectedItems.length} items)
                    </button>
                )}
            </div>

            {/* Map */}
            <div className="mb-8">
                <MapView items={items.filter(i => selectedItems.includes(i.id))} />
            </div>

            {/* Items Grid */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="spinner" />
                </div>
            ) : items.length > 0 ? (
                <div className="dashboard-grid">
                    {items.map((item) => {
                        const isSelected = selectedItems.includes(item.id);

                        return (
                            <div
                                key={item.id}
                                onClick={() => toggleSelect(item.id)}
                                className={`
                  cursor-pointer rounded-2xl transition-all duration-200
                  ${isSelected
                                        ? 'ring-2 ring-charity-500 ring-offset-2'
                                        : 'hover:shadow-lg'
                                    }
                `}
                            >
                                <FoodCard food={item} showReserveButton={false} showStatus={false} />
                                {isSelected && (
                                    <div className="absolute top-3 right-3 w-6 h-6 bg-charity-500 rounded-full flex items-center justify-center text-white">
                                        <CheckCircle className="w-4 h-4" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="empty-state">
                    <Package className="empty-state-icon" />
                    <p className="empty-state-title">No items available</p>
                    <p className="empty-state-text">
                        Check back later for escalated food items
                    </p>
                </div>
            )}
        </div>
    );
}

// Routes Page
function RoutesPage() {
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const { success, error: showError } = useNotification();

    useEffect(() => {
        fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        try {
            const response = await routeAPI.getAll();
            setRoutes(response.data);
        } catch (error) {
            console.error('Failed to fetch routes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (routeId, action) => {
        try {
            if (action === 'start') {
                await routeAPI.start(routeId);
                success('Route started!');
            } else if (action === 'complete') {
                await routeAPI.complete(routeId);
                success('Route completed!');
            }
            fetchRoutes();
        } catch (error) {
            showError('Action failed');
        }
    };

    const statusConfig = {
        planned: { icon: Clock, color: 'amber', label: 'Planned' },
        in_progress: { icon: Truck, color: 'blue', label: 'In Progress' },
        completed: { icon: CheckCircle, color: 'green', label: 'Completed' },
    };

    const activeRoute = routes.find(r => r.status === 'in_progress');

    return (
        <div className="page-container">
            <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-100 mb-6">
                My Routes
            </h1>

            {/* Active Route Map */}
            {activeRoute && (
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                            Current Route Map
                        </h2>
                        <span className="text-sm text-charity-600 font-medium">
                            {activeRoute.food_items?.length || 0} stops
                        </span>
                    </div>
                    <MapView items={activeRoute.food_items} />
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="spinner" />
                </div>
            ) : routes.length > 0 ? (
                <div className="space-y-4">
                    {routes.map((route) => {
                        const status = statusConfig[route.status] || statusConfig.planned;
                        const StatusIcon = status.icon;

                        return (
                            <div key={route.id} className="card">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <span className={`badge bg-${status.color}-100 text-${status.color}-700 flex items-center gap-1`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {status.label}
                                            </span>
                                            <span className="text-sm text-surface-500 dark:text-surface-400">
                                                {route.food_items?.length || 0} stops
                                            </span>
                                        </div>
                                        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                                            Created {new Date(route.created_at).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        {route.status === 'planned' && (
                                            <button
                                                onClick={() => handleAction(route.id, 'start')}
                                                className="btn-primary bg-charity-500 hover:bg-charity-600"
                                            >
                                                <Play className="w-4 h-4 mr-1" />
                                                Start
                                            </button>
                                        )}
                                        {route.status === 'in_progress' && (
                                            <button
                                                onClick={() => handleAction(route.id, 'complete')}
                                                className="btn-primary bg-green-500 hover:bg-green-600"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                Complete
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Route Items */}
                                <div className="space-y-2">
                                    {route.food_items?.map((item, index) => (
                                        <div key={item.id} className="flex items-center gap-3 p-2 bg-surface-50 dark:bg-surface-800 rounded-lg">
                                            <span className="w-6 h-6 bg-charity-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                {index + 1}
                                            </span>
                                            <span className="flex-1 text-sm dark:text-surface-200">{item.name}</span>
                                            <span className="text-xs text-surface-500 dark:text-surface-400">{item.location_name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="empty-state">
                    <Navigation className="empty-state-icon" />
                    <p className="empty-state-title">No routes created</p>
                    <p className="empty-state-text">
                        Select items from pickups to create a route
                    </p>
                    <Link to="/charity/pickups" className="btn-primary mt-4 bg-charity-500">
                        View Pickups
                    </Link>
                </div>
            )}
        </div>
    );
}

// Main Charity Dashboard Router
export default function CharityDashboard() {
    return (
        <div data-theme="charity">
            <Navbar />
            <Routes>
                <Route index element={<CharityHome />} />
                <Route path="pickups" element={<PickupsPage />} />
                <Route path="routes" element={<RoutesPage />} />
            </Routes>
        </div>
    );
}
