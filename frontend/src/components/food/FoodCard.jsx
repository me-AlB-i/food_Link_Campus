/**
 * FoodLink Campus - Food Card Component
 * Swiggy/Zomato-style food card with inline offer display
 */
import { useState } from 'react';
import { Clock, Leaf, Drumstick, MapPin, User, ShoppingCart, Percent, Tag } from 'lucide-react';

const typeConfig = {
    veg: {
        icon: Leaf,
        label: 'Veg',
        bgClass: 'bg-green-100',
        textClass: 'text-green-700',
        dotClass: 'bg-green-500',
    },
    'non-veg': {
        icon: Drumstick,
        label: 'Non-Veg',
        bgClass: 'bg-red-100',
        textClass: 'text-red-700',
        dotClass: 'bg-red-500',
    },
};

const statusConfig = {
    available: { label: 'Available', class: 'badge-available' },
    reserved: { label: 'Reserved', class: 'badge-reserved' },
    collected: { label: 'Collected', class: 'badge-collected' },
    escalated: { label: 'For Charity', class: 'badge-escalated' },
    expired: { label: 'Expired', class: 'badge-expired' },
};

export default function FoodCard({
    food,
    onReserve,
    showReserveButton = true,
    showStatus = true,
    isLoading = false
}) {
    const [imageError, setImageError] = useState(false);

    const typeInfo = typeConfig[food.food_type] || typeConfig.veg;
    const TypeIcon = typeInfo.icon;
    const statusInfo = statusConfig[food.status] || statusConfig.available;

    const canReserve = food.can_reserve && food.status === 'available';

    // Calculate discount
    const retailPrice = Math.round(parseFloat(food.retail_price) || 0);
    const offerPrice = Math.round(parseFloat(food.price) || 0);
    const hasDiscount = retailPrice > offerPrice && offerPrice >= 0;
    const discountPercent = hasDiscount ? Math.round(((retailPrice - offerPrice) / retailPrice) * 100) : 0;

    return (
        <div className="card group hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            {/* Image */}
            <div className="relative h-44 -mx-6 -mt-6 mb-0 overflow-hidden rounded-t-2xl bg-surface-100 dark:bg-surface-700">
                {food.image_url && !imageError ? (
                    <img
                        src={food.image_url}
                        alt={food.name}
                        onError={() => setImageError(true)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className={`w-16 h-16 ${typeInfo.bgClass} rounded-full flex items-center justify-center`}>
                            <TypeIcon className={`w-8 h-8 ${typeInfo.textClass}`} />
                        </div>
                    </div>
                )}

                {/* Dark gradient overlay at bottom of image for text readability */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                {/* Type Badge - top left */}
                <div className={`absolute top-3 left-3 ${typeInfo.bgClass} ${typeInfo.textClass} px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 backdrop-blur-sm shadow-sm`}>
                    <span className={`w-2 h-2 rounded-full ${typeInfo.dotClass}`} />
                    {typeInfo.label}
                </div>

                {/* Discount Badge - Swiggy/Zomato style ribbon on top right */}
                {hasDiscount && food.status === 'available' && (
                    <div className="absolute top-0 right-3">
                        <div className="bg-gradient-to-b from-blue-600 to-blue-700 text-white px-3 pt-2 pb-3 rounded-b-lg shadow-lg text-center"
                            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)' }}>
                            <span className="text-lg font-extrabold leading-none block">{discountPercent}%</span>
                            <span className="text-[10px] font-bold tracking-wider uppercase">OFF</span>
                        </div>
                    </div>
                )}

                {/* Status Badge - top right (only when not available, no discount shown) */}
                {showStatus && food.status !== 'available' && (
                    <div className={`absolute top-3 right-3 badge ${statusInfo.class}`}>
                        {statusInfo.label}
                    </div>
                )}

                {/* Offer text strip at bottom of image — Swiggy style */}
                {hasDiscount && food.status === 'available' && (
                    <div className="absolute bottom-0 left-0 right-0 px-3 pb-2">
                        <div className="flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-white flex-shrink-0" />
                            <span className="text-white text-xs font-bold uppercase tracking-wide drop-shadow-lg">
                                {offerPrice > 0
                                    ? `₹${Math.round(retailPrice - offerPrice)} OFF — NOW ₹${offerPrice}`
                                    : `FLAT ₹${retailPrice} OFF — FREE`}
                            </span>
                        </div>
                    </div>
                )}

                {/* Price on image when NO discount */}
                {!hasDiscount && offerPrice >= 0 && food.status === 'available' && (
                    <div className="absolute bottom-0 left-0 px-3 pb-2">
                        <span className="text-white text-sm font-bold drop-shadow-lg">
                            {offerPrice > 0 ? `₹${offerPrice}` : 'FREE'}
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="pt-3">
                {/* Name + Price Row */}
                <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-base font-bold text-surface-900 dark:text-surface-100 line-clamp-1 flex-1">
                        {food.name}
                    </h3>
                    {/* Price display */}
                    {offerPrice >= 0 && (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            {hasDiscount && (
                                <span className="text-surface-400 dark:text-surface-500 line-through text-xs">
                                    ₹{retailPrice}
                                </span>
                            )}
                            <span className={`font-extrabold text-base ${hasDiscount ? 'text-green-600 dark:text-green-400' : 'text-surface-800 dark:text-surface-200'}`}>
                                {offerPrice > 0 ? `₹${offerPrice}` : 'Free'}
                            </span>
                        </div>
                    )}
                </div>

                {food.description && (
                    <p className="text-xs text-surface-500 dark:text-surface-400 mb-2 line-clamp-1">
                        {food.description}
                    </p>
                )}

                {/* Offer coupon-style strip below name */}
                {hasDiscount && food.status === 'available' && (
                    <div className="flex items-center gap-2 mb-2 px-2.5 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-dashed border-blue-300 dark:border-blue-700 rounded-lg">
                        <Percent className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                            Save ₹{Math.round(retailPrice - offerPrice)} • {discountPercent}% discount applied
                        </span>
                    </div>
                )}

                {/* Meta: Quantity + Time */}
                <div className="flex items-center justify-between text-xs text-surface-500 dark:text-surface-400 mb-3">
                    <div className="flex items-center gap-1">
                        <span className="font-semibold text-surface-700 dark:text-surface-300">{food.quantity}</span>
                        <span>{food.unit}</span>
                    </div>
                    <div className={`flex items-center gap-1 ${food.time_remaining === 'Expired' ? 'text-red-600 dark:text-red-400' : ''}`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                            {food.time_remaining === 'Expired'
                                ? 'Expired'
                                : `${food.time_remaining} left`}
                        </span>
                    </div>
                </div>

                {/* Action Button */}
                {showReserveButton && onReserve && (
                    <button
                        onClick={() => onReserve(food)}
                        disabled={!canReserve || isLoading}
                        className={`
              w-full py-2.5 rounded-xl font-semibold text-sm
              transition-all duration-200
              ${canReserve && !isLoading
                                ? 'bg-student-500 text-white hover:bg-student-600 hover:shadow-md active:scale-[0.98]'
                                : 'bg-surface-100 dark:bg-surface-700 text-surface-400 dark:text-surface-500 cursor-not-allowed'
                            }
            `}
                    >
                        {isLoading ? (
                            <span className="spinner mx-auto" />
                        ) : canReserve ? (
                            <div className="flex items-center justify-center gap-2">
                                <ShoppingCart className="w-4 h-4" />
                                {hasDiscount ? `Add to Cart • ₹${offerPrice > 0 ? offerPrice : 'FREE'}` : 'Add to Cart'}
                            </div>
                        ) : food.status === 'reserved' ? (
                            'Already Reserved'
                        ) : (
                            'Not Available'
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
