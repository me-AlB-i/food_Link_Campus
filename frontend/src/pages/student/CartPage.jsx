
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { reservationAPI } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { Trash2, CreditCard, ChevronLeft } from 'lucide-react';
import { useState } from 'react';

export default function CartPage() { // Renamed from Cart for export
    const { cart, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
    const navigate = useNavigate();
    const { success, error: showError } = useNotification();
    const [processing, setProcessing] = useState(false);

    const handleCheckout = async () => {
        setProcessing(true);
        try {
            const items = cart.map(item => ({
                food_item_id: item.id,
                quantity: item.quantity
            }));

            // New endpoint we added to api.js (we need to add it there first!)
            // Wait, we didn't add bulk create to api.js yet.
            // Using reservationAPI.createBulk if it exists or we add it now.
            // Let's assume we add it.

            await reservationAPI.createBulk(items);

            success('Order placed successfully! Check your email for QR codes.');
            clearCart();
            navigate('/student/reservations');
        } catch (err) {
            console.error(err);
            showError(err.response?.data?.error || 'Failed to place order');
        } finally {
            setProcessing(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="page-container text-center py-20">
                <div className="w-20 h-20 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trash2 className="w-8 h-8 text-surface-400" />
                </div>
                <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-2">Your cart is empty</h2>
                <p className="text-surface-500 mb-8">Looks like you haven't added any food items yet.</p>
                <button onClick={() => navigate('/student')} className="btn-primary">
                    Browse Food
                </button>
            </div>
        );
    }

    return (
        <div className="page-container max-w-4xl">
            <button onClick={() => navigate('/student')} className="flex items-center text-surface-600 hover:text-surface-900 mb-6 transition-colors">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back to Feed
            </button>

            <h1 className="text-3xl font-display font-bold text-surface-900 dark:text-surface-100 mb-8">
                Your Cart
            </h1>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Cart Items */}
                <div className="flex-1 space-y-4">
                    {cart.map(item => (
                        <div key={item.id} className="card flex items-center gap-4 p-4">
                            <img
                                src={item.image_url ? `http://127.0.0.1:8000${item.image_url}` : 'https://placehold.co/100x100?text=No+Image'}
                                alt={item.name}
                                className="w-20 h-20 rounded-lg object-cover bg-surface-100"
                            />

                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-surface-900 dark:text-surface-100">{item.name}</h3>
                                <p className="text-sm text-surface-500">{item.location_name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="font-medium text-student-600">
                                        {(item.price > 0) ? `₹${item.price}` : 'Free'}
                                    </span>
                                    {parseFloat(item.retail_price) > parseFloat(item.price) && (
                                        <span className="text-xs text-surface-400 line-through">
                                            ₹{item.retail_price}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <select
                                    value={item.quantity}
                                    onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                                    className="input py-1 px-2 w-20"
                                >
                                    {[...Array(Math.min(10, item.quantityAvailable || item.quantity + 5)).keys()].map(i => (
                                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                                    ))}
                                </select>

                                <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="p-2 text-surface-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary */}
                <div className="w-full lg:w-80">
                    <div className="card sticky top-24">
                        <h3 className="font-bold text-lg mb-4 text-surface-900 dark:text-surface-100">Order Summary</h3>

                        <div className="space-y-2 mb-4 text-sm">
                            <div className="flex justify-between text-surface-600">
                                <span>Subtotal ({cart.reduce((a, c) => a + c.quantity, 0)} items)</span>
                                <span>{cartTotal > 0 ? `₹${cartTotal}` : 'Free'}</span>
                            </div>
                            {cart.reduce((saving, item) => saving + ((item.retail_price || item.price) - item.price) * item.quantity, 0) > 0 && (
                                <div className="flex justify-between text-green-600 font-medium">
                                    <span>Total Savings</span>
                                    <span>-₹{cart.reduce((saving, item) => saving + ((item.retail_price || item.price) - item.price) * item.quantity, 0).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-surface-600">
                                <span>Platform Fee</span>
                                <span>₹0</span>
                            </div>
                        </div>

                        <div className="border-t border-surface-200 dark:border-surface-700 pt-4 mb-6">
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>{cartTotal > 0 ? `₹${cartTotal}` : 'Free'}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={processing}
                            className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-lg"
                        >
                            {processing ? (
                                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                            ) : (
                                <>
                                    <CreditCard className="w-5 h-5" />
                                    Confirm Order
                                </>
                            )}
                        </button>
                        <p className="text-xs text-center text-surface-400 mt-3">
                            You will receive a single email with QR codes for all items.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
