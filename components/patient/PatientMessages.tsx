// components/patient/PatientMessages.tsx
import React, { useState, useRef, useEffect } from 'react';
// Fix: Add file extensions to imports to resolve module errors.
import { ChatMessage, User } from '../../types.ts';
import { Send } from '../Icons.tsx';

interface PatientMessagesProps {
    chatHistory: ChatMessage[];
    currentUser: User;
    onSendMessage: (text: string) => void;
}

const PatientMessages: React.FC<PatientMessagesProps> = ({ chatHistory, currentUser, onSendMessage }) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [chatHistory]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;
        onSendMessage(newMessage);
        setNewMessage('');
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-slate-900">
            <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                {chatHistory.map(msg => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === currentUser.id ? 'justify-end' : ''}`}>
                         {msg.senderId !== currentUser.id && <div className="w-8 h-8 rounded-full bg-purple-500 flex-shrink-0" title="Provider"></div>}
                        <div className={`max-w-xs p-3 rounded-2xl ${msg.senderId === currentUser.id ? 'bg-teal-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 dark:bg-slate-700 dark:text-gray-200 rounded-bl-none'}`}>
                            <p>{msg.text}</p>
                             <p className={`text-xs mt-1 ${msg.senderId === currentUser.id ? 'text-teal-100' : 'text-gray-500 dark:text-gray-400'} text-right`}>{msg.timestamp}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-grow p-3 border border-gray-300 dark:border-slate-600 rounded-full focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-slate-700 dark:text-white dark:placeholder-gray-400"
                />
                <button type="submit" className="bg-teal-500 p-3 rounded-full text-white hover:bg-teal-600">
                    <Send className="w-6 h-6" />
                </button>
            </form>
        </div>
    );
};

export default PatientMessages;