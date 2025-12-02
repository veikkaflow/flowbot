
import React, { useRef, useState } from 'react';
import { useKnowledgeBase } from '../hooks/useKnowledgeBase.ts';
import { parseFile } from '../services/fileParserService.ts';
import { scrapeTextFromUrl } from '../services/siteScraperService.ts';
import { useNotification } from '../context/NotificationContext.tsx';
import { Book, UploadCloud, Trash2, FileText, Loader } from './Icons.tsx';
import TrainingConsole from './TrainingConsole.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

const KnowledgeBaseSettings: React.FC = () => {
    const { knowledgeBase, addKnowledgeItem, deleteKnowledgeItem } = useKnowledgeBase();
    const { addNotification } = useNotification();
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t } = useLanguage();

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading({ ...isLoading, file: true });
        try {
            const content = await parseFile(file);
            addKnowledgeItem({
                type: 'file',
                name: file.name,
                content: content.substring(0, 20000), // Limit content size
            });
            addNotification({ message: `Tiedosto ${file.name} lisätty tietopankkiin.`, type: 'success' });
        } catch (error: any) {
            addNotification({ message: error.message || 'Tiedoston käsittely epäonnistui.', type: 'error' });
        } finally {
            setIsLoading({ ...isLoading, file: false });
            if (fileInputRef.current) fileInputRef.current.value = ''; // Reset file input
        }
    };
    
    const handleUrlScrape = async () => {
        const url = prompt("Anna verkkosivun osoite (URL):");
        if (!url) return;

        setIsLoading({ ...isLoading, url: true });
        try {
            const content = await scrapeTextFromUrl(url);
            const urlObject = new URL(url);
            addKnowledgeItem({
                type: 'url',
                name: urlObject.hostname,
                content: content.substring(0, 20000),
            });
            addNotification({ message: `Sivuston ${urlObject.hostname} sisältö lisätty.`, type: 'success' });
        } catch (error: any) {
             addNotification({ message: error.message || 'Sivuston lukeminen epäonnistui.', type: 'error' });
        } finally {
            setIsLoading({ ...isLoading, url: false });
        }
    };


    if (!knowledgeBase) return null;

    return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
            <h3 className="text-xl font-bold text-white flex items-center gap-2"><Book className="w-6 h-6" /> {t('know.title')}</h3>
            
            <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                <h4 className="font-semibold text-white">{t('know.general')}</h4>
                <p className="text-sm text-gray-400 mt-1">{t('know.general_desc')}</p>
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.txt" className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} disabled={isLoading.file} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-md disabled:opacity-50">
                        {isLoading.file ? <Loader className="w-5 h-5 animate-spin"/> : <UploadCloud className="w-5 h-5" />}
                        {isLoading.file ? 'Ladataan...' : t('know.upload_file')}
                    </button>
                    <button onClick={handleUrlScrape} disabled={isLoading.url} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-md disabled:opacity-50">
                       {isLoading.url ? <Loader className="w-5 h-5 animate-spin"/> : <FileText className="w-5 h-5" />}
                       {isLoading.url ? 'Luetaan...' : t('know.add_web')}
                    </button>
                </div>

                <div className="mt-5 space-y-2">
                    {knowledgeBase.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                <span className="text-sm text-gray-200 truncate">{item.name}</span>
                            </div>
                            <button onClick={() => deleteKnowledgeItem(item.id)} className="p-1 text-gray-500 hover:text-red-400 rounded-full"><Trash2 className="w-4 h-4"/></button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                <TrainingConsole />
            </div>
        </div>
    );
};

export default KnowledgeBaseSettings;
