import React from 'react';

export const Spinner: React.FC<{ className?: string }> = ({ className = 'h-8 w-8' }) => (
  <svg
    className={`animate-spin text-blue-600 ${className}`}
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
  </svg>
);

export const LoadingScreen: React.FC = () => (
  <div className="flex items-center justify-center h-64">
    <Spinner />
  </div>
);
