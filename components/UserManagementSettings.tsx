import React, { useState, useEffect } from 'react';
import { useUserManagement } from '../hooks/useUserManagement.ts';
import { User } from '../types.ts';
import { Shield, Plus, Trash2, Loader, ChevronDown, ChevronUp } from './Icons.tsx';
import { useNotification } from '../context/NotificationContext.tsx';
import { useBotContext } from '../context/BotContext.tsx';

const UserManagementSettings: React.FC = () => {
    const { users, loading, addUser, updateUser, deleteUser, getCurrentUserRole, isAdmin: checkIsAdmin, isSuperAdmin: checkIsSuperAdmin } = useUserManagement();
    const { addNotification } = useNotification();
    const { bots } = useBotContext();
    const [userIsAdmin, setUserIsAdmin] = useState<boolean | null>(null);
    const [userIsSuperAdmin, setUserIsSuperAdmin] = useState<boolean | null>(null);
    const [checkingAdmin, setCheckingAdmin] = useState(true);
    const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

    useEffect(() => {
        const checkAdmin = async () => {
            setCheckingAdmin(true);
            const admin = await checkIsAdmin();
            const superAdmin = await checkIsSuperAdmin();
            setUserIsAdmin(admin);
            setUserIsSuperAdmin(superAdmin);
            setCheckingAdmin(false);
        };
        checkAdmin();
    }, []);

    const handleAddUser = async () => {
        if (!userIsAdmin) return;

        const email = prompt("Anna uuden käyttäjän sähköposti:");
        if (!email) return;

        const password = prompt("Anna uuden käyttäjän salasana (vähintään 6 merkkiä):");
        if (!password || password.length < 6) {
            addNotification({ message: 'Salasanan on oltava vähintään 6 merkkiä pitkä.', type: 'error' });
            return;
        }

        const role = prompt("Anna käyttäjän rooli (superadmin/admin/agent/viewer):", 'agent') as 'superadmin' | 'admin' | 'agent' | 'viewer';
        if (!['superadmin', 'admin', 'agent', 'viewer'].includes(role)) {
            addNotification({ message: 'Virheellinen rooli. Käytä: superadmin, admin, agent tai viewer.', type: 'error' });
            return;
        }
        
        // Only superadmin can create superadmin users
        if (role === 'superadmin' && !userIsSuperAdmin) {
            addNotification({ message: 'Vain superadmin-käyttäjät voivat luoda superadmin-käyttäjiä.', type: 'error' });
            return;
        }

        try {
            await addUser(email, role, password);
            addNotification({ message: `Käyttäjä ${email} lisätty onnistuneesti.`, type: 'success' });
        } catch (error: any) {
            console.error('Error adding user:', error);
            addNotification({ 
                message: error.message || 'Käyttäjän lisääminen epäonnistui.', 
                type: 'error' 
            });
        }
    };

    const handleRoleChange = async (user: User, role: User['role']) => {
        if (!userIsAdmin) return;
        
        // Only superadmin can change role to/from superadmin
        if ((user.role === 'superadmin' || role === 'superadmin') && !userIsSuperAdmin) {
            addNotification({ 
                message: 'Vain superadmin-käyttäjät voivat muuttaa superadmin-roolia.', 
                type: 'error' 
            });
            return;
        }

        try {
            await updateUser({ ...user, role });
            addNotification({ message: `Käyttäjän ${user.email} rooli päivitetty.`, type: 'success' });
        } catch (error: any) {
            console.error('Error updating user:', error);
            addNotification({ 
                message: error.message || 'Käyttäjän päivitys epäonnistui.', 
                type: 'error' 
            });
        }
    };

    const handleDeleteUser = async (uid: string, email: string) => {
        if (!userIsAdmin) return;

        if (!confirm(`Haluatko varmasti poistaa käyttäjän ${email}?`)) {
            return;
        }

        try {
            await deleteUser(uid);
            addNotification({ message: `Käyttäjä ${email} poistettu.`, type: 'success' });
        } catch (error: any) {
            console.error('Error deleting user:', error);
            addNotification({ 
                message: error.message || 'Käyttäjän poistaminen epäonnistui.', 
                type: 'error' 
            });
        }
    };

    const toggleUserExpanded = (uid: string) => {
        setExpandedUsers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(uid)) {
                newSet.delete(uid);
            } else {
                newSet.add(uid);
            }
            return newSet;
        });
    };

    const handleBotToggle = async (user: User, botId: string) => {
        if (!userIsAdmin) return;

        const currentBotIds = user.allowedBotIds || [];
        const newBotIds = currentBotIds.includes(botId)
            ? currentBotIds.filter(id => id !== botId)
            : [...currentBotIds, botId];

        try {
            // Update user with new bot IDs
            const updatedUser = { ...user, allowedBotIds: newBotIds };
            await updateUser(updatedUser);
            
            addNotification({ 
                message: `Käyttäjän ${user.email} botit päivitetty.`, 
                type: 'success' 
            });
        } catch (error: any) {
            console.error('Error updating user bots:', error);
            addNotification({ 
                message: error.message || 'Botien päivitys epäonnistui.', 
                type: 'error' 
            });
        }
    };

    if (checkingAdmin || loading) {
        return (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}><Shield className="w-6 h-6" /> Käyttäjähallinta</h3>
                <div className="p-6 rounded-lg border flex items-center justify-center" style={{
                    backgroundColor: 'var(--admin-card-bg, #1f2937)',
                    borderColor: 'var(--admin-border, #374151)'
                }}>
                    <Loader className="w-6 h-6 animate-spin" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }} />
                </div>
            </div>
        );
    }

    if (userIsAdmin === false) {
        return (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}><Shield className="w-6 h-6" /> Käyttäjähallinta</h3>
                <div className="p-6 rounded-lg border" style={{
                    backgroundColor: 'var(--admin-card-bg, #1f2937)',
                    borderColor: 'var(--admin-border, #374151)'
                }}>
                    <p style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}>Sinulla ei ole oikeuksia käyttäjähallintaan. Vain admin-käyttäjät voivat hallita käyttäjiä.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
            <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}><Shield className="w-6 h-6" /> Käyttäjähallinta</h3>

            <div className="p-6 rounded-lg border" style={{
                backgroundColor: 'var(--admin-card-bg, #1f2937)',
                borderColor: 'var(--admin-border, #374151)'
            }}>
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>Käyttäjät</h4>
                    <button 
                        onClick={handleAddUser} 
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
                        <Plus className="w-4 h-4"/> Lisää käyttäjä
                    </button>
                </div>
                <div className="space-y-3">
                    {users.length === 0 ? (
                        <p className="text-sm" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}>Ei käyttäjiä.</p>
                    ) : (
                        users.map(user => {
                            const isExpanded = expandedUsers.has(user.uid);
                            const userAllowedBots = user.allowedBotIds || [];
                            
                            return (
                                <div key={user.uid} className="p-3 rounded-lg" style={{
                                    backgroundColor: 'var(--admin-sidebar-bg, #374151)'
                                }}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="font-medium" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{user.name}</p>
                                            <p className="text-sm" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}>{user.email}</p>
                                            <p className="text-xs mt-1" style={{ color: 'var(--admin-text-muted, #9ca3af)' }}>
                                                Rooli: {user.role === 'superadmin' ? 'Superadmin' : user.role === 'admin' ? 'Admin' : user.role === 'agent' ? 'Agentti' : 'Katselija'} 
                                                {userAllowedBots.length > 0 && ` • ${userAllowedBots.length} bottia`}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <select 
                                                value={user.role} 
                                                onChange={(e) => handleRoleChange(user, e.target.value as User['role'])}
                                                className="rounded-md px-2 py-1 text-sm border"
                                                disabled={user.role === 'superadmin' && !userIsSuperAdmin}
                                                style={{
                                                    backgroundColor: 'var(--admin-card-bg, #1f2937)',
                                                    color: 'var(--admin-text-primary, #f3f4f6)',
                                                    borderColor: 'var(--admin-border, #374151)'
                                                }}
                                            >
                                                {userIsSuperAdmin && <option value="superadmin">Superadmin</option>}
                                                <option value="admin">Admin</option>
                                                <option value="agent">Agentti</option>
                                                <option value="viewer">Katselija</option>
                                            </select>
                                            <button
                                                onClick={() => toggleUserExpanded(user.uid)}
                                                className="p-2 rounded-full transition-colors"
                                                style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.color = 'var(--admin-text-primary, #f3f4f6)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.color = 'var(--admin-text-secondary, #d1d5db)';
                                                }}
                                                title="Näytä/piilota botit"
                                            >
                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </button>
                                            {!(user.role === 'superadmin' && !userIsSuperAdmin) && (
                                                <button 
                                                    onClick={() => handleDeleteUser(user.uid, user.email)} 
                                                    className="p-2 rounded-full transition-colors"
                                                    style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.color = '#ef4444';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.color = 'var(--admin-text-secondary, #d1d5db)';
                                                    }}
                                                    title="Poista käyttäjä"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            {user.role === 'superadmin' && !userIsSuperAdmin && (
                                                <span className="text-xs" style={{ color: 'var(--admin-text-muted, #9ca3af)' }} title="Vain superadmin voi poistaa superadmin-käyttäjiä">
                                                    🔒
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {isExpanded && (
                                        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--admin-border, #374151)' }}>
                                            <p className="text-sm font-medium mb-3" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>
                                                Käytettävissä olevat botit:
                                                <span className="text-xs ml-2" style={{ color: 'var(--admin-text-muted, #9ca3af)' }}>
                                                    (Valittu: {userAllowedBots.length} / {bots.length} saatavilla)
                                                </span>
                                            </p>
                                            {bots.length === 0 ? (
                                                <p className="text-sm" style={{ color: 'var(--admin-text-muted, #9ca3af)' }}>Ei botteja saatavilla.</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {bots.map(bot => {
                                                        const isSelected = userAllowedBots.includes(bot.id);
                                                        return (
                                                            <label 
                                                                key={bot.id}
                                                                className="flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors"
                                                                style={{
                                                                    backgroundColor: 'var(--admin-card-bg, #1f2937)'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.backgroundColor = 'var(--admin-sidebar-bg, #374151)';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.backgroundColor = 'var(--admin-card-bg, #1f2937)';
                                                                }}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => handleBotToggle(user, bot.id)}
                                                                    className="w-4 h-4 rounded focus:ring-[var(--color-primary)]"
                                                                    style={{
                                                                        accentColor: 'var(--color-primary)',
                                                                        backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                                                                        borderColor: 'var(--admin-border, #374151)'
                                                                    }}
                                                                />
                                                                <span className="text-sm" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{bot.name}</span>
                                                                <span className="text-xs" style={{ color: 'var(--admin-text-muted, #9ca3af)' }}>({bot.id})</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            {userAllowedBots.length > 0 && (
                                                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--admin-border, #374151)' }}>
                                                    <p className="text-xs mb-2" style={{ color: 'var(--admin-text-muted, #9ca3af)' }}>Valitut bot ID:t:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {userAllowedBots.map(botId => {
                                                            const botExists = bots.some(b => b.id === botId);
                                                            return (
                                                                <span 
                                                                    key={botId}
                                                                    className="text-xs px-2 py-1 rounded"
                                                                    style={{
                                                                        backgroundColor: botExists ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                                                                        color: botExists ? '#86efac' : '#fca5a5'
                                                                    }}
                                                                    title={botExists ? 'Botti löytyy' : 'Bottia ei löydy'}
                                                                >
                                                                    {botId}
                                                                    {!botExists && ' (ei löydy)'}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserManagementSettings;
