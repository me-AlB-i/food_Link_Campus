import { useState, useEffect, useRef } from 'react';
import { supportAPI } from '../../services/api';
import { Headphones, Search, Send, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminSupportPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);

    const messagesEndRef = useRef(null);
    const pollingRef = useRef(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (selectedUser) {
            fetchMessages(selectedUser.id);
            // Poll for messages
            pollingRef.current = setInterval(() => fetchMessages(selectedUser.id), 3000);
        }
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [selectedUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchUsers = async () => {
        try {
            const res = await supportAPI.getSupportUsers();
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchMessages = async (userId) => {
        try {
            const res = await supportAPI.getUserHistory(userId);
            setMessages(prev => {
                // Optimization: only update if different length or last ID
                if (prev.length !== res.data.length || (res.data.length > 0 && prev[prev.length - 1]?.id !== res.data[res.data.length - 1].id)) {
                    return res.data;
                }
                return prev;
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;

        const tempMsg = {
            id: 'temp-' + Date.now(),
            sender: { username: user.username, id: user.id }, // Admin is sender
            message: newMessage,
            created_at: new Date().toISOString(),
            is_temp: true
        };

        setMessages(prev => [...prev, tempMsg]);
        setNewMessage('');

        try {
            const res = await supportAPI.replyToUser(selectedUser.id, newMessage);
            setMessages(prev => prev.map(m => m.id === tempMsg.id ? res.data : m));
        } catch (err) {
            console.error(err);
            setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
        }
    };

    return (
        <div className="page-container h-[calc(100vh-5rem)] flex flex-col md:flex-row gap-6">
            {/* Sidebar - Users List */}
            <div className="w-full md:w-80 flex flex-col bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-700 overflow-hidden">
                <div className="p-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50">
                    <h2 className="font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                        <Headphones className="w-5 h-5 text-student-600" />
                        Support Chats
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loadingUsers ? (
                        <div className="p-4 text-center text-sm text-surface-500">Loading users...</div>
                    ) : users.length === 0 ? (
                        <div className="p-4 text-center text-sm text-surface-500">No active conversations</div>
                    ) : (
                        users.map(u => (
                            <button
                                key={u.id}
                                onClick={() => setSelectedUser(u)}
                                className={`w-full text-left p-4 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors border-b border-surface-100 dark:border-surface-700 flex items-center gap-3 ${selectedUser?.id === u.id ? 'bg-student-50 dark:bg-student-900/20' : ''}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center text-surface-500 font-bold">
                                    {(u.full_name?.[0] || u.username?.[0]).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium text-surface-900 dark:text-surface-100 truncate">{u.full_name || u.username}</p>
                                    <p className="text-xs text-surface-500 dark:text-surface-400 capitalize">{u.role}</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-700 overflow-hidden">
                {selectedUser ? (
                    <>
                        <div className="p-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-student-100 dark:bg-student-900/50 flex items-center justify-center text-student-700 font-bold">
                                    {(selectedUser.full_name?.[0] || selectedUser.username?.[0]).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-surface-900 dark:text-surface-100">{selectedUser.full_name || selectedUser.username}</h3>
                                    <p className="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wider">{selectedUser.role}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-50/50 dark:bg-surface-900/30">
                            {messages.map((msg, idx) => {
                                // Check if sender is admin (me)
                                const isAdmin = msg.sender.role === 'admin' || msg.sender.username === user.username;

                                return (
                                    <div
                                        key={msg.id || idx}
                                        className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`
                                                max-w-[70%] px-4 py-3 rounded-2xl text-sm
                                                ${isAdmin
                                                    ? 'bg-student-500 text-white rounded-tr-none'
                                                    : 'bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-600 rounded-tl-none shadow-sm'
                                                }
                                            `}
                                        >
                                            <p>{msg.message}</p>
                                            <span
                                                className={`
                                                    text-[10px] block mt-1 opacity-70
                                                    ${isAdmin ? 'text-student-100 font-medium text-right' : 'text-surface-400'}
                                                `}
                                            >
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSend} className="p-4 bg-white dark:bg-surface-800 border-t border-surface-100 dark:border-surface-700 flex gap-3">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your reply..."
                                className="flex-1 input"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="btn-primary"
                            >
                                <Send className="w-4 h-4 mr-2" />
                                Send
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-surface-400 dark:text-surface-500 p-8">
                        <div className="w-16 h-16 bg-surface-100 dark:bg-surface-700 rounded-full flex items-center justify-center mb-4">
                            <Headphones className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">Select a conversation</h3>
                        <p className="text-sm">Choose a user from the sidebar to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
}
