// components/LoginScreen.tsx
import React, { useState } from 'react';
// Fix: Add file extensions to imports to resolve module errors.
import { Zap } from './Icons.tsx';

interface LoginScreenProps {
  onLogin: (email: string, pass: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(email, password);
    };

    const quickLogin = (e: string, p: string) => {
        setEmail(e);
        setPassword(p);
    }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 to-teal-500 p-4">
      <div className="text-center mb-10">
        <Zap className="w-16 h-16 text-yellow-300 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-white mb-2">NeuroBridge</h1>
        <p className="text-indigo-100">Your AI-powered partner in mental wellness.</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <h2 className="text-xl font-bold text-center text-gray-800">Sign In</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="text-sm font-semibold text-gray-600">Email</label>
                <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full mt-1 p-3 border border-gray-300 rounded-lg"
                    placeholder="user@example.com"
                />
            </div>
             <div>
                <label className="text-sm font-semibold text-gray-600">Password</label>
                <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full mt-1 p-3 border border-gray-300 rounded-lg"
                    placeholder="********"
                />
            </div>
            <button type="submit" className="w-full bg-indigo-500 text-white font-bold py-3 rounded-lg hover:bg-indigo-600">
                Login
            </button>
        </form>
        <div className="text-center text-xs text-gray-500">
            <p className="font-bold">Demo Accounts:</p>
            <button onClick={() => quickLogin('patient@neuro.io', 'password')} className="hover:underline">patient@neuro.io</button> | 
            <button onClick={() => quickLogin('provider@neuro.io', 'password')} className="hover:underline">provider@neuro.io</button> |
            <button onClick={() => quickLogin('mentor@neuro.io', 'password')} className="hover:underline">mentor@neuro.io</button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
