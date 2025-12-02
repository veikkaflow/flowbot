
import React, { ReactNode } from 'react';
import { X } from './Icons.tsx';

interface BrowserFrameProps {
  url: string;
  children: ReactNode;
  onClose?: () => void;
}

const BrowserFrame: React.FC<BrowserFrameProps> = ({ url, children, onClose }) => {
  return (
    <div className="w-full h-full bg-gray-900 rounded-lg shadow-2xl flex flex-col overflow-hidden border border-gray-700">
      <div className="flex-shrink-0 h-10 bg-gray-800 flex items-center px-4 gap-2">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 bg-red-500 rounded-full"></span>
          <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
          <span className="w-3 h-3 bg-green-500 rounded-full"></span>
        </div>
        <div className="flex-grow flex items-center justify-center">
            <div className="w-2/3 max-w-2xl bg-gray-900 text-gray-400 text-sm rounded-full px-4 py-1 truncate">
                {url}
            </div>
        </div>
         {onClose && (
            <button onClick={onClose} className="text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
            </button>
        )}
      </div>
      <div className="flex-grow relative">
        {children}
      </div>
    </div>
  );
};

export default BrowserFrame;
