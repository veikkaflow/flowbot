import React, { useState, useMemo } from 'react';
import { useBotContext } from '../context/BotContext.tsx';
import { Zap, Check } from './Icons.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

const InstallationSettings: React.FC = () => {
    const { activeBot } = useBotContext();
    const [copied, setCopied] = useState(false);
    const { t } = useLanguage();

    if (!activeBot) return null;

    // Get deployment URL - use current origin or allow override via environment variable
    const deploymentUrl = useMemo(() => {
        // In production, use current origin (Firebase Hosting URL)
        // Can be overridden with environment variable if needed
        const envUrl = import.meta.env.VITE_DEPLOYMENT_URL;
        if (envUrl) {
            return envUrl.replace(/\/$/, ''); // Remove trailing slash
        }
        // Use current origin (works for Firebase Hosting)
        return window.location.origin;
    }, []);

    const embedCode = `<!-- FlowBot AI Start -->
<div data-flowbot-id="${activeBot.id}"></div>
<script src="${deploymentUrl}/embed.js" defer></script>
<!-- FlowBot AI End -->`;

    const handleCopy = () => {
        navigator.clipboard.writeText(embedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
            <h3 className="text-xl font-bold text-white flex items-center gap-2"><Zap className="w-6 h-6" /> {t('inst.title')}</h3>
            
            <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                <h4 className="font-semibold text-white">{t('inst.widget_title')}</h4>
                <p className="text-sm text-gray-400 mt-1">{t('inst.widget_desc')}</p>
                
                <div className="mt-4 relative">
                    <pre className="p-4 bg-gray-900 rounded-md text-sm text-gray-300 overflow-x-auto">
                        <code>{embedCode}</code>
                    </pre>
                    <button 
                        onClick={handleCopy}
                        className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-700 hover:bg-gray-600 rounded-md"
                    >
                        {copied ? <Check className="w-4 h-4 text-green-400"/> : null}
                        {copied ? t('inst.copied') : t('inst.copy')}
                    </button>
                </div>
            </div>

             <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                <h4 className="font-semibold text-white">{t('inst.how_title')}</h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-400 mt-2">
                    <li>{t('inst.step1')}</li>
                    <li>{t('inst.step2_start')}{activeBot.name}{t('inst.step2_end')}</li>
                    <li>{t('inst.step3')}</li>
                    <li>{t('inst.step4')}</li>
                </ul>
            </div>

            <div className="p-6 bg-blue-900/20 rounded-lg border border-blue-700/50">
                <h4 className="font-semibold text-white mb-2">Huomio</h4>
                <p className="text-sm text-gray-300">
                    Widgetti lataa automaattisesti tarvittavat tyylitiedostot. Varmista että 
                    <code className="px-1 py-0.5 bg-gray-800 rounded text-xs">embed.js</code> 
                    on saatavilla osoitteessa <code className="px-1 py-0.5 bg-gray-800 rounded text-xs">{deploymentUrl}/embed.js</code>
                </p>
            </div>
        </div>
    );
};

export default InstallationSettings;