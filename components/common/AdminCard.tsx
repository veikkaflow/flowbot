import React from 'react';

interface AdminCardProps {
  children: React.ReactNode;
  className?: string;
}

export const AdminCard: React.FC<AdminCardProps> = ({ children, className = '' }) => {
  return (
    <div 
      className={`p-6 rounded-lg border ${className}`}
      style={{
        backgroundColor: 'var(--admin-card-bg, #1f2937)',
        borderColor: 'var(--admin-border, #374151)'
      }}
    >
      {children}
    </div>
  );
};

