/**
 * =============================================================================
 * LOADING SPINNER COMPONENT
 * =============================================================================
 *
 * Animated loading indicator.
 *
 * INTERVIEW NOTES:
 * - CSS animations are performant (GPU accelerated)
 * - aria-busy and role attributes ensure accessibility
 * - Size variants allow flexible usage
 */

interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Display full screen with overlay */
  fullScreen?: boolean;
  /** Custom class names */
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-3',
  lg: 'w-12 h-12 border-4',
};

export default function LoadingSpinner({
  size = 'md',
  fullScreen = false,
  className = '',
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading"
      className={`
        ${sizeClasses[size]}
        border-gray-200 border-t-primary-600
        rounded-full animate-spin
        ${className}
      `}
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-4">
          {spinner}
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return spinner;
}
