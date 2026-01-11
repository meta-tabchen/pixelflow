
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

      {/* Hero Section - Compacted */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12 mt-4 relative z-10 items-center min-h-[400px]">
        
        {/* Left Column: Text Content */}
        <div className="flex flex-col justify-center text-left">
            <div className="flex items-center gap-3 mb-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="h-px w-8 bg-blue-500"></div>
                <div className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-[10px] tracking-widest uppercase font-bold">
                    System Ready v2.0
                </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 leading-[1.1]">
              Architect Your <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Visual Intelligence</span>
            </h1>
            
            <p className="text-zinc-400 max-w-lg text-base leading-relaxed mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700 font-light border-l-2 border-zinc-800 pl-4">
              Construct complex logic chains, orchestrate AI models, and render the impossible with our professional node-based environment.
            </p>
            
            <div className="flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <button 
                onClick={handleCreate}
                className="h-12 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm uppercase tracking-wide shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 group border border-blue-400/20"
              >
                <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                Initialize Canvas
              </button>
              <button className="h-12 px-6 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl font-bold text-sm uppercase tracking-wide border border-zinc-700 transition-all flex items-center gap-2 group">
                <Terminal size={16} />
                <span>Docs</span>
              </button>
            </div>
        </div>

        {/* Right Column: Visual Workflow Preview (Replaces Empty Space) */}
        <div className="hidden lg:flex relative h-[380px] w-full animate-in fade-in zoom-in duration-700 delay-200">
            {/* Main Glass Card */}
            <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                {/* Background Grid */}
                <div className="absolute inset-0 bg-tech-grid opacity-20"></div>
                
                {/* Header UI */}
                <div className="absolute top-0 left-0 right-0 h-10 border-b border-white/5 bg-white/5 flex items-center px-4 gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                    </div>
                    <div className="flex-1 text-center text-[10px] font-mono text-zinc-500">workflow_preview.flow</div>
                </div>

                {/* Mock Nodes Container */}
                <div className="absolute inset-0 top-10 p-6 flex items-center justify-center gap-4">
                    
                    {/* Node 1: Input */}
                    <div className="w-40 bg-black/80 border border-zinc-700 rounded-xl p-3 shadow-xl flex flex-col gap-2 relative z-10">
                         <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                             <div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center text-purple-400"><Sparkles size={12}/></div>
                             <span className="text-[10px] font-bold text-zinc-300">PROMPT</span>
                         </div>
                         <div className="space-y-1.5">
                            <div className="h-1.5 w-full bg-zinc-800 rounded-full"></div>
                            <div className="h-1.5 w-2/3 bg-zinc-800 rounded-full"></div>
                         </div>
                         {/* Connection Line */}
                         <div className="absolute top-1/2 -right-6 w-6 h-[2px] bg-zinc-700"></div>
                    </div>

                    {/* Node 2: Generator */}
                    <div className="w-48 bg-black/80 border border-blue-500/30 rounded-xl p-0 shadow-2xl shadow-blue-900/20 relative z-20 overflow-hidden">
                         <div className="bg-blue-900/20 p-2 flex items-center justify-between border-b border-blue-500/20">
                             <div className="flex items-center gap-2">
                                <Cpu size={12} className="text-blue-400" />
                                <span className="text-[10px] font-bold text-blue-100">GEMINI PRO</span>
                             </div>
                             <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                         </div>
                         <div className="p-3 relative">
                             <div className="w-full h-24 bg-zinc-900 rounded border border-zinc-800 overflow-hidden relative">
                                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
                                  {/* Scanline */}
                                  <div className="absolute left-0 right-0 h-[1px] bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,1)] animate-scan"></div>
                                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-blue-400/50">PROCESSING</div>
                             </div>
                         </div>
                         {/* Connection Line */}
                         <div className="absolute top-1/2 -right-6 w-6 h-[2px] bg-blue-500/50"></div>
                    </div>

                    {/* Node 3: Result */}
                    <div className="w-40 bg-black/80 border border-zinc-700 rounded-xl p-2 shadow-xl relative z-10 group">
                        <div className="w-full aspect-square bg-zinc-900 rounded-lg overflow-hidden relative border border-zinc-800">
                             <img 
                                src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=300&auto=format&fit=crop" 
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                alt="Result"
                             />
                        </div>
                    </div>

                </div>

                {/* Floating Tags */}
                <div className="absolute bottom-4 left-4 flex gap-2">
                    <div className="px-2 py-1 rounded bg-black/40 border border-white/5 text-[9px] text-zinc-500 font-mono">16:9</div>
                    <div className="px-2 py-1 rounded bg-black/40 border border-white/5 text-[9px] text-zinc-500 font-mono">4K</div>
                </div>
            </div>
            
            {/* Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-600/20 blur-[100px] rounded-full -z-10"></div>
        </div>
      </div>

      {/* Projects Grid Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5 relative z-10">
         <div className="flex items-center gap-3">
            <LayoutGrid size={18} className="text-zinc-400" />
            <h2 className="text-xs font-bold text-white tracking-widest uppercase">Active Workspaces</h2>
         </div>
         <div className="flex items-center gap-4">
             <div className="text-zinc-600 font-mono text-[10px] uppercase tracking-wider">{projects.length} Projects</div>
         </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
           {[1,2,3,4].map(i => <div key={i} className="h-48 bg-zinc-900/30 rounded-2xl animate-pulse border border-white/5" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20 text-zinc-500 animate-in fade-in duration-500">
           <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center mb-4 border border-white/5 shadow-inner">
              <Layers size={20} className="opacity-30 text-white" />
           </div>
           <p className="text-xs font-medium mb-4 text-zinc-400 uppercase tracking-wide">Workspace Empty</p>
           <button onClick={handleCreate} className="text-blue-500 hover:text-blue-400 font-bold flex items-center gap-2 hover:translate-x-1 transition-all text-xs uppercase tracking-wider">
             Initialize First Process <ArrowRight size={14} />
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-24">
          {projects.map((project) => (
            <div 
              key={project.id}
              onClick={() => onOpenProject(project.id)}
              className="group relative bg-zinc-900/40 border border-white/5 hover:border-blue-500/50 rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/10 backdrop-blur-sm overflow-hidden min-h-[160px] flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex gap-2">
                 {editingId !== project.id && (
                    <div className="flex gap-1 bg-black/50 backdrop-blur rounded-lg p-1 border border-white/5 shadow-lg">
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
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center border border-white/5 shadow-inner mb-3 group-hover:scale-105 transition-transform duration-500">
                  <Wand2 size={14} className="text-zinc-500 group-hover:text-blue-400 transition-colors" />
                </div>
                
                <div className="space-y-1">
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
                      <h3 className="text-base font-bold text-zinc-200 group-hover:text-white transition-colors truncate pr-8 leading-tight">{project.name}</h3>
                  )}
                  {editingId !== project.id && (
                     <div className="flex items-center gap-2 text-zinc-600 text-[9px] font-mono uppercase tracking-wider">
                        <span>{new Date(project.lastModified).toLocaleDateString()}</span>
                     </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between relative z-10 pt-3 border-t border-white/5 mt-2">
                 <div className="flex items-center gap-2">
                     <div className={`w-1.5 h-1.5 rounded-full ${project.nodeCount > 0 ? 'bg-blue-500' : 'bg-zinc-600'}`}></div>
                     <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">{project.nodeCount} Nodes</span>
                 </div>
                 <ArrowRight size={12} className="text-zinc-600 group-hover:text-white group-hover:-rotate-45 transition-all duration-300" />
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
