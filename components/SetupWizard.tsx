
import React from 'react';
import { useAppSetup } from '../hooks/useAppSetup.ts';
import { Bot as BotIcon, Loader, RefreshCcw, ArrowLeft, Check, X, LogOut } from './Icons.tsx';
import { Bot } from '../types.ts';
import { botTemplates } from '../data/defaultBots.ts';
import { ScrapeMode } from '../services/scraperService.ts';

interface SetupWizardProps {
    onSetupComplete: (bot: Omit<Bot, 'id'>) => void;
    onCancel?: () => void;
    onLogout?: () => void;
}

const ColorPicker: React.FC<{ title: string, colors: string[], selected: string | null, onSelect: (color: string) => void }> = ({ title, colors, selected, onSelect }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">{title}</label>
        <div className="flex flex-wrap gap-2">
            {colors.map(color => (
                <button key={color} onClick={() => onSelect(color)} className={`w-10 h-10 rounded-full ring-2 ${selected === color ? 'ring-offset-2 ring-offset-gray-800 ring-white' : 'ring-transparent'}`} style={{ backgroundColor: color }} />
            ))}
        </div>
    </div>
);

const LogoPicker: React.FC<{ logos: string[], selected: string | null, onSelect: (logo: string) => void }> = ({ logos, selected, onSelect }) => {
    const [failedLogos, setFailedLogos] = React.useState<Set<string>>(new Set());
    
    const handleImageError = (logo: string) => {
        console.warn('Logo failed to load:', logo);
        setFailedLogos(prev => new Set(prev).add(logo));
    };
    
    const validLogos = logos.filter(logo => !failedLogos.has(logo));
    
    // Debug logging
    React.useEffect(() => {
        console.log('LogoPicker - Total logos:', logos.length);
        console.log('LogoPicker - Valid logos:', validLogos.length);
        console.log('LogoPicker - Failed logos:', failedLogos.size);
        console.log('LogoPicker - Selected logo:', selected);
    }, [logos, validLogos, failedLogos, selected]);
    
    return (
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Valitse logo</label>
            <div className="flex flex-wrap gap-2">
                {validLogos.map(logo => (
                    <button 
                        key={logo} 
                        onClick={() => {
                            console.log('Logo selected:', logo);
                            onSelect(logo);
                        }} 
                        className={`w-16 h-16 p-1 rounded-md bg-gray-700 ring-2 ${selected === logo ? 'ring-offset-2 ring-offset-gray-800 ring-white' : 'ring-transparent'}`}
                    >
                        <img 
                            src={logo} 
                            alt="logo" 
                            className="w-full h-full object-contain" 
                            onError={() => handleImageError(logo)}
                            onLoad={() => console.log('Logo loaded successfully:', logo)}
                        />
                    </button>
                ))}
            </div>
            {validLogos.length === 0 && logos.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">Logoja ei voitu ladata. Kokeile lisätä logo manuaalisesti asetuksista.</p>
            )}
            {logos.length === 0 && (
                <p className="text-xs text-gray-400 mt-2">Logoja ei löytynyt sivustolta.</p>
            )}
        </div>
    );
};

const TemplateSelector: React.FC<{ selected: string, onSelect: (id: string) => void }> = ({ selected, onSelect }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Valitse botin mallipohja</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {botTemplates.map(template => (
                <button key={template.id} onClick={() => onSelect(template.id)} className={`p-4 rounded-lg border-2 text-left transition-all ${selected === template.id ? 'border-blue-500 bg-blue-900/30' : 'border-gray-600 hover:border-gray-500 bg-gray-800'}`}>
                    <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-white">{template.name}</h4>
                        {selected === template.id && <Check className="w-5 h-5 text-blue-400" />}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{template.description}</p>
                </button>
            ))}
        </div>
    </div>
);


const SetupWizard: React.FC<SetupWizardProps> = ({ onSetupComplete, onCancel, onLogout }) => {
    const [scrapeMode, setScrapeMode] = React.useState<ScrapeMode>('default');
    
    const {
        step,
        setStep,
        isLoading,
        error,
        websiteUrl,
        setWebsiteUrl,
        startScraping,
        scrapedData,
        brandName,
        setBrandName,
        selectedLogo,
        setSelectedLogo,
        selectedColor,
        setSelectedColor,
        selectedHeaderColor,
        setSelectedHeaderColor,
        selectedTemplateId,
        setSelectedTemplateId,
        finalizeSetup,
    } = useAppSetup(onSetupComplete);
    
    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (websiteUrl) {
            startScraping(websiteUrl, scrapeMode);
        }
    };
    
    const renderStep = () => {
        switch(step) {
            case 1:
                return (
                    <form onSubmit={handleUrlSubmit} className="space-y-6 relative">
                        {onLogout && (
                            <button 
                                type="button"
                                onClick={onLogout}
                                className="absolute -top-4 -right-4 p-2 text-gray-400 hover:text-white"
                                title="Kirjaudu ulos"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        )}

                         <div className="text-center">
                            <BotIcon className="w-16 h-16 mx-auto text-blue-500 mb-4 animate-float" />
                            <h1 className="text-3xl font-bold text-white">Luodaan uusi botti</h1>
                            <p className="text-gray-400 mt-2">Anna yrityksesi verkkosivun osoite. Analysoimme sivun ja luomme automaattisesti botin brändisi mukaan.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Scraper Mode</label>
                            <select
                                value={scrapeMode}
                                onChange={(e) => setScrapeMode(e.target.value as ScrapeMode)}
                                className="w-full px-3 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isLoading}
                            >
                                <option value="default">Default</option>
                                <option value="dataflow-vk">Dataflow VK</option>
                                <option value="dataflow-sites">Dataflow Sites</option>
                                <option value="dataflow-travel">Dataflow Travel</option>
                            </select>
                        </div>

                        <div>
                            <input
                                type="url"
                                value={websiteUrl}
                                onChange={(e) => setWebsiteUrl(e.target.value)}
                                placeholder="https://esimerkki.fi"
                                className="w-full px-4 py-3 bg-white/10 text-white border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                                disabled={isLoading}
                            />
                        </div>

                         <div className="flex flex-col gap-3">
                            <button type="submit" disabled={isLoading || !websiteUrl} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow-md hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50">
                                {isLoading ? <Loader className="animate-spin w-5 h-5"/> : <RefreshCcw className="w-5 h-5" />}
                                {isLoading ? 'Analysoidaan sivustoa...' : 'Analysoi ja jatka'}
                            </button>
                            
                            {onCancel && (
                                <button 
                                    type="button" 
                                    onClick={onCancel}
                                    className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
                                >
                                    Peruuta
                                </button>
                            )}
                        </div>
                        
                        {error && (
                            <div className="p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-200 text-sm flex items-start gap-2">
                                <span>⚠️</span>
                                <p>{error}</p>
                            </div>
                        )}
                    </form>
                );
            case 2:
                 if (!scrapedData) return null;
                 return (
                    <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
                        <div className="flex items-center gap-4 border-b border-gray-700 pb-4">
                             <button onClick={() => setStep(1)} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white">
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Viimeistele botti</h2>
                                <p className="text-gray-400 text-sm">Tarkista tiedot ja valitse tyyli.</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Botin nimi</label>
                                <input
                                    type="text"
                                    value={brandName}
                                    onChange={(e) => setBrandName(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ColorPicker 
                                    title="Pääväri" 
                                    colors={scrapedData.colors || ['#4f46e5', '#1f2937', '#3b82f6', '#10b981', '#f59e0b']} 
                                    selected={selectedColor} 
                                    onSelect={setSelectedColor} 
                                />
                                <ColorPicker 
                                    title="Ylätunnisteen väri" 
                                    colors={scrapedData.colors || ['#4f46e5', '#1f2937', '#3b82f6', '#10b981', '#f59e0b']} 
                                    selected={selectedHeaderColor} 
                                    onSelect={setSelectedHeaderColor} 
                                />
                            </div>

                            {scrapedData.logos && scrapedData.logos.length > 0 ? (
                                <LogoPicker 
                                    logos={scrapedData.logos} 
                                    selected={selectedLogo} 
                                    onSelect={setSelectedLogo} 
                                />
                            ) : (
                                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                                    <p className="text-sm text-gray-400">Logoja ei löytynyt sivustolta. Voit lisätä logon myöhemmin asetuksista.</p>
                                </div>
                            )}
                            
                            <div className="border-t border-gray-700 pt-6">
                                <TemplateSelector 
                                    selected={selectedTemplateId} 
                                    onSelect={setSelectedTemplateId} 
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-700">
                             <button onClick={finalizeSetup} className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg rounded-lg shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-[1.02]">
                                <Check className="w-6 h-6" />
                                Luo Botti
                            </button>
                        </div>
                    </div>
                 );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#141414] flex items-center justify-center p-4">
            <div className={`w-full ${step === 2 ? 'max-w-4xl' : 'max-w-md'} bg-black bg-opacity-20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 transition-all duration-500`}>
                {renderStep()}
            </div>
        </div>
    );
};

export default SetupWizard;
