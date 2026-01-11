
import React, { useEffect, useState } from 'react';
import { Plus, LayoutGrid, Trash2, ArrowRight, Pencil, Check, X, Cpu, ChevronRight, Wand2, Layers, Image as ImageIcon, Sparkles, Settings2, Zap, Terminal } from 'lucide-react';
import { getProjects, createProject, deleteProject, updateProjectName } from '../services/storageService';
import { ProjectMeta } from '../types';

interface DashboardProps {
  onOpenProject: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenProject }) => {
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Renaming state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const data = await getProjects();
    setProjects(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    const name = `Project ${projects.length + 1}`;
    const newId = await createProject(name);
    onOpenProject(newId);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      await deleteProject(id);
      loadProjects();
    }
  };
  
  const startEditing = (e: React.MouseEvent, project: ProjectMeta) => {
      e.stopPropagation();
      setEditingId(project.id);
      setEditName(project.name);
  };
  
  const saveName = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if(editingId && editName.trim()) {
          await updateProjectName(editingId, editName);
          setEditingId(null);
          loadProjects();
      }
  };
  
  const cancelEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingId(null);
  };

  return (
    <div className="flex flex-col w-full h-full p-6 lg:px-12 max-w-[1600px] mx-auto overflow-y-auto custom-scrollbar relative">
      <style>{`
        @keyframes scan-line {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan { animation: scan-line 3s linear infinite; }
      `}</style>

      {/* Hero Section - Centered Typography & Effects */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center min-h-[450px] mb-12 mt-8 max-w-5xl mx-auto">
        
        {/* Background Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full -z-10 pointer-events-none animate-pulse duration-[5000ms]"></div>
        
        {/* Version Tag */}
        <div className="flex items-center gap-4 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
             <div className="px-3 py-1.5 rounded-full bg-zinc-900/50 border border-white/10 text-zinc-400 font-mono text-[10px] tracking-[0.2em] uppercase font-bold shadow-xl backdrop-blur-md flex items-center gap-2 hover:bg-zinc-800 transition-colors cursor-default">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                System Ready v2.0
            </div>
        </div>
        
        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tighter mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 leading-[0.9]">
          Architect Your <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 filter drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">Visual Intelligence</span>
        </h1>
        
        {/* Subtitle */}
        <p className="text-zinc-400 max-w-2xl text-lg md:text-xl leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200 font-light tracking-wide">
          Construct complex logic chains, orchestrate AI models, and render the impossible with our professional node-based environment.
        </p>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          <button 
            onClick={handleCreate}
            className="h-14 px-8 bg-white text-black hover:bg-zinc-200 rounded-full font-bold text-sm uppercase tracking-widest shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] transition-all hover:scale-105 active:scale-95 flex items-center gap-3 group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            Initialize Canvas
          </button>
          <button className="h-14 px-8 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-full font-bold text-sm uppercase tracking-widest border border-zinc-700 hover:border-zinc-500 transition-all flex items-center gap-3 group backdrop-blur-sm">
            <Terminal size={18} />
            <span>Documentation</span>
          </button>
        </div>
      </div>

      {/* Projects Grid Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5 relative z-10 max-w-7xl mx-auto w-full">
         <div className="flex items-center gap-3">
            <LayoutGrid size={18} className="text-zinc-400" />
            <h2 className="text-xs font-bold text-white tracking-[0.2em] uppercase">Active Workspaces</h2>
         </div>
         <div className="flex items-center gap-4">
             <div className="text-zinc-600 font-mono text-[10px] uppercase tracking-wider">{projects.length} Projects</div>
         </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto w-full">
           {[1,2,3,4].map(i => <div key={i} className="h-56 bg-zinc-900/30 rounded-3xl animate-pulse border border-white/5" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-zinc-800 rounded-[32px] bg-zinc-900/20 text-zinc-500 animate-in fade-in duration-500 max-w-7xl mx-auto w-full">
           <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mb-6 border border-white/5 shadow-inner">
              <Layers size={24} className="opacity-30 text-white" />
           </div>
           <p className="text-sm font-medium mb-6 text-zinc-400 uppercase tracking-wide">Workspace Empty</p>
           <button onClick={handleCreate} className="text-blue-500 hover:text-blue-400 font-bold flex items-center gap-2 hover:translate-x-1 transition-all text-xs uppercase tracking-wider bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">
             Initialize First Process <ArrowRight size={14} />
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24 max-w-7xl mx-auto w-full">
          {projects.map((project) => (
            <div 
              key={project.id}
              onClick={() => onOpenProject(project.id)}
              className="group relative bg-zinc-900/40 border border-white/5 hover:border-blue-500/50 rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] hover:shadow-blue-900/10 backdrop-blur-sm overflow-hidden min-h-[180px] flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex gap-2">
                 {editingId !== project.id && (
                    <div className="flex gap-1 bg-black/60 backdrop-blur-md rounded-lg p-1 border border-white/10 shadow-lg">
                       <button 
                         onClick={(e) => startEditing(e, project)}
                         className="text-zinc-400 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-md"
                         title="Rename Project"
                       >
                         <Pencil size={12} />
                       </button>
                       <button 
                         onClick={(e) => handleDelete(e, project.id)}
                         className="text-zinc-500 hover:text-red-500 transition-colors p-1.5 hover:bg-white/10 rounded-md"
                         title="Delete Project"
                       >
                         <Trash2 size={12} />
                       </button>
                    </div>
                 )}
              </div>

              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center border border-white/5 shadow-inner mb-4 group-hover:scale-105 transition-transform duration-500 group-hover:shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]">
                  <Wand2 size={16} className="text-zinc-500 group-hover:text-blue-400 transition-colors" />
                </div>
                
                <div className="space-y-1.5">
                  {editingId === project.id ? (
                      <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                          <input 
                              type="text" 
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              className="w-full bg-zinc-950 border border-blue-500/50 text-white font-bold text-sm rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500/20 shadow-inner"
                              autoFocus
                              placeholder="Project Name"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveName(e as any);
                                if (e.key === 'Escape') cancelEdit(e as any);
                              }}
                          />
                          <button onClick={saveName} className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-500 shadow-lg shrink-0"><Check size={10}/></button>
                          <button onClick={cancelEdit} className="p-1.5 bg-zinc-800 text-zinc-400 rounded hover:text-white hover:bg-zinc-700 shrink-0"><X size={10}/></button>
                      </div>
                  ) : (
                      <h3 className="text-lg font-bold text-zinc-200 group-hover:text-white transition-colors truncate pr-8 leading-tight">{project.name}</h3>
                  )}
                  {editingId !== project.id && (
                     <div className="flex items-center gap-2 text-zinc-600 text-[10px] font-mono uppercase tracking-wider">
                        <span>{new Date(project.lastModified).toLocaleDateString()}</span>
                     </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between relative z-10 pt-4 border-t border-white/5 mt-2">
                 <div className="flex items-center gap-2">
                     <div className={`w-1.5 h-1.5 rounded-full ${project.nodeCount > 0 ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-zinc-600'}`}></div>
                     <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide group-hover:text-zinc-400 transition-colors">{project.nodeCount} Nodes</span>
                 </div>
                 <ArrowRight size={14} className="text-zinc-600 group-hover:text-white group-hover:-rotate-45 transition-all duration-300" />
              </div>

              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
