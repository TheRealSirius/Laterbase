import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader2 } from 'lucide-react';

const AIAssistant = ({ isDarkMode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Welcome message on first open
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                {
                    id: 'welcome',
                    role: 'assistant',
                    content: 'Ciao, sono l\'assistente AI chiedimi ciò che ti serve'
                }
            ]);
        }
    }, [isOpen, messages.length]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const handleSend = async () => {
        const trimmedInput = inputValue.trim();
        if (!trimmedInput || isLoading) return;

        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: trimmedInput
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            // Chiamata diretta con Authorization header
            const response = await fetch(
                'https://mbsfzxwzgqtxgldlktzp.supabase.co/functions/v1/ai-assistant',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer sb_publishable_vH8l3jz7oi9N-OhZhuzaHQ_Vb7PPM97'
                    },
                    body: JSON.stringify({ prompt: trimmedInput })
                }
            );

            if (!response.ok) {
                throw new Error('Errore HTTP: ' + response.status);
            }

            const data = await response.json();

            const assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response || 'Mi dispiace, non ho ricevuto una risposta.'
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (err) {
            console.error('AI Assistant error:', err);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Ops! Si è verificato un errore. Riprova tra poco.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-5 right-5 z-[1000] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
                    } bg-gradient-to-br from-violet-500 via-purple-500 to-blue-500 hover:from-violet-400 hover:via-purple-400 hover:to-blue-400 text-white`}
                style={{
                    animation: isOpen ? 'none' : 'ai-float 3s ease-in-out infinite'
                }}
                aria-label="Apri assistente AI"
            >
                <Sparkles size={24} />
            </button>

            {/* Chat Window */}
            <div
                className={`fixed bottom-5 right-5 z-[1000] transition-all duration-300 ease-out ${isOpen
                    ? 'opacity-100 scale-100 translate-y-0'
                    : 'opacity-0 scale-90 translate-y-4 pointer-events-none'
                    }`}
            >
                <div
                    className={`w-[350px] h-[450px] max-w-[calc(100vw-40px)] max-h-[calc(100vh-100px)] rounded-2xl shadow-2xl flex flex-col overflow-hidden border backdrop-blur-sm ${isDarkMode
                        ? 'bg-zinc-900/95 border-zinc-700'
                        : 'bg-white/95 border-slate-200'
                        }`}
                >
                    {/* Header */}
                    <div className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-zinc-800 bg-zinc-900' : 'border-slate-100 bg-white'
                        }`}>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                                <Sparkles size={16} className="text-white" />
                            </div>
                            <span className="font-semibold text-sm">Assistente Wishlist</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className={`p-1.5 rounded-lg transition-colors ${isDarkMode
                                ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                                : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDarkMode ? 'bg-zinc-950' : 'bg-slate-50'
                        }`}>
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-gradient-to-br from-violet-500 to-blue-500 text-white rounded-br-md'
                                        : isDarkMode
                                            ? 'bg-zinc-800 text-zinc-100 rounded-bl-md'
                                            : 'bg-white text-slate-800 shadow-sm rounded-bl-md'
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className={`px-4 py-2.5 rounded-2xl rounded-bl-md ${isDarkMode ? 'bg-zinc-800' : 'bg-white shadow-sm'
                                    }`}>
                                    <div className="flex items-center gap-2">
                                        <Loader2 size={14} className="animate-spin text-violet-500" />
                                        <span className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                                            Sto scrivendo...
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className={`p-3 border-t ${isDarkMode ? 'border-zinc-800 bg-zinc-900' : 'border-slate-100 bg-white'
                        }`}>
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-100'
                            }`}>
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Scrivi un messaggio..."
                                disabled={isLoading}
                                className={`flex-1 bg-transparent text-sm outline-none placeholder:text-sm ${isDarkMode
                                    ? 'text-white placeholder:text-zinc-500'
                                    : 'text-slate-900 placeholder:text-slate-400'
                                    }`}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim() || isLoading}
                                className={`p-2 rounded-lg transition-all ${inputValue.trim() && !isLoading
                                    ? 'bg-gradient-to-br from-violet-500 to-blue-500 text-white hover:opacity-90'
                                    : isDarkMode
                                        ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AIAssistant;
