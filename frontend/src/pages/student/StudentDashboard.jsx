/**
 * FoodLink Campus - Student Dashboard
 * Food marketplace with full search & filter system
 */
import { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { foodAPI, reservationAPI, statsAPI } from '../../services/api';
import api from '../../services/api';
import Navbar from '../../components/shared/Navbar';
import FoodCard from '../../components/food/FoodCard';
import { QRCodeSVG } from 'qrcode.react';
import {
    ShoppingBag, Trophy, Leaf, Filter, X, Search,
    Clock, CheckCircle, AlertCircle, Medal, Gift, Lock,
    MapPin, Tag, ArrowUpDown
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import CartPage from './CartPage';

// Food Feed with full search & filter system
function StudentFeed() {
    const [foods, setFoods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFoodForReservation, setSelectedFoodForReservation] = useState(null);
    const [reservationQuantity, setReservationQuantity] = useState(1);
    const { success, error: showError } = useNotification();
    const { addToCart } = useCart();

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const [foodType, setFoodType] = useState('all');
    const [sortBy, setSortBy] = useState('default');
    const [priceRange, setPriceRange] = useState('all');
    const [selectedLocation, setSelectedLocation] = useState('all');
    const [showOffersOnly, setShowOffersOnly] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => { fetchFoods(); }, []);

    const fetchFoods = async () => {
        try {
            const response = await foodAPI.getAll({ status: 'available' });
            setFoods(response.data);
        } catch (error) { console.error('Failed to fetch foods:', error); }
        finally { setLoading(false); }
    };

    const handleAddToCart = (food) => {
        if (food.quantity > 1) { setSelectedFoodForReservation(food); setReservationQuantity(1); }
        else { addToCart(food, 1); }
    };

    const confirmAddToCart = (food, qty) => { addToCart(food, qty); setSelectedFoodForReservation(null); };

    const locations = useMemo(() => [...new Set(foods.map(f => f.location_name).filter(Boolean))], [foods]);

    const searchSuggestions = useMemo(() => {
        if (!searchQuery.trim() || searchQuery.length < 2) return [];
        const q = searchQuery.toLowerCase();
        return foods.filter(f => f.name.toLowerCase().includes(q) || (f.description && f.description.toLowerCase().includes(q)))
            .map(f => f.name).filter((v, i, a) => a.indexOf(v) === i).slice(0, 5);
    }, [foods, searchQuery]);

    const sortOptions = [
        { id: 'default', label: 'Relevance' }, { id: 'price_low', label: 'Price: Low → High' },
        { id: 'price_high', label: 'Price: High → Low' }, { id: 'expiring', label: 'Expiring Soon' },
    ];
    const priceOptions = [
        { id: 'all', label: 'All Prices' }, { id: 'free', label: 'Free' },
        { id: 'under50', label: 'Under ₹50' }, { id: '50to100', label: '₹50 - ₹100' }, { id: 'above100', label: '₹100+' },
    ];

    // Category definitions with icons
    const categories = [
        { id: 'all', label: 'All', icon: '🍽️' },
        { id: 'biryani', label: 'Biryani', icon: '🍛', keywords: ['biryani', 'pulao', 'rice'] },
        { id: 'burger', label: 'Burger', icon: '🍔', keywords: ['burger', 'sandwich', 'wrap'] },
        { id: 'pizza', label: 'Pizza', icon: '🍕', keywords: ['pizza', 'pasta', 'italian'] },
        { id: 'chicken', label: 'Chicken', icon: '🍗', keywords: ['chicken', 'wings', 'tandoori', 'tikka'] },
        { id: 'beverage', label: 'Beverage', icon: '🥤', keywords: ['juice', 'cola', 'sprite', 'fanta', 'drink', 'tea', 'coffee', 'shake', 'lassi', 'water', 'soda', 'beverage'] },
        { id: 'snacks', label: 'Snacks', icon: '🍟', keywords: ['samosa', 'fries', 'chips', 'snack', 'pakora', 'vada', 'bhaji', 'puff', 'roll', 'chaat'] },
        { id: 'bakery', label: 'Bakery', icon: '🧁', keywords: ['cake', 'bread', 'cookie', 'pastry', 'biscuit', 'muffin', 'brownie', 'bun', 'bakery', 'bourbon'] },
        { id: 'dessert', label: 'Dessert', icon: '🍰', keywords: ['dessert', 'sweet', 'ice cream', 'gulab', 'kheer', 'halwa', 'jalebi', 'rasgulla'] },
        { id: 'seafood', label: 'Seafood', icon: '🦐', keywords: ['fish', 'prawn', 'shrimp', 'seafood', 'crab'] },
        { id: 'thali', label: 'Thali', icon: '🥘', keywords: ['thali', 'meal', 'combo', 'plate'] },
        { id: 'chinese', label: 'Chinese', icon: '🥡', keywords: ['noodles', 'momos', 'manchurian', 'fried rice', 'chowmein', 'chinese'] },
    ];

    const filteredFoods = useMemo(() => {
        let result = [...foods];
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(f => f.name.toLowerCase().includes(q) || (f.description && f.description.toLowerCase().includes(q)) || (f.location_name && f.location_name.toLowerCase().includes(q)));
        }
        if (foodType !== 'all') result = result.filter(f => f.food_type === foodType);
        if (priceRange === 'free') result = result.filter(f => parseFloat(f.price) === 0);
        else if (priceRange === 'under50') result = result.filter(f => parseFloat(f.price) > 0 && parseFloat(f.price) <= 50);
        else if (priceRange === '50to100') result = result.filter(f => parseFloat(f.price) > 50 && parseFloat(f.price) <= 100);
        else if (priceRange === 'above100') result = result.filter(f => parseFloat(f.price) > 100);
        if (selectedLocation !== 'all') result = result.filter(f => f.location_name === selectedLocation);
        if (showOffersOnly) result = result.filter(f => parseFloat(f.retail_price) > parseFloat(f.price));
        // Category filter
        if (selectedCategory !== 'all') {
            const cat = categories.find(c => c.id === selectedCategory);
            if (cat && cat.keywords) {
                result = result.filter(f => {
                    const text = `${f.name} ${f.description || ''}`.toLowerCase();
                    return cat.keywords.some(kw => text.includes(kw));
                });
            }
        }
        if (sortBy === 'price_low') result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        else if (sortBy === 'price_high') result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        else if (sortBy === 'expiring') result.sort((a, b) => (parseInt(a.time_remaining) || 999) - (parseInt(b.time_remaining) || 999));
        return result;
    }, [foods, searchQuery, foodType, priceRange, selectedLocation, showOffersOnly, sortBy, selectedCategory]);

    const activeFilterCount = [foodType !== 'all', priceRange !== 'all', selectedLocation !== 'all', showOffersOnly, sortBy !== 'default', selectedCategory !== 'all'].filter(Boolean).length;
    const hasActiveFilters = searchQuery.trim() || activeFilterCount > 0;
    const clearAllFilters = () => { setSearchQuery(''); setFoodType('all'); setSortBy('default'); setPriceRange('all'); setSelectedLocation('all'); setShowOffersOnly(false); setSelectedCategory('all'); };

    return (
        <div className="page-container">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-surface-900 dark:text-surface-100">Food Feed</h1>
                    <p className="text-surface-500 dark:text-surface-400 mt-0.5 text-sm">
                        {filteredFoods.length === foods.length ? `${foods.length} items available` : `${filteredFoods.length} of ${foods.length} items`}
                    </p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-3">
                <div className={`relative flex items-center rounded-2xl border transition-all duration-300 ${searchFocused ? 'border-student-400 dark:border-student-500 shadow-lg shadow-student-500/10 ring-2 ring-student-500/20' : 'border-surface-200 dark:border-surface-600 shadow-sm hover:shadow-md'} bg-white dark:bg-surface-800`}>
                    <Search className="absolute left-4 w-5 h-5 text-surface-400 dark:text-surface-500 pointer-events-none" />
                    <input id="food-search" type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setSearchFocused(true)} onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                        placeholder="Search for biryani, pizza, samosa..."
                        className="w-full pl-12 pr-20 py-3 rounded-2xl bg-transparent text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-500 text-sm focus:outline-none" />
                    <div className="absolute right-2 flex items-center gap-1">
                        {searchQuery && <button onClick={() => setSearchQuery('')} className="p-1.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-full transition-colors"><X className="w-4 h-4" /></button>}
                        <button onClick={() => setShowFilters(!showFilters)}
                            className={`p-2 rounded-xl transition-all duration-200 relative ${showFilters || activeFilterCount > 0 ? 'bg-student-500 text-white shadow-md' : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700'}`}>
                            <Filter className="w-4 h-4" />
                            {activeFilterCount > 0 && !showFilters && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{activeFilterCount}</span>}
                        </button>
                    </div>
                </div>
                {searchFocused && searchSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-600 rounded-xl shadow-xl z-50 overflow-hidden">
                        {searchSuggestions.map((s, i) => (
                            <button key={i} onMouseDown={(e) => { e.preventDefault(); setSearchQuery(s); setSearchFocused(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-student-50 dark:hover:bg-student-900/20 transition-colors text-left">
                                <Search className="w-3.5 h-3.5 text-surface-400 flex-shrink-0" />
                                <span dangerouslySetInnerHTML={{ __html: s.replace(new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<strong class="text-student-600 dark:text-student-400">$1</strong>') }} />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ─── Category Cards ─── */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100">Category</h3>
                    {selectedCategory !== 'all' && (
                        <button onClick={() => setSelectedCategory('all')} className="text-xs font-semibold text-student-600 dark:text-student-400 hover:text-student-700 flex items-center gap-0.5 transition-colors">View all <span className="text-base leading-none">›</span></button>
                    )}
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(selectedCategory === cat.id ? 'all' : cat.id)}
                            className={`flex flex-col items-center gap-1.5 flex-shrink-0 group transition-all duration-200`}
                        >
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl transition-all duration-200 border-2 ${selectedCategory === cat.id
                                    ? 'bg-student-50 dark:bg-student-900/30 border-student-500 shadow-lg shadow-student-500/20 scale-105'
                                    : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-600 group-hover:border-surface-300 dark:group-hover:border-surface-500 group-hover:shadow-md'
                                }`}>
                                {cat.icon}
                            </div>
                            <span className={`text-[11px] font-semibold transition-colors ${selectedCategory === cat.id
                                    ? 'text-student-600 dark:text-student-400'
                                    : 'text-surface-600 dark:text-surface-400 group-hover:text-surface-900 dark:group-hover:text-surface-200'
                                }`}>{cat.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Chips Row — Type + Price + Location + Offers */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {[{ id: 'all', label: 'All' }, { id: 'veg', label: '🥬 Veg' }, { id: 'non-veg', label: '🍗 Non-Veg' }].map(t => (
                    <button key={t.id} onClick={() => setFoodType(t.id)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border flex-shrink-0 ${foodType === t.id ? (t.id === 'veg' ? 'bg-green-500 text-white border-transparent shadow-md' : t.id === 'non-veg' ? 'bg-red-500 text-white border-transparent shadow-md' : 'bg-surface-900 dark:bg-white text-white dark:text-surface-900 border-transparent shadow-md') : 'bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 border-surface-200 dark:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-700'}`}>{t.label}</button>
                ))}
                <div className="w-px bg-surface-200 dark:bg-surface-600 self-stretch my-1 flex-shrink-0" />
                <button onClick={() => setShowOffersOnly(!showOffersOnly)} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border flex-shrink-0 ${showOffersOnly ? 'bg-red-500 text-white border-transparent shadow-md' : 'bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 border-surface-200 dark:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-700'}`}>🏷️ Offers{showOffersOnly && <X className="w-3 h-3 ml-0.5" />}</button>
                {priceOptions.filter(p => p.id !== 'all').map(p => (
                    <button key={p.id} onClick={() => setPriceRange(priceRange === p.id ? 'all' : p.id)}
                        className={`px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border flex-shrink-0 ${priceRange === p.id ? 'bg-student-500 text-white border-transparent shadow-md' : 'bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 border-surface-200 dark:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-700'}`}>
                        {p.id === 'free' ? '🆓' : '💰'} {p.label}{priceRange === p.id && <X className="w-3 h-3 ml-1 inline" />}
                    </button>
                ))}
                {locations.map(loc => (
                    <button key={loc} onClick={() => setSelectedLocation(selectedLocation === loc ? 'all' : loc)}
                        className={`flex items-center gap-1 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border flex-shrink-0 ${selectedLocation === loc ? 'bg-blue-500 text-white border-transparent shadow-md' : 'bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 border-surface-200 dark:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-700'}`}>
                        📍 {loc}{selectedLocation === loc && <X className="w-3 h-3 ml-0.5" />}
                    </button>
                ))}
            </div>

            {/* Expandable Filter Panel */}
            {showFilters && (
                <div className="mt-2 mb-4 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-600 rounded-2xl p-5 shadow-lg animate-slide-up space-y-5">
                    <div>
                        <h4 className="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5"><ArrowUpDown className="w-3.5 h-3.5" />Sort By</h4>
                        <div className="flex flex-wrap gap-2">
                            {sortOptions.map(opt => (<button key={opt.id} onClick={() => setSortBy(opt.id)} className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${sortBy === opt.id ? 'bg-student-500 text-white border-student-500 shadow-sm' : 'bg-surface-50 dark:bg-surface-700 text-surface-600 dark:text-surface-300 border-surface-200 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-600'}`}>{opt.label}</button>))}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2.5">💰 Price Range</h4>
                        <div className="flex flex-wrap gap-2">
                            {priceOptions.map(opt => (<button key={opt.id} onClick={() => setPriceRange(opt.id)} className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${priceRange === opt.id ? 'bg-student-500 text-white border-student-500 shadow-sm' : 'bg-surface-50 dark:bg-surface-700 text-surface-600 dark:text-surface-300 border-surface-200 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-600'}`}>{opt.label}</button>))}
                        </div>
                    </div>
                    {locations.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2.5">📍 Location</h4>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => setSelectedLocation('all')} className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${selectedLocation === 'all' ? 'bg-student-500 text-white border-student-500' : 'bg-surface-50 dark:bg-surface-700 text-surface-600 dark:text-surface-300 border-surface-200 dark:border-surface-600'}`}>All Locations</button>
                                {locations.map(loc => (<button key={loc} onClick={() => setSelectedLocation(loc)} className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all border flex items-center gap-1.5 ${selectedLocation === loc ? 'bg-student-500 text-white border-student-500' : 'bg-surface-50 dark:bg-surface-700 text-surface-600 dark:text-surface-300 border-surface-200 dark:border-surface-600'}`}><MapPin className="w-3 h-3" />{loc}</button>))}
                            </div>
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><Tag className="w-4 h-4 text-red-500" /><span className="text-sm font-medium text-surface-700 dark:text-surface-300">Show Offers Only</span></div>
                        <button onClick={() => setShowOffersOnly(!showOffersOnly)} className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${showOffersOnly ? 'bg-student-500' : 'bg-surface-300 dark:bg-surface-600'}`}>
                            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${showOffersOnly ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                        </button>
                    </div>
                    {activeFilterCount > 0 && (<button onClick={clearAllFilters} className="w-full py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2"><X className="w-4 h-4" />Reset All Filters ({activeFilterCount})</button>)}
                </div>
            )}

            {/* Active Filter Summary */}
            {hasActiveFilters && !showFilters && (
                <div className="flex items-center justify-between my-3 px-3 py-2 bg-student-50 dark:bg-student-900/20 rounded-xl border border-student-100 dark:border-student-800">
                    <div className="flex items-center gap-2 flex-wrap text-xs text-student-700 dark:text-student-300">
                        <strong>{filteredFoods.length}</strong> result{filteredFoods.length !== 1 ? 's' : ''}
                        {searchQuery && <span className="px-2 py-0.5 bg-student-100 dark:bg-student-800 rounded-full">"{searchQuery}"</span>}
                        {foodType !== 'all' && <span className="px-2 py-0.5 bg-student-100 dark:bg-student-800 rounded-full capitalize">{foodType}</span>}
                        {priceRange !== 'all' && <span className="px-2 py-0.5 bg-student-100 dark:bg-student-800 rounded-full">{priceOptions.find(p => p.id === priceRange)?.label}</span>}
                        {selectedLocation !== 'all' && <span className="px-2 py-0.5 bg-student-100 dark:bg-student-800 rounded-full">📍 {selectedLocation}</span>}
                        {showOffersOnly && <span className="px-2 py-0.5 bg-student-100 dark:bg-student-800 rounded-full">🏷️ Offers</span>}
                        {sortBy !== 'default' && <span className="px-2 py-0.5 bg-student-100 dark:bg-student-800 rounded-full">↕ {sortOptions.find(s => s.id === sortBy)?.label}</span>}
                    </div>
                    <button onClick={clearAllFilters} className="text-xs font-semibold text-student-600 dark:text-student-400 hover:text-student-800 flex items-center gap-1 flex-shrink-0 ml-2"><X className="w-3 h-3" /> Clear</button>
                </div>
            )}

            {/* Food Grid */}
            {loading ? (<div className="flex justify-center py-12"><div className="spinner" /></div>
            ) : filteredFoods.length > 0 ? (
                <div className="dashboard-grid">{filteredFoods.map((food) => (<FoodCard key={food.id} food={food} onReserve={handleAddToCart} showReserveButton={true} />))}</div>
            ) : (
                <div className="empty-state">
                    <ShoppingBag className="empty-state-icon" />
                    <p className="empty-state-title">{hasActiveFilters ? 'No matching food found' : 'No food available'}</p>
                    <p className="empty-state-text">{hasActiveFilters ? 'Try adjusting your filters or search query' : 'Check back later for new listings from the canteen'}</p>
                    {hasActiveFilters && <button onClick={clearAllFilters} className="btn-primary mt-4">Clear All Filters</button>}
                </div>
            )}

            {/* Quantity Modal */}
            {selectedFoodForReservation && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 max-w-sm w-full animate-scale-in shadow-xl">
                        <h3 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">Select Quantity</h3>
                        <p className="text-surface-600 dark:text-surface-300 mb-6 text-sm">How many <strong>{selectedFoodForReservation.unit}</strong> of {selectedFoodForReservation.name} do you need?</p>
                        <div className="flex items-center justify-between bg-surface-100 dark:bg-surface-700 rounded-xl p-4 mb-8">
                            <button onClick={() => setReservationQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-lg bg-white dark:bg-surface-600 shadow-sm flex items-center justify-center text-xl font-bold hover:bg-surface-50 dark:hover:bg-surface-500 transition-colors">-</button>
                            <span className="text-3xl font-bold text-surface-900 dark:text-surface-100 font-display">{reservationQuantity}</span>
                            <button onClick={() => setReservationQuantity(q => Math.min(selectedFoodForReservation.quantity, q + 1))} className="w-10 h-10 rounded-lg bg-white dark:bg-surface-600 shadow-sm flex items-center justify-center text-xl font-bold hover:bg-surface-50 dark:hover:bg-surface-500 transition-colors">+</button>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setSelectedFoodForReservation(null)} className="flex-1 py-3 rounded-xl font-semibold bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors">Cancel</button>
                            <button onClick={() => confirmAddToCart(selectedFoodForReservation, reservationQuantity)} className="flex-1 py-3 rounded-xl font-semibold bg-student-500 text-white hover:bg-student-600 shadow-lg shadow-student-500/20 transition-all">Add to Cart</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Reservations Page
function ReservationsPage() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedQR, setSelectedQR] = useState(null);
    useEffect(() => { fetchReservations(); }, []);
    const fetchReservations = async () => {
        try { const response = await reservationAPI.getAll(); setReservations(response.data); }
        catch (error) { console.error('Failed to fetch reservations:', error); }
        finally { setLoading(false); }
    };
    const statusConfig = {
        active: { icon: Clock, color: 'amber', label: 'Pending Pickup' },
        collected: { icon: CheckCircle, color: 'green', label: 'Collected' },
        expired: { icon: AlertCircle, color: 'red', label: 'Expired' },
    };
    return (
        <div className="page-container">
            <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-100 mb-6">My Reservations</h1>
            {loading ? (<div className="flex justify-center py-12"><div className="spinner" /></div>
            ) : reservations.length > 0 ? (
                <div className="space-y-4">
                    {reservations.map((reservation) => {
                        const status = statusConfig[reservation.status] || statusConfig.active;
                        const StatusIcon = status.icon;
                        return (
                            <div key={reservation.id} className="card flex gap-4">
                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-semibold text-surface-900">{reservation.food_item?.name}</h3>
                                            <p className="text-sm text-surface-500">{reservation.food_item?.quantity} {reservation.food_item?.unit}</p>
                                            {(parseFloat(reservation.food_item?.price) >= 0) && (
                                                <div className="mt-1 flex items-center gap-2">
                                                    <span className="font-bold text-green-600 dark:text-green-400 text-sm">{parseFloat(reservation.food_item?.price) > 0 ? `₹${reservation.food_item?.price}` : 'Free'}</span>
                                                    {parseFloat(reservation.food_item?.retail_price) > parseFloat(reservation.food_item?.price) && (<span className="text-xs text-surface-400 dark:text-surface-500 line-through">₹{reservation.food_item?.retail_price}</span>)}
                                                </div>
                                            )}
                                        </div>
                                        <span className={`badge bg-${status.color}-100 text-${status.color}-700 flex items-center gap-1`}><StatusIcon className="w-3 h-3" />{status.label}</span>
                                    </div>
                                    {reservation.status === 'active' && (<button onClick={() => setSelectedQR(reservation)} className="btn-primary mt-4">Show QR Code</button>)}
                                    {reservation.status === 'collected' && reservation.points_awarded > 0 && (<p className="text-sm text-green-600 mt-2 flex items-center gap-1"><Trophy className="w-4 h-4" />+{reservation.points_awarded} Green Points earned!</p>)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="empty-state"><ShoppingBag className="empty-state-icon" /><p className="empty-state-title">No reservations yet</p><p className="empty-state-text">Reserve food from the feed to see it here</p><Link to="/student" className="btn-primary mt-4">Browse Food</Link></div>
            )}
            {selectedQR && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 max-w-sm w-full text-center animate-slide-up relative">
                        <button onClick={() => setSelectedQR(null)} className="absolute top-4 right-4 p-2 text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300"><X className="w-5 h-5" /></button>
                        <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-2">Your Pickup QR Code</h3>
                        <p className="text-surface-500 dark:text-surface-400 text-sm mb-6">Show this to canteen staff to collect your food</p>
                        <div className="bg-white p-4 rounded-xl inline-block border border-surface-200 dark:border-surface-600 mb-4"><QRCodeSVG value={`${selectedQR.qr_code_string}|${selectedQR.qr_signature || ''}`} size={200} level="H" /></div>
                        <p className="text-xs text-surface-400 dark:text-surface-500 font-mono break-all">{selectedQR.qr_code_string}</p>
                        <button onClick={() => setSelectedQR(null)} className="btn-secondary w-full mt-6">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Leaderboard Page
function LeaderboardPage() {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    useEffect(() => { fetchLeaderboard(); }, []);
    const fetchLeaderboard = async () => {
        try { const response = await statsAPI.getLeaderboard(20); setLeaders(response.data); }
        catch (error) { console.error('Failed to fetch leaderboard:', error); }
        finally { setLoading(false); }
    };
    const getMedalColor = (rank) => { if (rank === 1) return 'text-yellow-500'; if (rank === 2) return 'text-gray-400'; if (rank === 3) return 'text-amber-600'; return 'text-surface-300'; };
    return (
        <div className="page-container max-w-2xl">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-student-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trophy className="w-8 h-8 text-student-600" /></div>
                <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-100">Green Points Leaderboard</h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">Top food rescuers on campus</p>
            </div>
            {user && (
                <div className="card bg-student-50 dark:bg-student-900/30 border-student-200 dark:border-student-800 mb-6">
                    <div className="flex items-center justify-between">
                        <div><p className="text-sm text-student-600 dark:text-student-400">Your Points</p><p className="text-3xl font-bold text-student-700 dark:text-student-300">{user.sustainability_points || 0}</p></div>
                        <div className="w-12 h-12 bg-student-100 dark:bg-student-800 rounded-full flex items-center justify-center"><Leaf className="w-6 h-6 text-student-600 dark:text-student-400" /></div>
                    </div>
                </div>
            )}
            {loading ? (<div className="flex justify-center py-12"><div className="spinner" /></div>
            ) : leaders.length > 0 ? (
                <div className="space-y-2">
                    {leaders.map((leader) => {
                        const isCurrentUser = user?.username === leader.username;
                        return (
                            <div key={leader.username} className={`flex items-center gap-4 p-4 rounded-xl ${isCurrentUser ? 'bg-student-50 dark:bg-student-900/30 border-2 border-student-200 dark:border-student-700' : 'bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700'}`}>
                                <div className="w-10 text-center">{leader.rank <= 3 ? <Medal className={`w-6 h-6 mx-auto ${getMedalColor(leader.rank)}`} /> : <span className="text-lg font-bold text-surface-400 dark:text-surface-500">{leader.rank}</span>}</div>
                                <div className="flex-1"><p className="font-medium text-surface-900 dark:text-surface-100">{leader.full_name || leader.username}{isCurrentUser && <span className="text-student-600 dark:text-student-400 ml-2">(You)</span>}</p>{leader.college_id && <p className="text-xs text-surface-500 dark:text-surface-400">{leader.college_id}</p>}</div>
                                <div className="text-right"><p className="text-lg font-bold text-student-600 dark:text-student-400">{leader.sustainability_points}</p><p className="text-xs text-surface-500 dark:text-surface-400">points</p></div>
                            </div>
                        );
                    })}
                </div>
            ) : (<div className="empty-state"><Trophy className="empty-state-icon" /><p className="empty-state-title">No leaders yet</p><p className="empty-state-text">Be the first to rescue food and earn points!</p></div>)}
        </div>
    );
}

// Rewards Page
function RewardsPage() {
    const { user } = useAuth();
    const [points, setPoints] = useState(0);
    const TARGET_POINTS = 200;
    const REWARDS = [
        { brand: 'Zomato', offer: 'Flat 50% OFF', code: 'ZOMATO50', color: 'from-rose-500 to-red-600', exp: '2 days' },
        { brand: 'Swiggy', offer: 'Free Delivery', code: 'SWIGGYFREE', color: 'from-orange-400 to-orange-600', exp: '5 hours' },
        { brand: 'Dominos', offer: 'Free Choco Lava', code: 'DOMILAVA', color: 'from-blue-600 to-indigo-700', exp: '1 day' },
        { brand: 'KFC', offer: 'Buy 1 Get 1', code: 'KFCBOGO', color: 'from-red-600 to-red-800', exp: '48 hours' },
        { brand: 'Starbucks', offer: 'Free Resize', code: 'COFFEEUP', color: 'from-emerald-600 to-teal-800', exp: '1 week' },
        { brand: 'Burger King', offer: 'Whopper @ ₹99', code: 'KING99', color: 'from-amber-600 to-orange-700', exp: '3 days' }
    ];
    useEffect(() => {
        api.get('/auth/me/').then(res => setPoints(res.data.sustainability_points || 0)).catch(() => { if (user) setPoints(user.sustainability_points || 0); });
    }, [user]);
    const progress = Math.min((points / TARGET_POINTS) * 100, 100);
    const isUnlocked = points >= TARGET_POINTS;
    return (
        <div className="page-container">
            <div className="flex justify-between items-center mb-6">
                <div><h1 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-100">Rewards</h1><p className="text-surface-500 dark:text-surface-400 mt-1">Earn points to unlock exclusive deals!</p></div>
                <div className="bg-student-100 dark:bg-student-900/30 px-4 py-2 rounded-lg border border-student-200 dark:border-student-800"><div className="flex items-center gap-2 text-student-700 dark:text-student-300 font-bold"><Trophy className="w-5 h-5" /><span>{points} Points</span></div></div>
            </div>
            <div className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-sm border border-surface-200 dark:border-surface-700 mb-8">
                <div className="flex justify-between mb-2"><span className="text-sm font-medium text-surface-600 dark:text-surface-400">Progress to Rewards</span><span className="text-sm font-bold text-student-600 dark:text-student-400">{points}/{TARGET_POINTS}</span></div>
                <div className="h-4 bg-surface-100 dark:bg-surface-900 rounded-full overflow-hidden mb-3"><div className="h-full bg-gradient-to-r from-student-500 to-student-400 transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} /></div>
                <p className="text-sm text-surface-500 dark:text-surface-400 flex items-center gap-2">{isUnlocked ? <><CheckCircle className="w-4 h-4 text-green-500" /> Goal Reached! You have unlocked partner offers.</> : <><Trophy className="w-4 h-4 text-student-500" /> Collect {Math.max(0, TARGET_POINTS - points)} more points to unlock.</>}</p>
            </div>
            <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100 mb-4">Available Offers</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {REWARDS.map((reward) => (
                    <div key={reward.brand} className={`relative rounded-xl p-6 shadow-lg overflow-hidden transition-all ${isUnlocked ? `bg-gradient-to-br ${reward.color} text-white group hover:scale-[1.02] cursor-pointer` : 'bg-surface-100 dark:bg-surface-800 grayscale border border-surface-200 dark:border-surface-700 opacity-90'}`}>
                        {!isUnlocked && (<div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/10 dark:bg-black/10 backdrop-blur-[1px]"><div className="bg-surface-900/80 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-xl backdrop-blur-md"><Lock size={14} /><span className="text-xs font-bold uppercase tracking-wider">Locked</span></div></div>)}
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Gift size={80} /></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className={`text-2xl font-bold ${!isUnlocked ? 'text-surface-700 dark:text-surface-300' : ''}`}>{reward.brand}</h3>
                                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-sm ${isUnlocked ? 'bg-black/20' : 'bg-surface-200 dark:bg-surface-700 text-surface-500'}`}><Clock size={12} /><span>{reward.exp}</span></div>
                            </div>
                            <p className={`font-medium mb-4 text-lg ${isUnlocked ? 'text-white/90' : 'text-surface-500 dark:text-surface-400 blur-[3px] select-none'}`}>{isUnlocked ? reward.offer : 'Hidden Offer Details'}</p>
                            <div className={`rounded-lg p-3 border flex justify-between items-center ${isUnlocked ? 'bg-white/20 border-white/30' : 'bg-surface-200 dark:bg-surface-700 border-transparent'}`}>
                                <span className={`text-xs uppercase tracking-wider ${isUnlocked ? 'text-white/70' : 'text-surface-400'}`}>Code</span>
                                {isUnlocked ? <span className="font-mono font-bold tracking-wider text-white bg-black/10 px-2 py-0.5 rounded border border-white/10 select-all">{reward.code}</span> : <span className="font-mono font-bold tracking-wider text-surface-400">••••••••</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {!isUnlocked && (<div className="mt-8 p-4 bg-student-50 dark:bg-student-900/20 rounded-xl border border-student-100 dark:border-student-800 text-center"><p className="text-student-700 dark:text-student-300 text-sm">Keep reserving food to earn points. 1 Reservation = 10 to 50 Points!</p></div>)}
        </div>
    );
}

// Profile Page
function ProfilePage() {
    const { user, login } = useAuth();
    const [uploading, setUploading] = useState(false);
    const { success, error: showError } = useNotification();
    const [preview, setPreview] = useState(null);
    const handleFileChange = (e) => { const file = e.target.files[0]; if (file) setPreview(URL.createObjectURL(file)); };
    const handleUpload = async (e) => {
        e.preventDefault();
        const fileInput = e.target.elements.id_card_image;
        if (!fileInput.files[0]) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('id_card_image', fileInput.files[0]);
        try {
            await api.put('/auth/profile/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            success('ID Card uploaded successfully! Please wait for admin approval.');
            window.location.reload();
        } catch (error) { console.error(error); showError('Failed to upload ID card'); }
        finally { setUploading(false); }
    };
    return (
        <div className="page-container max-w-2xl">
            <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-100 mb-6">My Profile</h1>
            <div className="card space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-student-100 rounded-full flex items-center justify-center text-3xl font-bold text-student-600">{user.username[0].toUpperCase()}</div>
                    <div>
                        <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100">{user.full_name}</h2>
                        <p className="text-surface-500">{user.email}</p>
                        <div className="mt-2 flex items-center gap-2">
                            <span className="badge bg-student-100 text-student-700 capitalize">{user.role}</span>
                            {user.is_approved ? (<span className="badge bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Verified</span>) : (<span className="badge bg-orange-100 text-orange-700 flex items-center gap-1"><Clock className="w-3 h-3" /> Verification Pending</span>)}
                        </div>
                    </div>
                </div>
                <div className="border-t border-surface-100 dark:border-surface-700 pt-6">
                    <h3 className="font-semibold text-lg mb-4 text-surface-900 dark:text-surface-100">Student Verification</h3>
                    {!user.is_approved && (
                        <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-xl p-4 mb-6">
                            <div className="flex gap-3"><AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" /><div><p className="font-medium text-orange-900 dark:text-orange-100">Action Required</p><p className="text-sm text-orange-700 dark:text-orange-300 mt-1">You must upload your Student ID Card to reserve food. Once uploaded, an Admin will review and approve your account.</p></div></div>
                        </div>
                    )}
                    {user.id_card_image_url && (<div className="mb-6"><p className="text-sm font-medium mb-2 text-surface-700">Current ID Card:</p><img src={`http://127.0.0.1:8000${user.id_card_image_url}`} alt="ID Card" className="w-full max-w-sm rounded-lg border border-surface-200" />{!user.is_approved && <p className="text-xs text-surface-500 mt-2">Waiting for approval...</p>}</div>)}
                    {!user.is_approved && (
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Upload ID Card Photo</label>
                                <div className="border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl p-8 text-center hover:border-student-500 transition-colors bg-surface-50 dark:bg-surface-800/50">
                                    <input type="file" name="id_card_image" accept="image/*" onChange={handleFileChange} className="hidden" id="id-upload" required />
                                    <label htmlFor="id-upload" className="cursor-pointer">
                                        <div className="mx-auto w-12 h-12 bg-student-100 dark:bg-student-900/50 rounded-full flex items-center justify-center mb-3"><ShoppingBag className="w-6 h-6 text-student-600" /></div>
                                        {preview ? (<img src={preview} alt="Preview" className="mx-auto max-h-48 rounded-lg mb-2 shadow-md" />) : (<><p className="font-medium text-surface-900 dark:text-surface-100">Click to upload photo</p><p className="text-sm text-surface-500 mt-1">SVG, PNG, JPG or GIF (max. 5MB)</p></>)}
                                    </label>
                                </div>
                            </div>
                            <button type="submit" disabled={uploading} className="btn-primary w-full">{uploading ? <span className="spinner" /> : 'Upload for Verification'}</button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

// Main Student Dashboard Router
export default function StudentDashboard() {
    const { user } = useAuth();
    return (
        <div data-theme="student">
            <Navbar />
            {!user?.is_approved && (<div className="bg-orange-600 text-white text-center py-2 px-4 text-sm font-medium">Your account is not verified. You cannot reserve food until you <Link to="/student/profile" className="underline hover:text-orange-100">upload your ID card</Link>.</div>)}
            <Routes>
                <Route index element={<StudentFeed />} />
                <Route path="reservations" element={<ReservationsPage />} />
                <Route path="leaderboard" element={<LeaderboardPage />} />
                <Route path="rewards" element={<RewardsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="cart" element={<CartPage />} />
            </Routes>
        </div>
    );
}
