import React from 'react';

interface ButtonRbacProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  isLoading?: boolean;
}

export const ButtonRbac = ({
  children,
  variant = 'primary',
  isLoading,
  className = '',
  ...props
}: ButtonRbacProps) => {
  const baseStyle =
  "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors " +
  "focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none " +
  "max-[480px]:px-2 max-[480px]:py-2 max-[480px]:text-xs max-[80px]:rounded";


  const variants = {
    primary: "bg-secondary text-white hover:bg-gray-400 focus:ring-indigo-500 cursor-pointer",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-indigo-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-700",
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? "Processing..." : children}
    </button>
  );
};
