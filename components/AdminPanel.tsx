import React, { useState, useEffect } from 'react';
import { Loader2, Trash2, KeyRound, RefreshCcw } from 'lucide-react';

const ADMIN_KEY_STORAGE = 'yingyu_admin_key';

interface UserSummary {
    username: string;
    points: number;
    badgesCount: number;
    level: string;
}

interface AdminPanelProps {
    onBack: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
    const [adminKey, setAdminKey] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [users, setUsers] = useState<UserSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        const storedKey = sessionStorage.getItem(ADMIN_KEY_STORAGE);
        if (storedKey) {
            setAdminKey(storedKey);
            verifyKeyAndLoad(storedKey);
        }
    }, []);

    const verifyKeyAndLoad = async (key: string) => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin', {
                headers: { 'x-admin-key': key }
            });
            if (res.ok) {
                setIsAuthenticated(true);
                sessionStorage.setItem(ADMIN_KEY_STORAGE, key);
                const data = await res.json();
                setUsers(data);
            } else {
                setIsAuthenticated(false);
                sessionStorage.removeItem(ADMIN_KEY_STORAGE);
                // Only alert if we tried manually content
                if (key !== sessionStorage.getItem(ADMIN_KEY_STORAGE)) alert('Invalid Admin Key');
            }
        } catch (e) {
            console.error(e);
            alert('Connection error');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = () => {
        verifyKeyAndLoad(adminKey);
    };

    const handleResetPassword = async (targetUsername: string) => {
        if (!window.confirm(`Reset password for ${targetUsername} to "123456"?`)) return;

        setActionLoading(targetUsername);
        try {
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify({ action: 'reset_password', targetUsername })
            });

            const data = await res.json();
            if (res.ok) alert(data.message);
            else alert(data.error);
        } catch (e) {
            alert('Failed to reset password');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteUser = async (targetUsername: string) => {
        if (!window.confirm(`⚠️ DANGER: Permantently delete user ${targetUsername} and ALL their data?`)) return;

        setActionLoading(targetUsername);
        try {
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify({ action: 'delete_user', targetUsername })
            });

            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                // Refresh list
                verifyKeyAndLoad(adminKey);
            } else {
                alert(data.error);
            }
        } catch (e) {
            alert('Failed to delete user');
        } finally {
            setActionLoading(null);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-xl border border-slate-100 text-center">
                <h2 className="text-2xl font-black text-slate-800 mb-6">Admin Access</h2>
                <input
                    type="password"
                    className="w-full p-4 bg-slate-50 rounded-xl mb-4 border-none"
                    placeholder="Enter Admin Key"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                />
                <div className="flex gap-4">
                    <button onClick={onBack} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Cancel</button>
                    <button
                        onClick={handleLogin}
                        disabled={loading || !adminKey}
                        className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Login'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-black text-slate-800">User Management</h1>
                <div className="flex gap-4">
                    <button onClick={() => verifyKeyAndLoad(adminKey)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                        <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={onBack} className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold">Exit Admin</button>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="p-6 font-black text-slate-400 uppercase text-xs tracking-wider">Username</th>
                            <th className="p-6 font-black text-slate-400 uppercase text-xs tracking-wider">Level</th>
                            <th className="p-6 font-black text-slate-400 uppercase text-xs tracking-wider">Stats</th>
                            <th className="p-6 font-black text-slate-400 uppercase text-xs tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {users.map(user => (
                            <tr key={user.username} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-6 font-bold text-slate-700">{user.username}</td>
                                <td className="p-6 text-slate-500 font-medium">{user.level}</td>
                                <td className="p-6">
                                    <span className="text-indigo-600 font-bold">{user.points} pts</span>
                                    <span className="text-slate-300 mx-2">•</span>
                                    <span className="text-amber-600 font-bold">{user.badgesCount} badges</span>
                                </td>
                                <td className="p-6 flex gap-3 justify-end">
                                    <button
                                        onClick={() => handleResetPassword(user.username)}
                                        disabled={!!actionLoading}
                                        className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors"
                                    >
                                        <KeyRound size={14} /> Reset Pwd
                                    </button>
                                    <button
                                        onClick={() => handleDeleteUser(user.username)}
                                        disabled={!!actionLoading}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && !loading && (
                            <tr>
                                <td colSpan={4} className="p-12 text-center text-slate-400 italic">No users found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminPanel;
