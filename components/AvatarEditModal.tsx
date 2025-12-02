import React from 'react';
import { X } from './Icons.tsx';
import { useSettings } from '../hooks/useSettings.ts';

interface AvatarEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentAvatar: string;
    onSelect: (avatar: string) => void;
}

const AvatarEditModal: React.FC<AvatarEditModalProps> = ({ isOpen, onClose, currentAvatar, onSelect }) => {
    const { settings: avatarSettings } = useSettings('avatarSettings');
    
    if (!isOpen || !avatarSettings) return null;

    const { agentAvatarGallery } = avatarSettings;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h3 className="text-lg font-semibold text-white">Valitse avatari</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
                <div className="p-6">
                    <div className="flex flex-wrap gap-4">
                        {agentAvatarGallery.map(avatar => (
                             <button
                                key={avatar}
                                onClick={() => onSelect(avatar)}
                                className={`w-20 h-20 p-1 rounded-full bg-gray-700 ring-2 ${currentAvatar === avatar ? 'ring-offset-2 ring-offset-gray-800 ring-[var(--color-primary)]' : 'ring-transparent hover:ring-gray-500'}`}
                            >
                                <img src={avatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AvatarEditModal;