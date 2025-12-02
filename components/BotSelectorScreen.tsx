
import React from 'react';
import { useBotContext } from '../context/BotContext.tsx';
import { Plus, Bot as BotIcon, LogOut } from './Icons.tsx';
import { BrandLogo } from './Icons.tsx';

interface BotSelectorScreenProps {
    onLogout: () => void;
}

const BotSelectorScreen: React.FC<BotSelectorScreenProps> = ({ onLogout }) => {
    const { bots, setActiveBotId, startCreatingBot } = useBotContext();
    
    const handleCreateNew = () => {
        startCreatingBot();
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#141414]">
            <div className="w-full max-w-md mx-auto p-8 bg-black bg-opacity-20 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg text-center relative">
                 <button 
                    onClick={onLogout} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                    title="Kirjaudu ulos"
                 >
                    <LogOut className="w-5 h-5" />
                 </button>

                 <BotIcon className="w-16 h-16 mx-auto text-blue-500 mb-4 animate-float" />
                 <h1 className="text-3xl font-bold text-white">Valitse botti</h1>
                 <p className="text-gray-400 mt-2 mb-8">Valitse botti, jota haluat hallita.</p>

                <div className="space-y-3">
                    {bots.map(bot => (
                        <button
                            key={bot.id}
                            onClick={() => setActiveBotId(bot.id)}
                            className="w-full flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                        >
                            <BrandLogo logoUrl={bot.settings.appearance.brandLogo} className="w-10 h-10 rounded-md bg-gray-600 object-contain p-1 flex-shrink-0" />
                            <span className="font-semibold text-white text-left">{bot.name}</span>
                        </button>
                    ))}
                </div>
                 <div className="mt-6 border-t border-white/10 pt-6">
                    <button 
                        onClick={handleCreateNew}
                        className="w-full flex items-center justify-center gap-2 p-3 text-sm font-semibold text-blue-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Luo uusi botti
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BotSelectorScreen;
