import React, { useState } from 'react';
import { NodeEditor } from './components/Canvas/NodeEditor';
import { Dashboard } from './components/Dashboard';
import { Gallery } from './components/Gallery';
import { SettingsModal } from './components/SettingsModal';
import { Layers, Image, Layout, Home, Settings as SettingsIcon } from 'lucide-react';

type View = 'home' | 'editor' | 'gallery';

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const navigateToEditor = (projectId: string) => {
    setCurrentProjectId(projectId);
    setView('editor');
  };

  const navigateHome = () => {
    setView('home');
    setCurrentProjectId(null);
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden font-sans">
      
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Global Navigation Bar */}
      <nav className="h-16 border-b border-white/5 bg-[#18181b] flex items-center justify-between px-6 shrink-0 z-50">
         <div className="flex items-center gap-2 cursor-pointer" onClick={navigateHome}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
               <Layers className="text-white" size={18} />
            </div>
            <span className="font-bold text-lg tracking-tight">pixelflow</span>
         </div>

         <div className="flex items-center bg-zinc-900 p-1 rounded-full border border-zinc-800">
             <button 
                onClick={navigateHome}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${view === 'home' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
             >
                <Home size={14} />
                Home
             </button>
             <button 
                onClick={() => setView('gallery')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${view === 'gallery' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
             >
                <Image size={14} />
                Gallery
             </button>
             <button 
                onClick={() => { if(currentProjectId) setView('editor'); else alert("Please select or create a project from Home first."); }}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${view === 'editor' ? 'bg-blue-600 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
             >
                <Layout size={14} />
                Workspace
             </button>
         </div>

         <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsSettingsOpen(true)}
               className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
               title="Settings"
             >
               <SettingsIcon size={20} />
             </button>
             <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 ring-2 ring-black cursor-pointer" />
         </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden w-full h-full bg-black">
        {view === 'home' && (
           <Dashboard onOpenProject={navigateToEditor} />
        )}

        {view === 'gallery' && (
           <Gallery />
        )}

        {view === 'editor' && currentProjectId && (
           <NodeEditor 
            projectId={currentProjectId} 
            onBack={navigateHome} 
            onOpenSettings={() => setIsSettingsOpen(true)}
           />
        )}
      </main>
    </div>
  );
};

export default App;