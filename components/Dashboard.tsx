import React, { useEffect, useState } from 'react';
import { Plus, Clock, LayoutGrid, Trash2, ArrowRight, Pencil, Check, X, Sparkles } from 'lucide-react';
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
    <div className="flex flex-col w-full h-full p-8 md:p-12 lg:p-20 max-w-[1600px] mx-auto overflow-y-auto custom-scrollbar relative">
      
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Hero */}
      <div className="mb-24 mt-8 relative z-10 text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase mb-6 animate-in fade-in slide-in-from-bottom-2">
            <Sparkles size={12} />
            AI Visual Engine
        </div>
        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          Pixel<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-400">Flow</span>
        </h1>
        <p className="text-zinc-400 max-w-2xl text-xl leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
          The next generation of AI content creation. Build complex visual logic, generate high-fidelity assets, and iterate with speed using our node-based workspace.
        </p>
        
        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
           <button 
             onClick={handleCreate}
             className="px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black shadow-2xl shadow-blue-900/40 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-4 group"
           >
             <Plus size={24} className="group-hover:rotate-90 transition-transform" />
             Create New Canvas
           </button>
           <button className="px-10 py-5 bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-300 rounded-2xl font-bold transition-all flex items-center gap-3">
             Documentation
           </button>
        </div>
      </div>

      {/* Projects Grid Header */}
      <div className="flex items-center justify-between mb-8 px-2 relative z-10">
         <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Recent Workspaces</h2>
         </div>
         <div className="text-zinc-500 text-sm font-medium">{projects.length} Total Projects</div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
           {[1,2,3,4].map(i => <div key={i} className="h-64 bg-zinc-900/30 rounded-[32px] animate-pulse border border-white/5" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 border border-dashed border-zinc-800 rounded-[40px] bg-zinc-900/10 text-zinc-500 animate-in fade-in duration-500">
           <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mb-6">
              <LayoutGrid size={32} className="opacity-20" />
           </div>
           <p className="text-xl font-medium mb-4 text-zinc-400">No workspaces yet</p>
           <button onClick={handleCreate} className="text-blue-500 hover:text-blue-400 font-bold flex items-center gap-2 hover:translate-x-1 transition-all">
             Start your first masterpiece <ArrowRight size={18} />
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-32">
          {projects.map((project) => (
            <div 
              key={project.id}
              onClick={() => onOpenProject(project.id)}
              className="group relative bg-[#121214] border border-white/5 hover:border-blue-500/40 rounded-[32px] p-8 cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]"
            >
              <div className="flex justify-between items-start mb-12">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
                  <LayoutGrid size={24} />
                </div>
                <div className="flex gap-1">
                    {editingId === project.id ? (
                        <>
                           <button onClick={saveName} className="text-green-500 hover:bg-zinc-800 p-2 rounded-xl transition-colors"><Check size={18}/></button>
                           <button onClick={cancelEdit} className="text-zinc-500 hover:bg-zinc-800 p-2 rounded-xl transition-colors"><X size={18}/></button>
                        </>
                    ) : (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                           <button 
                             onClick={(e) => startEditing(e, project)}
                             className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-xl"
                           >
                             <Pencil size={18} />
                           </button>
                           <button 
                             onClick={(e) => handleDelete(e, project.id)}
                             className="text-zinc-500 hover:text-red-500 transition-colors p-2 hover:bg-zinc-800 rounded-xl"
                           >
                             <Trash2 size={18} />
                           </button>
                        </div>
                    )}
                </div>
              </div>
              
              <div className="space-y-2">
                {editingId === project.id ? (
                    <input 
                        type="text" 
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className="w-full bg-zinc-900 border-2 border-blue-500 rounded-xl px-4 py-2 text-white font-bold mb-1 focus:outline-none"
                        autoFocus
                    />
                ) : (
                    <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors truncate">{project.name}</h3>
                )}
                <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                    <Clock size={12} />
                    <span>Modified {new Date(project.lastModified).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-400 font-bold text-sm">
                   <div className="w-2 h-2 rounded-full bg-blue-500/50"></div>
                   {project.nodeCount} Nodes
                </div>
                <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 group-hover:text-blue-400 group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-all">
                    <ArrowRight size={16} />
                </div>
              </div>

              {/* Decorative gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 rounded-[32px] transition-opacity pointer-events-none" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};