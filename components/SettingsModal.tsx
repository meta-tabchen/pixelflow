import React, { useState, useEffect } from 'react';
import { X, Save, Shield, Key, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { getUserApiKey, setUserApiKey } from '../services/storageService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [isDemoKey, setIsDemoKey] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getUserApiKey() || '');
      const sysKey = process.env.API_KEY || '';
      setIsDemoKey(sysKey.toLowerCase().startsWith('demo'));
    }
  }, [isOpen]);

  const handleSave = () => {
    setUserApiKey(apiKey.trim() || null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-[500px] bg-[#18181b] border border-zinc-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                 <Shield size={20} />
              </div>
              <h2 className="text-xl font-bold text-white">Settings</h2>
           </div>
           <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-xl">
              <X size={20} />
           </button>
        </div>

        {/* Body */}
        <div className="p-8 flex flex-col gap-6">
           <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <label className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                    <Key size={16} className="text-blue-400" />
                    Gemini API Key
                 </label>
                 <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full uppercase tracking-tighter">Required for AI</span>
              </div>

              <div className="relative group">
                 <input 
                   type={showKey ? "text" : "password"}
                   value={apiKey}
                   onChange={(e) => setApiKey(e.target.value)}
                   placeholder="Enter your API Key..."
                   className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-3 text-sm text-white focus:ring-2 focus:ring-blue-600 focus:outline-none focus:border-transparent transition-all pr-12"
                 />
                 <button 
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                 >
                    {showKey ? <X size={16}/> : <Info size={16}/>}
                 </button>
              </div>

              <p className="text-[11px] text-zinc-500 leading-relaxed px-1">
                 Your API key is stored locally in your browser and is only used to communicate directly with Google's Gemini servers. It is never sent to our servers.
              </p>

              {/* Status Indicator */}
              <div className={`rounded-2xl border p-4 flex gap-4 transition-colors ${
                apiKey.trim() 
                  ? 'bg-green-500/5 border-green-500/20 text-green-400' 
                  : isDemoKey 
                    ? 'bg-red-500/5 border-red-500/20 text-red-400' 
                    : 'bg-blue-500/5 border-blue-500/20 text-blue-400'
              }`}>
                 <div className="mt-0.5">
                    {apiKey.trim() ? <CheckCircle size={18}/> : isDemoKey ? <AlertTriangle size={18}/> : <Info size={18}/>}
                 </div>
                 <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold uppercase tracking-wider">
                       {apiKey.trim() ? 'User Key Active' : isDemoKey ? 'Demo Key Warning' : 'Default Key Active'}
                    </span>
                    <span className="text-[10px] opacity-70">
                       {apiKey.trim() 
                         ? 'Personal key is being used. Unlimited generation enabled.' 
                         : isDemoKey 
                           ? 'The system key is for demo only and cannot generate images. Please provide your own key.' 
                           : 'Using the workspace default key. Some limits may apply.'}
                    </span>
                 </div>
              </div>
           </div>

           <div className="h-px bg-zinc-800 mx-4" />

           <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-zinc-500 px-1">Quick Links</span>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl transition-colors group">
                 <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">Get your API Key</span>
                 <Info size={14} className="text-zinc-600 group-hover:text-blue-400 transition-colors" />
              </a>
           </div>
        </div>

        {/* Footer */}
        <div className="p-8 pt-0 flex justify-end gap-3">
           <button 
             onClick={onClose}
             className="px-6 py-2.5 rounded-full text-zinc-400 hover:text-white transition-colors text-sm font-medium"
           >
             Discard
           </button>
           <button 
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-full font-bold shadow-xl shadow-blue-900/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
           >
              <Save size={18} />
              Save Settings
           </button>
        </div>

      </div>
    </div>
  );
};