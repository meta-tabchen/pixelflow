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
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden font-sans selection:bg-blue-500/30">
      
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Global Navigation Bar */}
      <nav className="h-16 border-b border-white/5 glass flex items-center justify-between px-8 shrink-0 z-50">
         <div className="flex items-center gap-3 cursor-pointer group" onClick={navigateHome}>
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20 group-hover:scale-110 transition-transform">
               <Layers className="text-white" size={20} />
            </div>
            <span className="font-extrabold text-xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                PixelFlow
            </span>
         </div>

         <div className="flex items-center bg-zinc-900/50 p-1 rounded-full border border-white/5 backdrop-blur-md">
             <button 
                onClick={navigateHome}
                className={`flex items-center gap-2 px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ${view === 'home' ? 'bg-white text-black shadow-xl scale-105' : 'text-zinc-500 hover:text-white'}`}
             >
                <Home size={14} />
                Home
             </button>
             <button 
                onClick={() => setView('gallery')}
                className={`flex items-center gap-2 px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ${view === 'gallery' ? 'bg-white text-black shadow-xl scale-105' : 'text-zinc-500 hover:text-white'}`}
             >
                <Image size={14} />
                Gallery
             </button>
             <button 
                onClick={() => { if(currentProjectId) setView('editor'); else alert("Please select or create a project from Home first."); }}
                className={`flex items-center gap-2 px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ${view === 'editor' ? 'bg-blue-600 text-white shadow-xl scale-105 shadow-blue-900/30' : 'text-zinc-500 hover:text-white'}`}
             >
                <Layout size={14} />
                Workspace
             </button>
         </div>

         <div className="flex items-center gap-4">
             <button 
               onClick={() => setIsSettingsOpen(true)}
               className="p-2.5 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-all hover:rotate-45"
               title="Settings"
             >
               <SettingsIcon size={20} />
             </button>
             <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 p-[2px] shadow-lg shadow-blue-900/20 cursor-pointer hover:scale-105 transition-transform">
                 <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center overflow-hidden">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=PixelFlow" alt="User" className="w-full h-full object-cover" />
                 </div>
             </div>
         </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden w-full h-full bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1),rgba(0,0,0,1))] opacity-50 pointer-events-none"></div>
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