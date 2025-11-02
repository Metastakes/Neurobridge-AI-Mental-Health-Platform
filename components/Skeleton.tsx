// components/Skeleton.tsx
import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    lines?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'rectangular',
    width,
    height,
    lines = 1
}) => {
    const baseClasses = 'animate-pulse bg-gray-300 dark:bg-slate-700';

    const variantClasses = {
        text: 'rounded h-4',
        circular: 'rounded-full',
        rectangular: 'rounded-md'
    };

    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;

    if (variant === 'text' && lines > 1) {
        return (
            <div className={`space-y-2 ${className}`}>
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className={`${baseClasses} ${variantClasses[variant]}`}
                        style={{ ...style, width: i === lines - 1 ? '80%' : '100%' }}
                    />
                ))}
            </div>
        );
    }

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
};

// Pre-built skeleton patterns
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-white dark:bg-slate-800 p-6 rounded-lg shadow ${className}`}>
        <Skeleton variant="rectangular" height={24} width="60%" className="mb-4" />
        <Skeleton variant="text" lines={3} className="mb-4" />
        <Skeleton variant="rectangular" height={40} width="30%" />
    </div>
);

export const AppointmentSkeleton: React.FC = () => (
    <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg border dark:border-slate-600 flex gap-4 items-start">
        <div className="text-center border-r dark:border-slate-600 pr-4">
            <Skeleton variant="rectangular" width={48} height={60} />
        </div>
        <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="rectangular" width={150} height={32} />
        </div>
    </div>
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
    <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg border dark:border-slate-600">
                <div className="flex justify-between items-center mb-2">
                    <Skeleton variant="text" width="40%" />
                    <Skeleton variant="text" width="20%" />
                </div>
                <Skeleton variant="text" lines={2} />
            </div>
        ))}
    </div>
);

export const ProfileSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow space-y-4">
        <div className="flex items-center gap-4">
            <Skeleton variant="circular" width={64} height={64} />
            <div className="flex-1 space-y-2">
                <Skeleton variant="text" width="50%" height={24} />
                <Skeleton variant="text" width="30%" />
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
                <div key={i}>
                    <Skeleton variant="text" width="40%" className="mb-2" />
                    <Skeleton variant="rectangular" height={40} />
                </div>
            ))}
        </div>
    </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <div className="grid gap-px bg-gray-200 dark:bg-slate-700" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {/* Header */}
            {Array.from({ length: cols }).map((_, i) => (
                <div key={`header-${i}`} className="bg-gray-100 dark:bg-slate-800 p-4">
                    <Skeleton variant="text" width="60%" />
                </div>
            ))}
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) =>
                Array.from({ length: cols }).map((_, colIndex) => (
                    <div key={`cell-${rowIndex}-${colIndex}`} className="bg-white dark:bg-slate-800 p-4">
                        <Skeleton variant="text" />
                    </div>
                ))
            )}
        </div>
    </div>
);

export default Skeleton;
