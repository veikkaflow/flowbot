
// components/BehaviorSettings.tsx
import React from 'react';
import { useSettings } from '../hooks/useSettings.ts';
import { Settings, User, Mail, Briefcase } from './Icons.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useDebouncedSave } from '../hooks/useDebouncedSave.ts';

const BehaviorSettings: React.FC = () => {
    const { settings: behavior, updateSettings, setSettings } = useSettings('behavior');
    const { t } = useLanguage();

    // Debounced save for text areas
    const [leadGenHook, setLeadGenHook, isSavingLeadGen] = useDebouncedSave(
        behavior?.leadGenHook,
        (value) => updateSettings({ leadGenHook: value })
    );

    const [helpText, setHelpText, isSavingHelp] = useDebouncedSave(
        behavior?.helpText,
        (value) => updateSettings({ helpText: value })
    );

    if (!behavior) return null;

    const handleToggle = (key: keyof typeof behavior, value: boolean) => {
        updateSettings({ [key]: value });
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSettings({ ...behavior, askForContactInfo: e.target.value as any });
    };

    return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
            <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}><Settings className="w-6 h-6" /> {t('beh.title')}</h3>

            <div className="p-6 rounded-lg border" style={{
                backgroundColor: 'var(--admin-card-bg, #1f2937)',
                borderColor: 'var(--admin-border, #374151)'
            }}>
                <div className="flex items-center justify-between py-4 border-b" style={{ borderColor: 'var(--admin-border, #374151)' }}>
                    <div>
                        <h4 className="font-semibold" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{t('beh.ask_name')}</h4>
                        <p className="text-sm" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}>{t('beh.ask_name_desc')}</p>
                    </div>
                    <label htmlFor="askForName" className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="askForName" className="sr-only peer" checked={behavior.askForName} onChange={(e) => handleToggle('askForName', e.target.checked)} />
                        <div className="w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-[var(--color-primary)] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all" style={{
                            backgroundColor: behavior.askForName ? 'var(--admin-toggle-checked, var(--color-primary))' : 'var(--admin-toggle-bg, #4b5563)',
                            borderColor: 'var(--admin-border, #374151)'
                        }}></div>
                    </label>
                </div>
                
                <div className="flex items-center justify-between py-4 border-b" style={{ borderColor: 'var(--admin-border, #374151)' }}>
                    <div>
                        <h4 className="font-semibold" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{t('beh.allow_rename')}</h4>
                        <p className="text-sm" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}>{t('beh.allow_rename_desc')}</p>
                    </div>
                    <label htmlFor="allowNameChange" className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="allowNameChange" className="sr-only peer" checked={behavior.allowNameChange} onChange={(e) => handleToggle('allowNameChange', e.target.checked)} />
                        <div className="w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-[var(--color-primary)] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all" style={{
                            backgroundColor: behavior.allowNameChange ? 'var(--admin-toggle-checked, var(--color-primary))' : 'var(--admin-toggle-bg, #4b5563)',
                            borderColor: 'var(--admin-border, #374151)'
                        }}></div>
                    </label>
                </div>

                <div className="pt-4">
                    <label htmlFor="language" className="block text-sm font-medium mb-1" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{t('beh.language')}</label>
                    <p className="text-sm mb-2" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}>{t('beh.language_desc')}</p>
                    <select 
                        id="language" 
                        value={behavior.language || 'fi'} 
                        onChange={(e) => updateSettings({ language: e.target.value as 'fi' | 'en' })} 
                        className="w-full md:w-1/2 px-3 py-2 rounded-md border"
                        style={{
                            backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                            color: 'var(--admin-text-primary, #f3f4f6)',
                            borderColor: 'var(--admin-border, #374151)'
                        }}
                    >
                        <option value="fi">Suomi (FI)</option>
                        <option value="en">English (EN)</option>
                    </select>
                </div>

                <div className="pt-4">
                    <label htmlFor="askForContactInfo" className="block text-sm font-medium mb-1" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{t('beh.contact_info')}</label>
                    <p className="text-sm mb-2" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}>{t('beh.contact_info_desc')}</p>
                    <select 
                        id="askForContactInfo" 
                        value={behavior.askForContactInfo} 
                        onChange={handleSelectChange} 
                        className="w-full md:w-1/2 px-3 py-2 rounded-md border"
                        style={{
                            backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                            color: 'var(--admin-text-primary, #f3f4f6)',
                            borderColor: 'var(--admin-border, #374151)'
                        }}
                    >
                        <option value="never">{t('beh.opt_never')}</option>
                        <option value="optional">{t('beh.opt_optional')}</option>
                        <option value="required">{t('beh.opt_required')}</option>
                    </select>
                </div>
            </div>

             <div className="p-6 rounded-lg border" style={{
                backgroundColor: 'var(--admin-card-bg, #1f2937)',
                borderColor: 'var(--admin-border, #374151)'
            }}>
                <h4 className="font-semibold" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{t('beh.lead_gen')}</h4>
                 <p className="text-sm mt-1 mb-2" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}>{t('beh.lead_gen_desc')}</p>
                 <textarea
                    rows={3}
                    value={leadGenHook}
                    onChange={e => setLeadGenHook(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border"
                    placeholder={t('beh.lead_gen_placeholder')}
                    style={{
                        backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                        color: 'var(--admin-text-primary, #f3f4f6)',
                        borderColor: 'var(--admin-border, #374151)'
                    }}
                 />
            </div>
            
            <div className="p-6 rounded-lg border" style={{
                backgroundColor: 'var(--admin-card-bg, #1f2937)',
                borderColor: 'var(--admin-border, #374151)'
            }}>
                 <div className="flex items-center justify-between py-4 border-b" style={{ borderColor: 'var(--admin-border, #374151)' }}>
                    <div>
                        <h4 className="font-semibold flex items-center gap-2" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}><Mail className="w-5 h-5" /> {t('beh.show_contact')}</h4>
                        <p className="text-sm" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}>{t('beh.show_contact_desc')}</p>
                    </div>
                    <label htmlFor="showContactButton" className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="showContactButton" className="sr-only peer" checked={behavior.showContactButton} onChange={(e) => handleToggle('showContactButton', e.target.checked)} />
                        <div className="w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-[var(--color-primary)] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all" style={{
                            backgroundColor: behavior.showContactButton ? 'var(--admin-toggle-checked, var(--color-primary))' : 'var(--admin-toggle-bg, #4b5563)',
                            borderColor: 'var(--admin-border, #374151)'
                        }}></div>
                    </label>
                </div>
                <div className="flex items-center justify-between py-4">
                    <div>
                        <h4 className="font-semibold flex items-center gap-2" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}><Briefcase className="w-5 h-5" /> {t('beh.show_quote')}</h4>
                        <p className="text-sm" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}>{t('beh.show_quote_desc')}</p>
                    </div>
                    <label htmlFor="showQuoteButton" className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="showQuoteButton" className="sr-only peer" checked={behavior.showQuoteButton} onChange={(e) => handleToggle('showQuoteButton', e.target.checked)} />
                        <div className="w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-[var(--color-primary)] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all" style={{
                            backgroundColor: behavior.showQuoteButton ? 'var(--admin-toggle-checked, var(--color-primary))' : 'var(--admin-toggle-bg, #4b5563)',
                            borderColor: 'var(--admin-border, #374151)'
                        }}></div>
                    </label>
                </div>
            </div>

            <div className="p-6 rounded-lg border" style={{
                backgroundColor: 'var(--admin-card-bg, #1f2937)',
                borderColor: 'var(--admin-border, #374151)'
            }}>
                <h4 className="font-semibold mb-2" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>Ohjeteksti</h4>
                <p className="text-sm mb-4" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}>
                    Kirjoita ohjeteksti, joka näytetään käyttäjille ohjeet-näkymässä. Voit käyttää tätä kertomaan käyttäjille miten chattia käytetään.
                </p>
                <textarea
                    rows={8}
                    value={helpText}
                    onChange={e => setHelpText(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border"
                    placeholder="Kirjoita ohjeteksti tähän..."
                    style={{
                        backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                        color: 'var(--admin-text-primary, #f3f4f6)',
                        borderColor: 'var(--admin-border, #374151)'
                    }}
                />
                <p className="text-xs mt-2" style={{ color: 'var(--admin-text-muted, #9ca3af)' }}>
                    Tämä teksti näytetään käyttäjille, kun he klikkaavat "Ohjeet" asetukset-valikosta.
                </p>
            </div>
        </div>
    );
};

export default BehaviorSettings;
