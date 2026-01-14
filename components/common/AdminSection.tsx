import React from 'react';

interface AdminSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const AdminSection: React.FC<AdminSectionProps> = ({ 
  title, 
  icon, 
  children, 
  className = '' 
}) => {
  return (
    <div className={`space-y-6 animate-[fadeIn_0.3s_ease-out] ${className}`}>
      <h3 
        className="text-xl font-bold flex items-center gap-2" 
        style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}
      >
        {icon && <span>{icon}</span>}
        {title}
      </h3>
      {children}
    </div>
  );
};


