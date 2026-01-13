import React from 'react';

interface AdminToggleProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

export const AdminToggle: React.FC<AdminToggleProps> = ({ 
  id, 
  checked, 
  onChange, 
  label, 
  description 
}) => {
  return (
    <div className="flex items-center justify-between py-4 border-b" style={{ borderColor: 'var(--admin-border, #374151)' }}>
      <div>
        <h4 className="font-semibold" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>
          {label}
        </h4>
        {description && (
          <p className="text-sm" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}>
            {description}
          </p>
        )}
      </div>
      <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          id={id} 
          className="sr-only peer" 
          checked={checked} 
          onChange={(e) => onChange(e.target.checked)} 
        />
        <div 
          className="w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-[var(--color-primary)] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all" 
          style={{
            backgroundColor: checked ? 'var(--admin-toggle-checked, var(--color-primary))' : 'var(--admin-toggle-bg, #4b5563)',
            borderColor: 'var(--admin-border, #374151)'
          }}
        />
      </label>
    </div>
  );
};

