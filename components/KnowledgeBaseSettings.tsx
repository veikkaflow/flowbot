
import React, { useRef, useState } from 'react';
import { useKnowledgeBase } from '../hooks/useKnowledgeBase.ts';
import { parseFile } from '../services/fileParserService.ts';
import { scrapeTextFromUrl } from '../services/siteScraperService.ts';
import { useNotification } from '../context/NotificationContext.tsx';
import { Book, UploadCloud, Trash2, FileText, Loader, X, ExternalLink } from './Icons.tsx';
import { KnowledgeSource } from '../types.ts';
import TrainingConsole from './TrainingConsole.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { storage } from '../services/firebase.ts';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useBotContext } from '../context/BotContext.tsx';
import { useUserContext } from '../context/UserContext.tsx';

const KnowledgeBaseSettings: React.FC = () => {
    const { knowledgeBase, addKnowledgeItem, deleteKnowledgeItem } = useKnowledgeBase();
    const { addNotification } = useNotification();
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
    const [previewItem, setPreviewItem] = useState<KnowledgeSource | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { activeBot } = useBotContext();
    const { user } = useUserContext();
    const { t } = useLanguage();

    // Sanitize filename for Firebase Storage
    const sanitizeFileName = (fileName: string): string => {
        // Replace spaces and special characters with underscores, keep alphanumeric, dots, hyphens, and underscores
        return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!activeBot?.id) {
            addNotification({ message: 'Valitse ensin botti ennen tiedoston lisäämistä.', type: 'error' });
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        if (!user) {
            addNotification({ message: 'Sinun täytyy olla kirjautunut sisään ladataksesi tiedostoja.', type: 'error' });
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setIsLoading(prev => ({ ...prev, file: true }));
        try {
            // Parse file content first
            const content = await parseFile(file);
            const isPdf = file.name.toLowerCase().endsWith('.pdf');
            let fileUrl: string | undefined;

            // If PDF, upload to Firebase Storage
            if (isPdf) {
                try {
                    // Sanitize filename for storage path
                    const sanitizedFileName = sanitizeFileName(file.name);
                    const storageRef = ref(storage, `knowledge-base/${activeBot.id}/${sanitizedFileName}`);
                    
                    // Check file size (max 10MB)
                    if (file.size > 10 * 1024 * 1024) {
                        throw new Error('Tiedosto on liian suuri. Maksimikoko on 10MB.');
                    }
                    
                    await uploadBytes(storageRef, file);
                    fileUrl = await getDownloadURL(storageRef);
                } catch (storageError: any) {
                    console.error('Failed to upload PDF to storage:', storageError);
                    // Show error message to help debug
                    if (storageError.code === 'storage/unauthorized' || storageError.code === 'storage/permission-denied') {
                        addNotification({ 
                            message: 'PDF-tiedoston lataus epäonnistui: Ei oikeuksia. Tarkista että olet kirjautunut sisään ja että Firebase Storage -säännöt sallivat kirjoittamisen.', 
                            type: 'error' 
                        });
                    } else if (storageError.code === 'storage/canceled') {
                        // User canceled, don't show error
                        return;
                    } else {
                        addNotification({ 
                            message: `PDF-tiedosto tallennettiin tekstimuodossa. Storage-lataus epäonnistui: ${storageError.message || storageError.code || 'Tuntematon virhe'}.`, 
                            type: 'warning' 
                        });
                    }
                }
            }

            addKnowledgeItem({
                type: 'file',
                name: file.name,
                content: content.substring(0, 20000), // Limit content size
                fileUrl: fileUrl,
            });
            addNotification({ message: `Tiedosto ${file.name} lisätty tietopankkiin.`, type: 'success' });
        } catch (error: any) {
            console.error('File processing error:', error);
            addNotification({ message: error.message || 'Tiedoston käsittely epäonnistui.', type: 'error' });
        } finally {
            setIsLoading(prev => ({ ...prev, file: false }));
            if (fileInputRef.current) fileInputRef.current.value = ''; // Reset file input
        }
    };
    
    const handleUrlScrape = async () => {
        const url = prompt("Anna verkkosivun osoite (URL):");
        if (!url) return;

        setIsLoading(prev => ({ ...prev, url: true }));
        try {
            const content = await scrapeTextFromUrl(url);
            const urlObject = new URL(url);
            // Store original URL in content prefix for preview
            addKnowledgeItem({
                type: 'url',
                name: urlObject.hostname,
                content: `URL: ${url}\n\n${content.substring(0, 20000)}`,
            });
            addNotification({ message: `Sivuston ${urlObject.hostname} sisältö lisätty.`, type: 'success' });
        } catch (error: any) {
            console.error('URL scraping error:', error);
            addNotification({ message: error.message || 'Sivuston lukeminen epäonnistui.', type: 'error' });
        } finally {
            setIsLoading(prev => ({ ...prev, url: false }));
        }
    };

    const getUrlFromContent = (content: string): string | null => {
        if (content.startsWith('URL: ')) {
            const urlMatch = content.match(/^URL: (https?:\/\/[^\n]+)/);
            return urlMatch ? urlMatch[1] : null;
        }
        return null;
    };

    const getContentWithoutUrl = (content: string): string => {
        if (content.startsWith('URL: ')) {
            return content.split('\n\n').slice(1).join('\n\n');
        }
        return content;
    };

    const isPdfFile = (item: KnowledgeSource): boolean => {
        return item.type === 'file' && item.name.toLowerCase().endsWith('.pdf');
    };


    if (!knowledgeBase) return null;

    return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
            <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}><Book className="w-6 h-6" /> {t('know.title')}</h3>
            
            <div className="p-6 rounded-lg border" style={{
                backgroundColor: 'var(--admin-card-bg, #1f2937)',
                borderColor: 'var(--admin-border, #374151)'
            }}>
                <h4 className="font-semibold" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{t('know.general')}</h4>
                <p className="text-sm mt-1" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}>{t('know.general_desc')}</p>
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.txt" className="hidden" />
                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={isLoading.file} 
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md disabled:opacity-50 transition-colors"
                        style={{
                            backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                            color: 'var(--admin-text-primary, #f3f4f6)'
                        }}
                        onMouseEnter={(e) => {
                            if (!isLoading.file) {
                                e.currentTarget.style.backgroundColor = 'var(--admin-card-bg, #4b5563)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isLoading.file) {
                                e.currentTarget.style.backgroundColor = 'var(--admin-sidebar-bg, #374151)';
                            }
                        }}
                    >
                        {isLoading.file ? <Loader className="w-5 h-5 animate-spin"/> : <UploadCloud className="w-5 h-5" />}
                        {isLoading.file ? 'Ladataan...' : t('know.upload_file')}
                    </button>
                    <button 
                        onClick={handleUrlScrape} 
                        disabled={isLoading.url} 
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md disabled:opacity-50 transition-colors"
                        style={{
                            backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                            color: 'var(--admin-text-primary, #f3f4f6)'
                        }}
                        onMouseEnter={(e) => {
                            if (!isLoading.url) {
                                e.currentTarget.style.backgroundColor = 'var(--admin-card-bg, #4b5563)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isLoading.url) {
                                e.currentTarget.style.backgroundColor = 'var(--admin-sidebar-bg, #374151)';
                            }
                        }}
                    >
                       {isLoading.url ? <Loader className="w-5 h-5 animate-spin"/> : <FileText className="w-5 h-5" />}
                       {isLoading.url ? 'Luetaan...' : t('know.add_web')}
                    </button>
                </div>

                <div className="mt-5 space-y-2">
                    {knowledgeBase.map(item => {
                        const itemUrl = item.type === 'url' ? getUrlFromContent(item.content) : null;
                        return (
                            <div 
                                key={item.id} 
                                className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors"
                                style={{
                                    backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                                    opacity: 0.5
                                }}
                                onClick={() => setPreviewItem(item)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = '0.7';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = '0.5';
                                }}
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {item.type === 'url' ? (
                                        <ExternalLink className="w-5 h-5 text-blue-400 flex-shrink-0" />
                                    ) : (
                                        <FileText className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }} />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm truncate block" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{item.name}</span>
                                        {itemUrl && (
                                            <span className="text-xs truncate block" style={{ color: 'var(--admin-text-muted, #9ca3af)' }}>{itemUrl}</span>
                                        )}
                                    </div>
                                </div>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteKnowledgeItem(item.id);
                                    }} 
                                    className="p-1 rounded-full flex-shrink-0 transition-colors"
                                    style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = '#ef4444';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = 'var(--admin-text-secondary, #d1d5db)';
                                    }}
                                >
                                    <Trash2 className="w-4 h-4"/>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="p-6 rounded-lg border" style={{
                backgroundColor: 'var(--admin-card-bg, #1f2937)',
                borderColor: 'var(--admin-border, #374151)'
            }}>
                <TrainingConsole />
            </div>

            {/* Preview Modal */}
            {previewItem && (
                <div 
                    className="fixed inset-0 flex items-center justify-center z-50 p-4"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
                    onClick={() => setPreviewItem(null)}
                >
                    <div 
                        className="rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col border"
                        style={{
                            backgroundColor: 'var(--admin-card-bg, #1f2937)',
                            borderColor: 'var(--admin-border, #374151)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--admin-border, #374151)' }}>
                            <div className="flex items-center gap-3">
                                {previewItem.type === 'url' ? (
                                    <ExternalLink className="w-6 h-6 text-blue-400" />
                                ) : (
                                    <FileText className="w-6 h-6" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }} />
                                )}
                                <div>
                                    <h3 className="text-lg font-semibold" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{previewItem.name}</h3>
                                    {previewItem.type === 'url' && getUrlFromContent(previewItem.content) && (
                                        <a 
                                            href={getUrlFromContent(previewItem.content)!} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {getUrlFromContent(previewItem.content)}
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                            </div>
                            <button 
                                onClick={() => setPreviewItem(null)}
                                className="p-2 rounded-full transition-colors"
                                style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--admin-sidebar-bg, #374151)';
                                    e.currentTarget.style.color = 'var(--admin-text-primary, #f3f4f6)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = 'var(--admin-text-secondary, #d1d5db)';
                                }}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-auto p-4">
                            {isPdfFile(previewItem) && previewItem.fileUrl ? (
                                <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-4">
                                    <FileText className="w-16 h-16" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }} />
                                    <p className="text-center" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>
                                        Tämä on PDF-tiedosto. Voit avata sen ulkoisessa katselussa.
                                    </p>
                                    <a
                                        href={previewItem.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-colors"
                                        style={{
                                            backgroundColor: '#2563eb',
                                            color: 'white'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#1d4ed8';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = '#2563eb';
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                        Avaa PDF-tiedosto
                                    </a>
                                </div>
                            ) : (
                                <div className="prose prose-invert max-w-none">
                                    <pre className="whitespace-pre-wrap text-sm p-4 rounded-lg border font-sans" style={{
                                        color: 'var(--admin-text-primary, #f3f4f6)',
                                        backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                                        borderColor: 'var(--admin-border, #374151)',
                                        opacity: 0.5
                                    }}>
                                        {getContentWithoutUrl(previewItem.content)}
                                    </pre>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t flex justify-end gap-2" style={{ borderColor: 'var(--admin-border, #374151)' }}>
                            {isPdfFile(previewItem) && previewItem.fileUrl && (
                                <a
                                    href={previewItem.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors"
                                    style={{
                                        backgroundColor: '#2563eb',
                                        color: 'white'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#1d4ed8';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#2563eb';
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Avaa tiedosto
                                </a>
                            )}
                            <button 
                                onClick={() => setPreviewItem(null)}
                                className="px-4 py-2 rounded-md text-sm transition-colors"
                                style={{
                                    backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                                    color: 'var(--admin-text-primary, #f3f4f6)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--admin-card-bg, #4b5563)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--admin-sidebar-bg, #374151)';
                                }}
                            >
                                Sulje
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KnowledgeBaseSettings;
