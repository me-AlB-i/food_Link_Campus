
import { useState, useEffect, useRef } from 'react';
import { Send, X, Headphones, Minimize2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supportAPI } from '../../services/api';

export default function SupportChatWidget({ isOpen, onClose }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const pollingRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            fetchMessages();
            // Poll for new messages every 3 seconds
            pollingRef.current = setInterval(fetchMessages, 3000);
            return () => {
                if (pollingRef.current) clearInterval(pollingRef.current);
            };
        }
    }, [isOpen]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const res = await supportAPI.getMessages();
            // Only update if length changed to compare (simple optimization)
            setMessages(prev => {
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
        if (!newMessage.trim()) return;

        const tempMsg = {
            id: 'temp-' + Date.now(),
            sender: { username: user.username, id: user.id },
            message: newMessage,
            created_at: new Date().toISOString(),
            is_temp: true
        };

        setMessages(prev => [...prev, tempMsg]);
        setNewMessage('');
        setLoading(true);

        try {
            const res = await supportAPI.sendMessage(newMessage);
            setMessages(prev => prev.map(m => m.id === tempMsg.id ? res.data : m));
        } catch (err) {
            console.error("Failed to send", err);
            // Remove temp message if failed
            setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] h-[500px] max-h-[80vh] bg-white dark:bg-surface-800 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-700 flex flex-col z-50 animate-scale-in overflow-hidden">
            {/* Header */}
            <div className="bg-student-600 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Headphones className="w-5 h-5" />
                    <div>
                        <h3 className="font-bold text-sm">Customer Support</h3>
                        <p className="text-xs text-student-100">Direct line to Admin</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-50 dark:bg-surface-900/50">
                {messages.length === 0 ? (
                    <div className="text-center text-surface-400 dark:text-surface-500 mt-20">
                        <Headphones className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">How can we help you today?</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMe = msg.sender.username === user.username; // Fallback check
                        // Actually sender is an object with id/username in backend response
                        // Check if msg.sender.id matching user.id might be safer if user changes username
                        // but sticking to username for now or checking provided user context.
                        const isMyMsg = msg.sender.id === user.id || msg.sender.id === user._id;

                        return (
                            <div
                                key={msg.id || idx}
                                className={`flex ${isMyMsg ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`
                                        max-w-[75%] px-4 py-2 rounded-2xl text-sm relative
                                        ${isMyMsg
                                            ? 'bg-student-500 text-white rounded-tr-none'
                                            : 'bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-600 rounded-tl-none'
                                        }
                                    `}
                                >
                                    <p>{msg.message}</p>
                                    <span
                                        className={`
                                            text-[10px] block mt-1 opacity-70
                                            ${isMyMsg ? 'text-student-100 font-medium text-right' : 'text-surface-400'}
                                        `}
                                    >
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 bg-white dark:bg-surface-800 border-t border-surface-100 dark:border-surface-700 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 input py-2 text-sm bg-surface-50 dark:bg-surface-900 py-2.5"
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim() || loading}
                    className="btn-primary p-2.5 rounded-xl flex-shrink-0"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
}
