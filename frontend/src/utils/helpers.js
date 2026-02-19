/**
 * FoodLink Campus - Utility Functions
 * Common helpers used across the application
 */

/**
 * Format a date to relative time (e.g., "2 hours ago")
 * @param {Date|string} date - Date to format
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return then.toLocaleDateString();
}

/**
 * Format remaining time until a deadline
 * @param {Date|string} endTime - End datetime
 * @returns {string} Remaining time string
 */
export function formatTimeRemaining(endTime) {
    const now = new Date();
    const end = new Date(endTime);
    const diffMs = end - now;

    if (diffMs <= 0) return 'Expired';

    const diffMins = Math.floor(diffMs / 1000 / 60);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (hours > 0) {
        return `${hours}h ${mins}m left`;
    }
    return `${mins}m left`;
}

/**
 * Format a number with proper units
 * @param {number} value - Numeric value
 * @param {string} unit - Unit type
 * @returns {string} Formatted string
 */
export function formatQuantity(value, unit) {
    const unitLabels = {
        plates: value === 1 ? 'plate' : 'plates',
        kg: 'kg',
        liters: value === 1 ? 'liter' : 'liters',
        pieces: value === 1 ? 'piece' : 'pieces',
    };

    return `${value} ${unitLabels[unit] || unit}`;
}

/**
 * Truncate text to a maximum length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum characters
 * @returns {string} Truncated text
 */
export function truncate(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
}

/**
 * Capitalize first letter of each word
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export function capitalize(str) {
    if (!str) return '';
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Get initials from a name
 * @param {string} name - Full name
 * @returns {string} Initials (max 2 chars)
 */
export function getInitials(name) {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

/**
 * Debounce a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Check if we're on a mobile device
 * @returns {boolean}
 */
export function isMobile() {
    return window.innerWidth < 768;
}

/**
 * Check if we're on a tablet
 * @returns {boolean}
 */
export function isTablet() {
    return window.innerWidth >= 768 && window.innerWidth < 1024;
}

/**
 * Generate a random color based on string (for avatars)
 * @param {string} str - Input string
 * @returns {string} Hex color
 */
export function stringToColor(str) {
    if (!str) return '#888888';

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const colors = [
        '#10B981', // Green
        '#3B82F6', // Blue
        '#F97316', // Orange
        '#8B5CF6', // Purple
        '#EC4899', // Pink
        '#14B8A6', // Teal
    ];

    return colors[Math.abs(hash) % colors.length];
}

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Parse API error response
 * @param {Error} error - Axios error object
 * @returns {string} User-friendly error message
 */
export function parseApiError(error) {
    if (error.response?.data?.error) {
        return error.response.data.error;
    }
    if (error.response?.data?.detail) {
        return error.response.data.detail;
    }
    if (error.response?.data?.message) {
        return error.response.data.message;
    }
    if (error.message) {
        return error.message;
    }
    return 'An unexpected error occurred. Please try again.';
}

/**
 * Local storage helpers with JSON parsing
 */
export const storage = {
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch {
            return defaultValue;
        }
    },

    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Storage error:', e);
        }
    },

    remove: (key) => {
        localStorage.removeItem(key);
    },

    clear: () => {
        localStorage.clear();
    },
};
