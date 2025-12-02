import React, { useState } from 'react';
import { useBotContext } from '../context/BotContext.tsx';
import { Zap, Check } from './Icons.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

const InstallationSettings: React.FC = () => {
    const { activeBot } = useBotContext();
    const [copied, setCopied] = useState(false);
    const { t } = useLanguage();

    if (!activeBot) return null;

    // The script src is now a placeholder. The user must replace this with their actual
    // bundled script URL after deploying the application.
    const embedCode = `<!-- FlowBot AI Start -->
<div data-flowbot-id="${activeBot.id}"></div>
<script src="https://your-domain.com/embed.js" defer></script>
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
        </div>
    );
};

export default InstallationSettings;