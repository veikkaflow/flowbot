
import React from 'react';
import { usePersonality } from '../hooks/usePersonality.ts';
import { Scenario, QuickReply, IconName } from '../types.ts';
import { Smile, Plus, Trash2 } from './Icons.tsx';
import * as Icons from './Icons.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

const iconOptions = Object.keys(Icons).filter(key => key[0] === key[0].toUpperCase() && key !== 'BrandLogo') as IconName[];

const getIconComponent = (iconName: IconName): React.FC<React.SVGProps<SVGSVGElement>> => {
    return Icons[iconName] || Icons.HelpCircle;
};

const PersonalitySettings: React.FC = () => {
    const { personality, updateSettings, addScenario, updateScenario, deleteScenario, addQuickReply, updateQuickReply, deleteQuickReply } = usePersonality();
    const { t } = useLanguage();

    if (!personality) return null;

    const handleScenarioChange = (id: string, field: keyof Scenario, value: string) => {
        const scenario = personality.scenarios.find(s => s.id === id);
        if (scenario) {
            updateScenario({ ...scenario, [field]: value });
        }
    };
    
    const handleQuickReplyChange = (id: string, lang: 'fi' | 'en', value: string) => {
        const reply = personality.quickReplies.find(qr => qr.id === id);
        if (reply) {
            updateQuickReply({ 
                ...reply, 
                text: { ...reply.text, [lang]: value } 
            });
        }
    };

    const handleQuickReplyIconChange = (id: string, value: IconName) => {
        const reply = personality.quickReplies.find(qr => qr.id === id);
        if (reply) {
            updateQuickReply({ ...reply, icon: value });
        }
    };

    const handleOpeningMessageChange = (lang: 'fi' | 'en', value: string) => {
        updateSettings({
            openingMessage: {
                ...personality.openingMessage,
                [lang]: value
            }
        });
    };

    return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
            <h3 className="text-xl font-bold text-white flex items-center gap-2"><Smile className="w-6 h-6" /> {t('pers.title')}</h3>

            <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 space-y-4">
                <h4 className="font-semibold text-white">{t('pers.basic')}</h4>
                
                {/* Tone and Custom Instruction */}
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label htmlFor="tone" className="block text-sm font-medium text-gray-300 mb-1">{t('pers.tone')}</label>
                        <select id="tone" value={personality.tone} onChange={(e) => updateSettings({ tone: e.target.value as any })} className="w-full md:w-1/2 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md">
                            <option>Ystävällinen</option>
                            <option>Ammattimainen</option>
                            <option>Rento</option>
                            <option>Asiantunteva</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="customInstruction" className="block text-sm font-medium text-gray-300 mb-1">{t('pers.instruction')}</label>
                        <textarea id="customInstruction" rows={3} value={personality.customInstruction} onChange={(e) => updateSettings({ customInstruction: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md" placeholder="Esim: Vastaa aina suomeksi. Älä ehdota kilpailevia tuotteita." />
                    </div>
                </div>

                <div className="border-t border-gray-700 pt-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('pers.opening')}</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1 block">Suomi (FI)</span>
                            <input 
                                type="text" 
                                value={personality.openingMessage.fi} 
                                onChange={(e) => handleOpeningMessageChange('fi', e.target.value)} 
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md" 
                                placeholder="Hei! Miten voin auttaa?" 
                            />
                        </div>
                        <div>
                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1 block">English (EN)</span>
                            <input 
                                type="text" 
                                value={personality.openingMessage.en} 
                                onChange={(e) => handleOpeningMessageChange('en', e.target.value)} 
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md" 
                                placeholder="Hello! How can I help you?" 
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 space-y-4">
                 <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-white">{t('pers.quick_replies')}</h4>
                    <button onClick={addQuickReply} className="flex items-center gap-1 text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-md"><Plus className="w-4 h-4"/> {t('pers.add_reply')}</button>
                </div>
                <p className="text-sm text-gray-400">{t('pers.replies_desc')}</p>
                <div className="space-y-3">
                    {personality.quickReplies?.map(qr => {
                        const Icon = getIconComponent(qr.icon);
                        return (
                             <div key={qr.id} className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/50 flex flex-col md:flex-row gap-3 items-start md:items-center">
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <div className="p-2 bg-gray-700 rounded-md">
                                        <Icon className="w-5 h-5 text-[var(--color-primary)]" />
                                    </div>
                                    <select value={qr.icon} onChange={(e) => handleQuickReplyIconChange(qr.id, e.target.value as IconName)} className="bg-gray-700 border border-gray-600 rounded-md px-2 py-1.5 text-sm appearance-none">
                                        {iconOptions.map(iconName => <option key={iconName} value={iconName}>{iconName}</option>)}
                                    </select>
                                </div>
                                
                                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 font-bold w-6">FI</span>
                                        <input type="text" value={qr.text.fi} onChange={(e) => handleQuickReplyChange(qr.id, 'fi', e.target.value)} className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-md text-sm" placeholder="Kysymys suomeksi" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 font-bold w-6">EN</span>
                                        <input type="text" value={qr.text.en} onChange={(e) => handleQuickReplyChange(qr.id, 'en', e.target.value)} className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-md text-sm" placeholder="Question in English" />
                                    </div>
                                </div>

                                <button onClick={() => deleteQuickReply(qr.id)} className="p-2 text-gray-500 hover:text-red-400 rounded-full self-end md:self-center"><Trash2 className="w-4 h-4"/></button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 space-y-4">
                 <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-white">{t('pers.scenarios')}</h4>
                    <button onClick={addScenario} className="flex items-center gap-1 text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-md"><Plus className="w-4 h-4"/> {t('pers.add_scenario')}</button>
                </div>
                <p className="text-sm text-gray-400">{t('pers.scenarios_desc')}</p>
                <div className="space-y-4">
                    {personality.scenarios.map(s => (
                        <div key={s.id} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                            <div className="flex justify-end">
                                <button onClick={() => deleteScenario(s.id)} className="p-1 text-gray-500 hover:text-red-400 rounded-full"><Trash2 className="w-4 h-4"/></button>
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <label className="text-xs text-gray-400">{t('pers.customer_says')}</label>
                                    <input type="text" value={s.userMessage} onChange={e => handleScenarioChange(s.id, 'userMessage', e.target.value)} className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400">{t('pers.bot_says')}</label>
                                    <textarea rows={2} value={s.botResponse} onChange={e => handleScenarioChange(s.id, 'botResponse', e.target.value)} className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-sm" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PersonalitySettings;
