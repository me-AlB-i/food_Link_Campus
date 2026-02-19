/**
 * FoodLink Campus - Loading Components
 * Skeleton loaders and loading states
 */
import { Loader2 } from 'lucide-react';

/**
 * Full page loading spinner
 */
export function PageLoader() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900">
            <div className="text-center">
                <div className="spinner spinner-lg mx-auto mb-4" />
                <p className="text-surface-500 dark:text-surface-400">Loading...</p>
            </div>
        </div>
    );
}

/**
 * Inline loading spinner
 */
export function Spinner({ size = 'md', className = '' }) {
    const sizeClasses = {
        sm: 'spinner-sm',
        md: '',
        lg: 'spinner-lg',
    };

    return <div className={`spinner ${sizeClasses[size]} ${className}`} />;
}

/**
 * Button loading state
 */
export function ButtonLoader({ text = 'Loading...' }) {
    return (
        <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {text}
        </span>
    );
}

/**
 * Skeleton card loader
 */
export function SkeletonCard() {
    return (
        <div className="card">
            <div className="skeleton skeleton-card mb-4" />
            <div className="skeleton skeleton-title mb-2" />
            <div className="skeleton skeleton-text w-1/2 mb-4" />
            <div className="flex gap-2">
                <div className="skeleton h-10 w-24 rounded-lg" />
                <div className="skeleton h-10 w-24 rounded-lg" />
            </div>
        </div>
    );
}

/**
 * Skeleton list item
 */
export function SkeletonListItem() {
    return (
        <div className="flex items-center gap-4 p-4 bg-white dark:bg-surface-800 rounded-xl border border-surface-100 dark:border-surface-700">
            <div className="skeleton skeleton-avatar" />
            <div className="flex-1">
                <div className="skeleton skeleton-text w-1/3 mb-2" />
                <div className="skeleton skeleton-text w-1/2" />
            </div>
        </div>
    );
}

/**
 * Skeleton grid
 */
export function SkeletonGrid({ count = 4 }) {
    return (
        <div className="dashboard-grid">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}

/**
 * Skeleton table row
 */
export function SkeletonTableRow({ columns = 4 }) {
    return (
        <tr className="border-b border-surface-100">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="py-4 px-4">
                    <div className="skeleton skeleton-text" />
                </td>
            ))}
        </tr>
    );
}

/**
 * Content placeholder with optional message
 */
export function ContentLoader({ message = 'Loading content...' }) {
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="spinner mb-4" />
            <p className="text-surface-500 dark:text-surface-400 text-sm">{message}</p>
        </div>
    );
}
