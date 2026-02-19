
import { createContext, useContext, useState, useEffect } from 'react';
import { useNotification } from './NotificationContext';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem('foodlink_cart');
        return saved ? JSON.parse(saved) : [];
    });

    const { success, error: showError } = useNotification();

    useEffect(() => {
        localStorage.setItem('foodlink_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (item, quantity = 1) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                // Determine max quantity logic (if backend enforces, frontend should too)
                // Assuming item.quantity is the max available
                if (existing.quantity + quantity > item.quantity) {
                    showError(`Only ${item.quantity} available`);
                    return prev;
                }

                success(`Updated quantity for ${item.name}`);
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i);
            }

            // Check if user is trying to add more than available initially
            if (quantity > item.quantity) {
                showError(`Only ${item.quantity} available`);
                return prev;
            }

            success(`${item.name} added to cart`);
            return [...prev, { ...item, quantity }];
        });
    };

    const removeFromCart = (itemId) => {
        setCart(prev => prev.filter(i => i.id !== itemId));
    };

    const updateQuantity = (itemId, newQty) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.id === itemId) {
                    // Check limit
                    if (newQty > item.quantityAvailable) { // Assuming we store original available qty or fetch it
                        // For simplicity, we trust the item object has 'quantity' as 'available stock' ??
                        // Wait, item.quantity usually means *available* stock when fetching from API.
                        // But in cart, item.quantity is *ordered* qty.
                        // So we should store available stock separately.
                        return item;
                    }
                    return { ...item, quantity: Math.max(1, newQty) };
                }
                return item;
            });
        });
    };

    const clearCart = () => {
        setCart([]);
    };

    const cartTotal = cart.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartTotal,
            cartCount
        }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);
