
import React from 'react';
import { useSettings } from '../hooks/useSettings.ts';
import { DailySchedule } from '../types.ts';
import { Calendar } from './Icons.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

const daysOfWeek = [
    { index: 1, name: 'Maanantai' },
    { index: 2, name: 'Tiistai' },
    { index: 3, name: 'Keskiviikko' },
    { index: 4, name: 'Torstai' },
    { index: 5, name: 'Perjantai' },
    { index: 6, name: 'Lauantai' },
    { index: 0, name: 'Sunnuntai' },
];

const ScheduleSettings: React.FC = () => {
    const { settings: schedule, setSettings } = useSettings('schedule');
    const { t } = useLanguage();

    if (!schedule) return null;

    const handleAlwaysOnlineToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings({ ...schedule, isAlwaysOnline: e.target.checked });
    };

    const handleDayToggle = (dayIndex: number) => {
        const newSchedules = { ...schedule.dailySchedules };
        newSchedules[dayIndex].isEnabled = !newSchedules[dayIndex].isEnabled;
        setSettings({ ...schedule, dailySchedules: newSchedules });
    };

    const handleTimeChange = (dayIndex: number, field: keyof DailySchedule, value: string) => {
        const newSchedules = { ...schedule.dailySchedules };
        (newSchedules[dayIndex] as any)[field] = value;
        setSettings({ ...schedule, dailySchedules: newSchedules });
    };

    const handleOfflineMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setSettings({ ...schedule, offlineMessage: e.target.value });
    };

    return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
            <h3 className="text-xl font-bold text-white flex items-center gap-2"><Calendar className="w-6 h-6" /> {t('sch.title')}</h3>
            
            <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-semibold text-white">{t('sch.always_online')}</h4>
                        <p className="text-sm text-gray-400">{t('sch.always_online_desc')}</p>
                    </div>
                    <label htmlFor="isAlwaysOnline" className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="isAlwaysOnline" className="sr-only peer" checked={schedule.isAlwaysOnline} onChange={handleAlwaysOnlineToggle} />
                        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-[var(--color-primary)] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
                    </label>
                </div>
            </div>

            <div className={`space-y-4 transition-opacity ${schedule.isAlwaysOnline ? 'opacity-50' : 'opacity-100'}`}>
                <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 space-y-4">
                     <h4 className="font-semibold text-white">{t('sch.weekly')}</h4>
                     <div className="space-y-3">
                        {daysOfWeek.map(({ index, name }) => (
                            <div key={index} className="grid grid-cols-4 items-center gap-4 p-3 bg-gray-900/50 rounded-lg">
                                <label htmlFor={`day-${index}`} className="flex items-center gap-3 col-span-1">
                                    <input type="checkbox" id={`day-${index}`} checked={schedule.dailySchedules[index]?.isEnabled} onChange={() => handleDayToggle(index)} className="w-5 h-5 rounded text-[var(--color-primary)] bg-gray-600 border-gray-500 focus:ring-[var(--color-primary)]" />
                                    <span className="font-medium text-gray-200">{name}</span>
                                </label>
                                <div className="col-span-3 flex items-center gap-2">
                                    <input type="time" value={schedule.dailySchedules[index]?.startTime} onChange={e => handleTimeChange(index, 'startTime', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1.5 text-sm" disabled={!schedule.dailySchedules[index]?.isEnabled}/>
                                    <span>-</span>
                                    <input type="time" value={schedule.dailySchedules[index]?.endTime} onChange={e => handleTimeChange(index, 'endTime', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1.5 text-sm" disabled={!schedule.dailySchedules[index]?.isEnabled}/>
                                </div>
                            </div>
                        ))}
                     </div>
                </div>

                <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                    <label htmlFor="offlineMessage" className="block text-sm font-medium text-gray-300 mb-2">{t('sch.offline_msg')}</label>
                    <textarea
                        id="offlineMessage"
                        rows={3}
                        value={schedule.offlineMessage}
                        onChange={handleOfflineMessageChange}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
                        placeholder="Kiitos viestistäsi! Palaamme asiaan mahdollisimman pian."
                    />
                </div>
            </div>
        </div>
    );
};

export default ScheduleSettings;
