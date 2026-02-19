/**
 * FoodLink Campus - Hygiene Checklist Component
 * Critical safety compliance for food listings
 */
import { CheckCircle2, Circle, AlertTriangle } from 'lucide-react';

const checks = [
    {
        id: 'temp_check',
        label: 'Temperature Verified',
        description: 'Food has been stored at appropriate temperature',
    },
    {
        id: 'packaging_clean',
        label: 'Clean Packaging',
        description: 'Packaging is clean, intact, and properly sealed',
    },
    {
        id: 'safe_storage',
        label: 'Safe Storage',
        description: 'Food has been stored in hygienic conditions',
    },
];

export default function HygieneChecklist({ values, onChange, disabled = false }) {
    const allChecked = checks.every((check) => values[check.id]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-surface-900 dark:text-surface-100">
                    Hygiene & Safety Checklist
                </h3>
                {allChecked ? (
                    <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        All Verified
                    </span>
                ) : (
                    <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Incomplete
                    </span>
                )}
            </div>

            <div className="space-y-3">
                {checks.map((check) => {
                    const isChecked = values[check.id];

                    return (
                        <button
                            key={check.id}
                            type="button"
                            onClick={() => !disabled && onChange({ ...values, [check.id]: !isChecked })}
                            disabled={disabled}
                            className={`
                w-full p-4 rounded-xl border-2 text-left
                flex items-start gap-4
                transition-all duration-200
                ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                ${isChecked
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                                    : 'border-surface-200 dark:border-surface-600 hover:border-surface-300 dark:hover:border-surface-500 bg-white dark:bg-surface-800'
                                }
              `}
                        >
                            <div className={`
                flex-shrink-0 w-6 h-6 rounded-full
                flex items-center justify-center
                transition-colors duration-200
                ${isChecked
                                    ? 'bg-green-500 text-white'
                                    : 'bg-surface-100 dark:bg-surface-700 text-surface-400 dark:text-surface-500'
                                }
              `}>
                                {isChecked ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                    <Circle className="w-4 h-4" />
                                )}
                            </div>

                            <div>
                                <p className={`font-medium ${isChecked ? 'text-green-700 dark:text-green-400' : 'text-surface-900 dark:text-surface-100'}`}>
                                    {check.label}
                                </p>
                                <p className={`text-sm mt-0.5 ${isChecked ? 'text-green-600 dark:text-green-500' : 'text-surface-500 dark:text-surface-400'}`}>
                                    {check.description}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {!allChecked && (
                <p className="text-sm text-amber-600 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    All hygiene checks must pass before listing food
                </p>
            )}
        </div>
    );
}

// Helper to check if all hygiene requirements are met
export function isHygieneValid(values) {
    return checks.every((check) => values[check.id] === true);
}
