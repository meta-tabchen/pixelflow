
import React, { useState } from 'react';
import { NodeEditor } from './components/Canvas/NodeEditor';
import { Dashboard } from './components/Dashboard';
import { Gallery } from './components/Gallery';
import { Documentation } from './components/Documentation';
import { ProjectList } from './components/ProjectList';
import { WorkflowManager } from './components/WorkflowManager';
import { SettingsModal } from './components/SettingsModal';
import { Layers, Image, Layout, Home, Settings as SettingsIcon, BookOpen, Zap, FolderOpen, Workflow } from 'lucide-react';

type View = 'home' | 'editor' | 'gallery' | 'docs' | 'projects' | 'workflows';

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const navigateToEditor = (projectId: string) => {
    setCurrentProjectId(projectId);
    setView('editor');
  };

  const navigateHome = () => {
    setView('home');
    setCurrentProjectId(null);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden font-sans selection:bg-cyan-500/30 relative">
      
      {/* Background Ambience - Lighter, Multi-color Aurora Effect */}
      <div className="absolute inset-0 z-0 bg-slate-950 overflow-hidden pointer-events-none">
          {/* Top Left - Indigo/Purple */}
          <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-500/10 blur-[130px] rounded-full mix-blend-screen animate-pulse-glow"></div>
          
          {/* Bottom Right - Cyan/Blue */}
          <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-cyan-600/10 blur-[130px] rounded-full mix-blend-screen animate-pulse-glow" style={{animationDelay: '2s'}}></div>
          
          {/* Center Accent - Subtle Violet */}
          <div className="absolute top-[30%] left-[30%] w-[40vw] h-[40vw] bg-violet-500/5 blur-[150px] rounded-full mix-blend-screen animate-pulse-glow" style={{animationDelay: '4s'}}></div>

          {/* Grain Texture for Film Look */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
          
          {/* Soft Grid */}
          <div className="absolute inset-0 bg-tech-grid opacity-30"></div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Global Navigation Bar */}
      {view !== 'editor' && (
        <nav className="fixed top-6 left-6 right-6 h-18 glass-panel rounded-2xl flex items-center justify-between px-8 shrink-0 z-50 transition-all duration-500 hover:bg-white/5">
           <div className="flex items-center gap-4 cursor-pointer group" onClick={navigateHome}>
              {!logoError ? (
                  <img 
                    src="/Gemini_240.png" 
                    alt="PixelFlow"
                    onError={() => setLogoError(true)}
                    className="w-10 h-10 rounded-xl object-contain bg-white/5 border border-white/10 shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform duration-300"
                  />
              ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 border border-white/10 group-hover:scale-110 transition-transform duration-300">
                      <span className="font-bold text-white text-xl leading-none font-sans pt-0.5">P</span>
                  </div>
              )}
              <div className="flex flex-col">
                  <span className="font-bold text-xl tracking-tight text-white group-hover:text-cyan-200 transition-colors">
                      Pixel<span className="text-cyan-400">Flow</span>
                  </span>
              </div>
           </div>

           <div className="flex items-center bg-black/20 p-1.5 rounded-xl border border-white/5 backdrop-blur-md shadow-inner">
               <button 
                  onClick={navigateHome}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-300 border ${view === 'home' ? 'bg-white/10 text-white shadow-lg border-white/10' : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'}`}
               >
                  <Home size={14} />
                  Home
               </button>
               <button 
                  onClick={() => setView('projects')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-300 border ${view === 'projects' ? 'bg-white/10 text-white shadow-lg border-white/10' : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'}`}
               >
                  <FolderOpen size={14} />
                  Projects
               </button>
               <button 
                  onClick={() => setView('workflows')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-300 border ${view === 'workflows' ? 'bg-white/10 text-white shadow-lg border-white/10' : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'}`}
               >
                  <Workflow size={14} />
                  Workflows
               </button>
               <button 
                  onClick={() => setView('gallery')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-300 border ${view === 'gallery' ? 'bg-white/10 text-white shadow-lg border-white/10' : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'}`}
               >
                  <Image size={14} />
                  Gallery
               </button>
               <button 
                  onClick={() => setView('docs')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-300 border ${view === 'docs' ? 'bg-white/10 text-white shadow-lg border-white/10' : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'}`}
               >
                  <BookOpen size={14} />
                  Docs
               </button>
           </div>

           <div className="flex items-center gap-4">
               <button 
                 onClick={() => setIsSettingsOpen(true)}
                 className="w-10 h-10 flex items-center justify-center rounded-xl border border-transparent hover:bg-white/10 hover:border-white/5 text-zinc-400 hover:text-white transition-all group"
                 title="Settings"
               >
                 <SettingsIcon size={20} className="group-hover:rotate-45 transition-transform duration-500" />
               </button>
           </div>
        </nav>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 relative overflow-hidden w-full h-full z-10 ${view !== 'editor' ? 'pt-24' : ''}`}>
        {view === 'home' && (
           <Dashboard onOpenProject={navigateToEditor} onOpenDocs={() => setView('docs')} />
        )}
        
        {view === 'projects' && (
           <ProjectList onOpenProject={navigateToEditor} />
        )}

        {view === 'workflows' && (
           <WorkflowManager onOpenProject={navigateToEditor} />
        )}

        {view === 'gallery' && (
           <Gallery />
        )}
        
        {view === 'docs' && (
           <Documentation />
        )}

        {view === 'editor' && currentProjectId && (
           <NodeEditor 
            projectId={currentProjectId} 
            onBack={navigateHome} 
            onOpenSettings={() => setIsSettingsOpen(true)}
           />
        )}
      </main>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        .animate-pulse-glow { animation: pulse-glow 8s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default App;
