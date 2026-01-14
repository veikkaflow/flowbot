// components/ProductCard.tsx
import React from 'react';
import { ExternalLink } from './Icons.tsx';

interface ProductCardProps {
    title: string;
    image?: string;
    url: string;
    description?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ title, image, url, description }) => {
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[var(--chat-bubble-bot-bg)] rounded-xl overflow-hidden my-2 border border-[var(--chat-border-color)] hover:shadow-lg transition-shadow block"
        >
            <div className="flex flex-col md:flex-row">
                {/* Product Image */}
                {image && (
                    <div className="w-full md:w-32 h-48 md:h-auto flex-shrink-0 bg-[var(--chat-input-bg)]">
                        <img 
                            src={image} 
                            alt={title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}
                
                {/* Content */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                        <h4 className="font-semibold text-[var(--chat-text-primary)] mb-2 text-base flex items-center gap-2">
                            {title}
                            <ExternalLink className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0" />
                        </h4>
                        
                        {description && (
                            <p className="text-sm text-[var(--chat-text-secondary)] line-clamp-2">
                                {description}
                            </p>
                        )}
                    </div>
                    
                    <div className="mt-3 text-xs text-[var(--color-primary)] font-medium">
                        Katso tuote →
                    </div>
                </div>
            </div>
        </a>
    );
};

