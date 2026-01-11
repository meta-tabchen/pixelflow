import React, { useEffect, useState } from 'react';
import { Plus, Clock, LayoutGrid, Trash2, ArrowRight, Pencil, Check, X } from 'lucide-react';
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
    const name = `Untitled Project ${projects.length + 1}`;
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
    <div className="flex flex-col w-full h-full p-8 max-w-7xl mx-auto overflow-y-auto">
      {/* Hero */}
      <div className="mb-12 mt-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-500 mb-4 pb-2">
          pixelflow
        </h1>
        <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
          Professional AI visual creation engine. Create workflows, generate assets, and organize your ideas.
        </p>
        
        <div className="mt-8">
           <button 
             onClick={handleCreate}
             className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold shadow-xl shadow-blue-900/30 transition-all hover:scale-105 flex items-center gap-3 mx-auto"
           >
             <Plus size={24} />
             New Project
           </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="flex items-center gap-2 mb-6 text-zinc-300 font-bold text-xl px-2">
         <LayoutGrid size={20} />
         <span>Recent Projects</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
           {[1,2,3].map(i => <div key={i} className="h-48 bg-zinc-900/50 rounded-2xl animate-pulse" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20 text-zinc-500">
           <LayoutGrid size={48} className="mb-4 opacity-50" />
           <p className="text-lg">No projects yet</p>
           <button onClick={handleCreate} className="text-blue-400 hover:text-blue-300 mt-2 font-medium">Create your first canvas</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-20">
          {projects.map((project) => (
            <div 
              key={project.id}
              onClick={() => onOpenProject(project.id)}
              className="group relative bg-[#18181b] border border-zinc-800 hover:border-blue-500/50 rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-2xl shadow-black"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                  <LayoutGrid size={20} />
                </div>
                <div className="flex gap-1">
                    {editingId === project.id ? (
                        <>
                           <button onClick={saveName} className="text-green-500 hover:bg-zinc-800 p-2 rounded-lg transition-colors"><Check size={16}/></button>
                           <button onClick={cancelEdit} className="text-zinc-500 hover:bg-zinc-800 p-2 rounded-lg transition-colors"><X size={16}/></button>
                        </>
                    ) : (
                        <>
                           <button 
                             onClick={(e) => startEditing(e, project)}
                             className="text-zinc-600 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-lg opacity-0 group-hover:opacity-100"
                           >
                             <Pencil size={16} />
                           </button>
                           <button 
                             onClick={(e) => handleDelete(e, project.id)}
                             className="text-zinc-600 hover:text-red-500 transition-colors p-2 hover:bg-zinc-800 rounded-lg opacity-0 group-hover:opacity-100"
                           >
                             <Trash2 size={16} />
                           </button>
                        </>
                    )}
                </div>
              </div>
              
              {editingId === project.id ? (
                  <input 
                     type="text" 
                     value={editName}
                     onChange={e => setEditName(e.target.value)}
                     onClick={e => e.stopPropagation()}
                     className="w-full bg-zinc-900 border border-zinc-700 rounded p-1 text-zinc-200 font-bold mb-1 focus:outline-none focus:border-blue-500"
                     autoFocus
                  />
              ) : (
                 <h3 className="text-lg font-bold text-zinc-200 mb-1 group-hover:text-white truncate">{project.name}</h3>
              )}
              
              <div className="flex items-center justify-between mt-4 text-xs text-zinc-500">
                <div className="flex items-center gap-1.5">
                   <Clock size={12} />
                   {new Date(project.lastModified).toLocaleDateString()}
                </div>
                <div className="px-2 py-0.5 bg-zinc-800 rounded-full border border-zinc-700">
                   {project.nodeCount} nodes
                </div>
              </div>

              <div className="absolute inset-0 border-2 border-blue-500 rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};