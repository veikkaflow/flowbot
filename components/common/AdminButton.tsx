import React from 'react';

interface AdminButtonProps {
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
  className?: string;
}

export const AdminButton: React.FC<AdminButtonProps> = ({
  onClick,
  type = 'button',
  disabled = false,
  variant = 'primary',
  children,
  className = '',
}) => {
  const baseStyles = 'px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: {
      backgroundColor: 'var(--color-primary)',
      color: 'white',
    },
    secondary: {
      backgroundColor: 'var(--admin-sidebar-bg, #374151)',
      color: 'var(--admin-text-primary, #f3f4f6)',
      borderColor: 'var(--admin-border, #374151)',
    },
    danger: {
      backgroundColor: '#ef4444',
      color: 'white',
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${className}`}
      style={variantStyles[variant]}
    >
      {children}
    </button>
  );
};


