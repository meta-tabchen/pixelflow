
import React, { useEffect, useState } from 'react';
import { LayoutGrid, Trash2, ArrowRight, Pencil, Check, X, Box, Plus, Search, FolderOpen, Calendar, Cpu } from 'lucide-react';
import { getProjects, createProject, deleteProject, updateProjectName } from '../services/storageService';
import { ProjectMeta } from '../types';

interface ProjectListProps {
  onOpenProject: (id: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ onOpenProject }) => {
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
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

  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col w-full h-full p-8 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
      
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-blue-600/10 rounded-xl text-blue-400 border border-blue-500/20">
                    <FolderOpen size={24} />
                </div>
                <h1 className="text-3xl font-bold text-white">Project Library</h1>
            </div>
            <p className="text-zinc-400 ml-1">Manage your visual logic workflows.</p>
        </div>

        <div className="flex items-center gap-4">
            <div className="relative group">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search projects..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded-full pl-10 pr-4 py-3 w-64 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                />
            </div>
            <button 
                onClick={handleCreate}
                className="bg-white text-black hover:bg-blue-500 hover:text-white px-6 py-3 rounded-full font-bold text-sm uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-blue-900/10 hover:shadow-blue-500/30 active:scale-95"
            >
                <Plus size={18} />
                New Project
            </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="h-64 bg-zinc-900/30 rounded-[32px] animate-pulse border border-white/5" />
           ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-zinc-800 rounded-[40px] bg-black/20 text-zinc-500">
           {searchQuery ? (
               <>
                <Search size={48} className="mb-4 opacity-20" />
                <p>No projects match your search.</p>
               </>
           ) : (
               <>
                <LayoutGrid size={48} className="mb-4 opacity-20" />
                <p className="mb-6">No projects created yet.</p>
                <button onClick={handleCreate} className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-2">
                    Create your first project <ArrowRight size={16} />
                </button>
               </>
           )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {filteredProjects.map((project, idx) => (
              <div 
                key={project.id}
                onClick={() => onOpenProject(project.id)}
                className="group relative bg-[#09090b] border border-white/5 hover:border-blue-500/50 rounded-[32px] p-6 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_50px_-20px_rgba(59,130,246,0.3)] overflow-hidden min-h-[240px] flex flex-col justify-between animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
                
                <div className="absolute top-0 right-0 p-5 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 flex gap-2 translate-y-2 group-hover:translate-y-0">
                   {editingId !== project.id && (
                      <div className="flex gap-1 bg-zinc-900/90 backdrop-blur-md rounded-xl p-1.5 border border-white/10 shadow-xl">
                         <button 
                           onClick={(e) => startEditing(e, project)}
                           className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                           title="Rename"
                         >
                           <Pencil size={14} />
                         </button>
                         <button 
                           onClick={(e) => handleDelete(e, project.id)}
                           className="text-zinc-400 hover:text-red-400 transition-colors p-2 hover:bg-white/10 rounded-lg"
                           title="Delete"
                         >
                           <Trash2 size={14} />
                         </button>
                      </div>
                   )}
                </div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center border border-white/5 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 group-hover:shadow-[0_0_20px_-5px_rgba(59,130,246,0.4)] group-hover:border-blue-500/30 text-zinc-500 group-hover:text-blue-400">
                        <Box size={20} />
                    </div>
                    {project.nodeCount > 0 && (
                        <div className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            Active
                        </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {editingId === project.id ? (
                        <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                            <input 
                                type="text" 
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                className="w-full bg-zinc-950 border border-blue-500/50 text-white font-bold text-lg rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-inner"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveName(e as any);
                                  if (e.key === 'Escape') cancelEdit(e as any);
                                }}
                            />
                            <button onClick={saveName} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 shadow-lg shrink-0"><Check size={14}/></button>
                            <button onClick={cancelEdit} className="p-2 bg-zinc-800 text-zinc-400 rounded-lg hover:text-white hover:bg-zinc-700 shrink-0"><X size={14}/></button>
                        </div>
                    ) : (
                        <h3 className="text-xl font-bold text-zinc-200 group-hover:text-white transition-colors truncate pr-8 leading-tight tracking-tight">{project.name}</h3>
                    )}
                    
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-zinc-500 text-[11px] font-medium">
                            <Calendar size={12} />
                            <span>{new Date(project.lastModified).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-500 text-[11px] font-medium">
                            <Cpu size={12} />
                            <span>{project.nodeCount} Nodes</span>
                        </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between relative z-10 pt-6 border-t border-white/5 mt-4">
                   <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest group-hover:text-blue-400/70 transition-colors">Open Workspace</span>
                   <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                       <ArrowRight size={14} className="text-zinc-500 group-hover:text-white group-hover:-rotate-45 transition-all duration-300" />
                   </div>
                </div>
              </div>
           ))}
        </div>
      )}
    </div>
  );
};
