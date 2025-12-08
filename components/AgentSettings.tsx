
import React, { useState } from 'react';
import { useAgents } from '../hooks/useAgents.ts';
import { useSettings } from '../hooks/useSettings.ts';
import { Agent } from '../types.ts';
import { Users, Plus, Trash2, Edit2 } from './Icons.tsx';
import AvatarEditModal from './AvatarEditModal.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

const AgentSettings: React.FC = () => {
    const { agents, addAgent, updateAgent, deleteAgent } = useAgents();
    const { settings: agentsEnabled, setSettings: setAgentsEnabled } = useSettings('agentsEnabled');
    const { t } = useLanguage();

    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

    if (agents === undefined || agentsEnabled === undefined) return null;

    const handleAvatarSelect = (avatar: string) => {
        if (editingAgent) {
            updateAgent({ ...editingAgent, avatar });
            setEditingAgent({ ...editingAgent, avatar }); // update state in modal
        }
    };

    return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
            <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}><Users className="w-6 h-6" /> {t('agent.title')}</h3>
            
            <div className="p-6 rounded-lg border" style={{
                backgroundColor: 'var(--admin-card-bg, #1f2937)',
                borderColor: 'var(--admin-border, #374151)'
            }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-semibold" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{t('agent.enable')}</h4>
                        <p className="text-sm" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}>{t('agent.enable_desc')}</p>
                    </div>
                    <label htmlFor="agentsEnabled" className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="agentsEnabled" className="sr-only peer" checked={agentsEnabled} onChange={(e) => setAgentsEnabled(e.target.checked)} />
                        <div className="w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-[var(--color-primary)] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all" style={{
                            backgroundColor: agentsEnabled ? 'var(--admin-toggle-checked, var(--color-primary))' : 'var(--admin-toggle-bg, #4b5563)',
                            borderColor: 'var(--admin-border, #374151)'
                        }}></div>
                    </label>
                </div>
            </div>

            <div className={`p-6 rounded-lg border space-y-4 transition-opacity ${agentsEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`} style={{
                backgroundColor: 'var(--admin-card-bg, #1f2937)',
                borderColor: 'var(--admin-border, #374151)'
            }}>
                 <div className="flex justify-between items-center">
                    <h4 className="font-semibold" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{t('agent.list_title')}</h4>
                    <button 
                        onClick={addAgent} 
                        className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-md transition-colors"
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
                        <Plus className="w-4 h-4"/> {t('agent.add')}
                    </button>
                </div>
                <div className="space-y-3">
                    {agents.map(agent => (
                        <div key={agent.id} className="flex items-center gap-4 p-3 rounded-lg border" style={{
                            backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                            borderColor: 'var(--admin-border, #374151)',
                            opacity: 0.5
                        }}>
                            <button onClick={() => setEditingAgent(agent)} className="relative group">
                                <img src={agent.avatar} alt={agent.name} className="w-12 h-12 rounded-full object-cover" />
                                <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                                    <Edit2 className="w-5 h-5" style={{ color: 'white' }} />
                                </div>
                            </button>
                            <input
                                type="text"
                                value={agent.name}
                                onChange={(e) => updateAgent({ ...agent, name: e.target.value })}
                                className="flex-grow font-semibold focus:outline-none focus:ring-1 rounded px-2 py-1"
                                style={{
                                    backgroundColor: 'transparent',
                                    color: 'var(--admin-text-primary, #f3f4f6)',
                                    borderColor: 'transparent'
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                                    e.currentTarget.style.borderWidth = '1px';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = 'transparent';
                                }}
                            />
                            <button 
                                onClick={() => deleteAgent(agent.id)} 
                                className="p-2 rounded-full transition-colors"
                                style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = '#ef4444';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = 'var(--admin-text-secondary, #d1d5db)';
                                }}
                            >
                                <Trash2 className="w-5 h-5"/>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {editingAgent && (
                <AvatarEditModal
                    isOpen={!!editingAgent}
                    onClose={() => setEditingAgent(null)}
                    currentAvatar={editingAgent.avatar}
                    onSelect={handleAvatarSelect}
                />
            )}
        </div>
    );
};

export default AgentSettings;
