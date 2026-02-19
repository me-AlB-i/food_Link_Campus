/**
 * FoodLink Campus - NIYOM Chat Widget
 * AI-powered floating chat assistant
 */
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { chatAPI } from '../../services/api';

const quickActions = [
    "How do I list food?",
    "How do I reserve food?",
    "What are Green Points?",
    "Canteen hours?",
];

export default function NiyomBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            text: "Hi! I'm NIYOM 🌱 How can I help you with FoodLink Campus today?",
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (text = input) => {
        if (!text.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            text: text.trim(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await chatAPI.send(text);

            const botMessage = {
                id: Date.now() + 1,
                type: 'bot',
                text: response.data.response,
                source: response.data.source,
            };

            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            const errorMessage = {
                id: Date.now() + 1,
                type: 'bot',
                text: "Sorry, I'm having trouble connecting right now. Please try again later.",
                isError: true,
            };
            setMessages((prev) => [...prev, errorMessage]);
        }

        setIsLoading(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-full
          flex items-center justify-center
          shadow-lg transition-all duration-300
          ${isOpen
                        ? 'bg-surface-700 rotate-90'
                        : 'bg-student-500 hover:bg-student-600 hover:scale-110'
                    }
        `}
                aria-label={isOpen ? 'Close chat' : 'Open NIYOM'}
            >
                {isOpen ? (
                    <X className="w-6 h-6 text-white" />
                ) : (
                    <MessageCircle className="w-6 h-6 text-white" />
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] animate-slide-up">
                    <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-2xl overflow-hidden border border-surface-200 dark:border-surface-700 transition-colors duration-300">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-student-500 to-student-600 p-4 text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">NIYOM</h3>
                                    <p className="text-sm text-white/80">Your FoodLink Assistant</p>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="h-80 overflow-y-auto p-4 space-y-4 bg-surface-50 dark:bg-surface-900">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`
                    w-8 h-8 rounded-full flex-shrink-0
                    flex items-center justify-center
                    ${message.type === 'user'
                                            ? 'bg-student-500 text-white'
                                            : 'bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-300'
                                        }
                  `}>
                                        {message.type === 'user' ? (
                                            <User className="w-4 h-4" />
                                        ) : (
                                            <Bot className="w-4 h-4" />
                                        )}
                                    </div>

                                    <div className={`
                    max-w-[75%] p-3 rounded-2xl text-sm
                    ${message.type === 'user'
                                            ? 'bg-student-500 text-white rounded-br-md'
                                            : message.isError
                                                ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-bl-md'
                                                : 'bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-200 shadow-sm border border-surface-100 dark:border-surface-600 rounded-bl-md'
                                        }
                  `}>
                                        {message.text}
                                        {message.source === 'faq_cache' && (
                                            <span className="block mt-1 text-xs opacity-60">
                                                (Cached response)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center">
                                        <Bot className="w-4 h-4 text-surface-600 dark:text-surface-300" />
                                    </div>
                                    <div className="bg-white dark:bg-surface-700 p-3 rounded-2xl rounded-bl-md shadow-sm border border-surface-100 dark:border-surface-600">
                                        <Loader2 className="w-5 h-5 text-student-500 animate-spin" />
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Actions */}
                        <div className="px-4 py-2 border-t border-surface-100 dark:border-surface-700 bg-white dark:bg-surface-800">
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {quickActions.map((action) => (
                                    <button
                                        key={action}
                                        onClick={() => handleSend(action)}
                                        disabled={isLoading}
                                        className="flex-shrink-0 px-3 py-1.5 text-xs font-medium
                              bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 rounded-full
                              hover:bg-student-100 dark:hover:bg-student-900/30 hover:text-student-700 dark:hover:text-student-400
                              transition-colors disabled:opacity-50"
                                    >
                                        {action}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-surface-100 dark:border-surface-700 bg-white dark:bg-surface-800">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask something..."
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2.5 bg-surface-100 dark:bg-surface-700 rounded-xl
                            text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-500
                            focus:outline-none focus:ring-2 focus:ring-student-500 focus:bg-white dark:focus:bg-surface-600
                            disabled:opacity-50 transition-colors"
                                />
                                <button
                                    onClick={() => handleSend()}
                                    disabled={!input.trim() || isLoading}
                                    className="w-10 h-10 rounded-xl bg-student-500 text-white
                            flex items-center justify-center
                            hover:bg-student-600 transition-colors
                            disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
