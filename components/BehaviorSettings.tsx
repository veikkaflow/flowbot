
// components/BehaviorSettings.tsx
import React from 'react';
import { useSettings } from '../hooks/useSettings.ts';
import { Settings, User, Mail, Briefcase } from './Icons.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

const BehaviorSettings: React.FC = () => {
    const { settings: behavior, updateSettings, setSettings } = useSettings('behavior');
    const { t } = useLanguage();

    if (!behavior) return null;

    const handleToggle = (key: keyof typeof behavior, value: boolean) => {
        updateSettings({ [key]: value });
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSettings({ ...behavior, askForContactInfo: e.target.value as any });
    };

    return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
            <h3 className="text-xl font-bold text-white flex items-center gap-2"><Settings className="w-6 h-6" /> {t('beh.title')}</h3>

            <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 divide-y divide-gray-700">
                <div className="flex items-center justify-between py-4">
                    <div>
                        <h4 className="font-semibold text-white">{t('beh.ask_name')}</h4>
                        <p className="text-sm text-gray-400">{t('beh.ask_name_desc')}</p>
                    </div>
                    <label htmlFor="askForName" className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="askForName" className="sr-only peer" checked={behavior.askForName} onChange={(e) => handleToggle('askForName', e.target.checked)} />
                        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-[var(--color-primary)] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
                    </label>
                </div>
                
                <div className="flex items-center justify-between py-4">
                    <div>
                        <h4 className="font-semibold text-white">{t('beh.allow_rename')}</h4>
                        <p className="text-sm text-gray-400">{t('beh.allow_rename_desc')}</p>
                    </div>
                    <label htmlFor="allowNameChange" className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="allowNameChange" className="sr-only peer" checked={behavior.allowNameChange} onChange={(e) => handleToggle('allowNameChange', e.target.checked)} />
                        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-[var(--color-primary)] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
                    </label>
                </div>

                <div className="pt-4">
                    <label htmlFor="language" className="block text-sm font-medium text-gray-300 mb-1">{t('beh.language')}</label>
                    <p className="text-sm text-gray-400 mb-2">{t('beh.language_desc')}</p>
                    <select 
                        id="language" 
                        value={behavior.language || 'fi'} 
                        onChange={(e) => updateSettings({ language: e.target.value as 'fi' | 'en' })} 
                        className="w-full md:w-1/2 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
                    >
                        <option value="fi">Suomi (FI)</option>
                        <option value="en">English (EN)</option>
                    </select>
                </div>

                <div className="pt-4">
                    <label htmlFor="askForContactInfo" className="block text-sm font-medium text-gray-300 mb-1">{t('beh.contact_info')}</label>
                    <p className="text-sm text-gray-400 mb-2">{t('beh.contact_info_desc')}</p>
                    <select id="askForContactInfo" value={behavior.askForContactInfo} onChange={handleSelectChange} className="w-full md:w-1/2 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md">
                        <option value="never">{t('beh.opt_never')}</option>
                        <option value="optional">{t('beh.opt_optional')}</option>
                        <option value="required">{t('beh.opt_required')}</option>
                    </select>
                </div>
            </div>

             <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                <h4 className="font-semibold text-white">{t('beh.lead_gen')}</h4>
                 <p className="text-sm text-gray-400 mt-1 mb-2">{t('beh.lead_gen_desc')}</p>
                 <textarea
                    rows={3}
                    value={behavior.leadGenHook}
                    onChange={e => updateSettings({ leadGenHook: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
                    placeholder={t('beh.lead_gen_placeholder')}
                 />
            </div>
            
            <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 divide-y divide-gray-700">
                 <div className="flex items-center justify-between py-4">
                    <div>
                        <h4 className="font-semibold text-white flex items-center gap-2"><Mail className="w-5 h-5" /> {t('beh.show_contact')}</h4>
                        <p className="text-sm text-gray-400">{t('beh.show_contact_desc')}</p>
                    </div>
                    <label htmlFor="showContactButton" className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="showContactButton" className="sr-only peer" checked={behavior.showContactButton} onChange={(e) => handleToggle('showContactButton', e.target.checked)} />
                        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-[var(--color-primary)] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
                    </label>
                </div>
                <div className="flex items-center justify-between py-4">
                    <div>
                        <h4 className="font-semibold text-white flex items-center gap-2"><Briefcase className="w-5 h-5" /> {t('beh.show_quote')}</h4>
                        <p className="text-sm text-gray-400">{t('beh.show_quote_desc')}</p>
                    </div>
                    <label htmlFor="showQuoteButton" className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="showQuoteButton" className="sr-only peer" checked={behavior.showQuoteButton} onChange={(e) => handleToggle('showQuoteButton', e.target.checked)} />
                        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-[var(--color-primary)] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default BehaviorSettings;
