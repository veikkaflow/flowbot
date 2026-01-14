import React from 'react';

interface AdminInputProps {
  id: string;
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number' | 'url';
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const AdminInput: React.FC<AdminInputProps> = ({
  id,
  label,
  description,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  className = '',
}) => {
  return (
    <div className={`pt-4 ${className}`}>
      <label 
        htmlFor={id} 
        className="block text-sm font-medium mb-1" 
        style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}
      >
        {label}
      </label>
      {description && (
        <p className="text-sm mb-2" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}>
          {description}
        </p>
      )}
      <input
        type={type}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full md:w-1/2 px-3 py-2 rounded-md border"
        style={{
          backgroundColor: 'var(--admin-sidebar-bg, #374151)',
          color: 'var(--admin-text-primary, #f3f4f6)',
          borderColor: 'var(--admin-border, #374151)'
        }}
      />
    </div>
  );
};


