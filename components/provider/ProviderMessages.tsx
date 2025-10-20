// components/provider/ProviderMessages.tsx
import React, { useState, useRef, useEffect } from 'react';
// Fix: Add file extensions to imports to resolve module errors.
import { ChatMessage, User } from '../../types.ts';
import { Send } from '../Icons.tsx';

interface ProviderMessagesProps {
    chatHistory: ChatMessage[];
    currentUser: User;
    onSendMessage: (text: string) => void;
    patientName: string;
}

const ProviderMessages: React.FC<ProviderMessagesProps> = ({ chatHistory, currentUser, onSendMessage, patientName }) => {
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
        <div className="bg-white rounded-lg shadow h-full flex flex-col">
            <h2 className="text-xl font-bold p-6 border-b">Chat with {patientName}</h2>
            <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                {chatHistory.map(msg => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === currentUser.id ? 'justify-end' : ''}`}>
                         {msg.senderId !== currentUser.id && <div className="w-8 h-8 rounded-full bg-teal-500 flex-shrink-0" title={patientName}></div>}
                        <div className={`max-w-xs p-3 rounded-2xl ${msg.senderId === currentUser.id ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                            <p>{msg.text}</p>
                             <p className={`text-xs mt-1 ${msg.senderId === currentUser.id ? 'text-indigo-100' : 'text-gray-500'} text-right`}>{msg.timestamp}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t bg-gray-50 flex items-center gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Type a message...`}
                    className="flex-grow p-3 border border-gray-300 rounded-full focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button type="submit" className="bg-indigo-500 p-3 rounded-full text-white hover:bg-indigo-600">
                    <Send className="w-6 h-6" />
                </button>
            </form>
        </div>
    );
};

export default ProviderMessages;
