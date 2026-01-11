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
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden font-sans selection:bg-blue-500/30 relative">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 bg-black">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[150px] rounded-full"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/10 blur-[150px] rounded-full"></div>
          <div className="absolute inset-0 bg-tech-grid opacity-30"></div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Global Navigation Bar - Only visible in Home/Gallery views */}
      {view !== 'editor' && (
        <nav className="fixed top-4 left-4 right-4 h-16 glass-panel rounded-2xl flex items-center justify-between px-6 shrink-0 z-50 shadow-2xl shadow-black/50">
           <div className="flex items-center gap-3 cursor-pointer group" onClick={navigateHome}>
              <img 
                 src="/Gemini_240.png" 
                 alt="PixelFlow Logo" 
                 className="w-8 h-8 object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300" 
              />
              <div className="flex flex-col leading-none">
                  <span className="font-bold text-lg tracking-tight text-white">
                      Pixel<span className="text-blue-500">Flow</span>
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Visual Engine v2.0</span>
              </div>
           </div>

           <div className="flex items-center bg-zinc-900/80 p-1 rounded-xl border border-white/5 backdrop-blur-md shadow-inner">
               <button 
                  onClick={navigateHome}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-300 ${view === 'home' ? 'bg-zinc-800 text-white shadow-lg border border-white/5' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}
               >
                  <Home size={14} />
                  Home
               </button>
               <button 
                  onClick={() => setView('gallery')}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-300 ${view === 'gallery' ? 'bg-zinc-800 text-white shadow-lg border border-white/5' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}
               >
                  <Image size={14} />
                  Gallery
               </button>
               <button 
                  onClick={() => { if(currentProjectId) setView('editor'); else alert("Please select or create a project from Home first."); }}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-300 text-zinc-500 hover:text-white hover:bg-zinc-800/50"
               >
                  <Layout size={14} />
                  Workspace
               </button>
           </div>

           <div className="flex items-center gap-4">
               <button 
                 onClick={() => setIsSettingsOpen(true)}
                 className="w-9 h-9 flex items-center justify-center rounded-lg border border-transparent hover:bg-zinc-800 hover:border-white/5 text-zinc-400 hover:text-white transition-all group"
                 title="Settings"
               >
                 <SettingsIcon size={18} className="group-hover:rotate-45 transition-transform duration-500" />
               </button>
               <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-zinc-800 to-zinc-700 p-[1px] shadow-lg cursor-pointer hover:ring-2 hover:ring-blue-500/20 transition-all">
                   <div className="w-full h-full rounded-[7px] bg-zinc-950 flex items-center justify-center overflow-hidden">
                      <img src="https://api.dicebear.com/7.x/shapes/svg?seed=PixelFlow&backgroundColor=18181b" alt="User" className="w-full h-full object-cover opacity-80" />
                   </div>
               </div>
           </div>
        </nav>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 relative overflow-hidden w-full h-full z-10 ${view !== 'editor' ? 'pt-24' : ''}`}>
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