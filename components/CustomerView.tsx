

import React from 'react';
import BrowserFrame from './BrowserFrame.tsx';
import ChatWidget from './ChatWidget.tsx';
import { useBotContext } from '../context/BotContext.tsx';
import { BrandLogo } from './Icons.tsx';

interface CustomerViewProps {
    visitorId: string;
    onClose: () => void;
    onSizeChange: (size: 'normal' | 'large') => void;
}

const CustomerView: React.FC<CustomerViewProps> = ({ visitorId, onClose, onSizeChange }) => {
    const { activeBot } = useBotContext();
    const appearance = activeBot?.settings.appearance;
    
    if (!appearance) return null;

    return (
        <BrowserFrame url={appearance.websiteUrl || 'No URL specified'} onClose={onClose}>
            <div className="w-full h-full bg-gray-50 flex items-center justify-center relative overflow-hidden">
                 {/* Simple placeholder content */}
                 <div className="relative z-0 text-center text-gray-300">
                    <BrandLogo logoUrl={appearance.brandLogo} className="w-24 h-24 mx-auto opacity-10" />
                    <p className="mt-2 text-lg font-semibold opacity-20">{appearance.brandName}</p>
                 </div>
                 
                {/* Chat Widget is positioned absolutely within this container */}
                <ChatWidget 
                    visitorId={visitorId} 
                />
            </div>
        </BrowserFrame>
    );
};

export default CustomerView;