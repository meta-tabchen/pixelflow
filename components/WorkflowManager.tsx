
import React, { useEffect, useState, useRef } from 'react';
import { Workflow, Search, Upload, Download, Trash2, Pencil, Check, X, FileJson, Calendar, Tag, Cpu, Wand2, Plus, ArrowRight, AlertTriangle } from 'lucide-react';
import { getWorkflowTemplates, saveWorkflowTemplate, deleteWorkflowTemplate, updateWorkflowTemplate, createProject, saveProjectData } from '../services/storageService';
import { WorkflowTemplate } from '../types';

interface WorkflowManagerProps {
  onOpenProject: (id: string) => void;
}

export const WorkflowManager: React.FC<WorkflowManagerProps> = ({ onOpenProject }) => {
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Renaming state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  
  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    const data = await getWorkflowTemplates();
    setWorkflows(data);
    setLoading(false);
  };

  // --- Actions ---

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
              const content = event.target?.result as string;
              const json = JSON.parse(content);
              
              if (!json.nodes || !Array.isArray(json.nodes)) {
                  alert("Invalid workflow file: Missing nodes.");
                  return;
              }

              // Strip ID to create a new copy
              const { id, createdAt, ...templateData } = json;
              // Ensure name is unique-ish
              templateData.name = `${templateData.name} (Imported)`;
              
              await saveWorkflowTemplate(templateData);
              loadWorkflows();
              alert("Workflow imported successfully!");
          } catch (err) {
              console.error("Import failed", err);
              alert("Failed to import workflow. Invalid JSON.");
          }
      };
      reader.readAsText(file);
      e.target.value = ''; // Reset
  };

  const handleExport = (e: React.MouseEvent, wf: WorkflowTemplate) => {
      e.stopPropagation();
      const jsonString = JSON.stringify(wf, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${wf.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_workflow.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setDeleteId(id);
  };

  const confirmDelete = async () => {
      if (deleteId) {
          await deleteWorkflowTemplate(deleteId);
          setDeleteId(null);
          loadWorkflows();
      }
  };

  const handleCreateFromTemplate = async (e: React.MouseEvent, wf: WorkflowTemplate) => {
      e.stopPropagation();
      const newId = await createProject(`${wf.name} (Run)`);
      await saveProjectData(newId, wf.nodes, wf.edges);
      onOpenProject(newId);
  };

  // --- Renaming Logic ---
  
  const startEditing = (e: React.MouseEvent, wf: WorkflowTemplate) => {
      e.stopPropagation();
      setEditingId(wf.id);
      setEditName(wf.name);
  };

  const saveName = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if(editingId && editName.trim()) {
          await updateWorkflowTemplate(editingId, { name: editName });
          setEditingId(null);
          loadWorkflows();
      }
  };

  const cancelEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingId(null);
  };

  const filteredWorkflows = workflows.filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col w-full h-full p-8 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
      
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-indigo-600/10 rounded-xl text-indigo-400 border border-indigo-500/20">
                    <Workflow size={24} />
                </div>
                <h1 className="text-3xl font-bold text-white">Workflow Library</h1>
            </div>
            <p className="text-zinc-400 ml-1">Manage, share, and reuse your logic patterns.</p>
        </div>

        <div className="flex items-center gap-4">
            <div className="relative group">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search workflows..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded-full pl-10 pr-4 py-3 w-64 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
                />
            </div>
            
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json" 
                onChange={handleImport} 
            />
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white px-6 py-3 rounded-full font-bold text-sm uppercase tracking-wider flex items-center gap-2 transition-all border border-white/5"
            >
                <Upload size={18} />
                Import
            </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {[1,2,3,4].map(i => (
              <div key={i} className="h-64 bg-zinc-900/30 rounded-[32px] animate-pulse border border-white/5" />
           ))}
        </div>
      ) : filteredWorkflows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-zinc-800 rounded-[40px] bg-black/20 text-zinc-500">
           {searchQuery ? (
               <>
                <Search size={48} className="mb-4 opacity-20" />
                <p>No workflows match your search.</p>
               </>
           ) : (
               <>
                <FileJson size={48} className="mb-4 opacity-20" />
                <p className="mb-6">No saved workflows found.</p>
                <div className="flex gap-4">
                    <button onClick={() => fileInputRef.current?.click()} className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-2">
                        <Upload size={16} /> Import JSON
                    </button>
                </div>
               </>
           )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {filteredWorkflows.map((wf, idx) => (
              <div 
                key={wf.id}
                className="group relative bg-[#09090b] border border-white/5 hover:border-indigo-500/50 rounded-[32px] p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_50px_-20px_rgba(99,102,241,0.3)] overflow-hidden min-h-[280px] flex flex-col justify-between animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Overlay Actions */}
                <div className="absolute top-0 right-0 p-5 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 flex gap-2 translate-y-2 group-hover:translate-y-0">
                   {editingId !== wf.id && (
                      <div className="flex gap-1 bg-zinc-900/90 backdrop-blur-md rounded-xl p-1.5 border border-white/10 shadow-xl">
                         <button 
                           onClick={(e) => startEditing(e, wf)}
                           className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                           title="Rename"
                         >
                           <Pencil size={14} />
                         </button>
                         <button 
                           onClick={(e) => handleExport(e, wf)}
                           className="text-zinc-400 hover:text-blue-400 transition-colors p-2 hover:bg-white/10 rounded-lg"
                           title="Export JSON"
                         >
                           <Download size={14} />
                         </button>
                         <button 
                           onClick={(e) => handleDeleteClick(e, wf.id)}
                           className="text-zinc-400 hover:text-red-400 transition-colors p-2 hover:bg-white/10 rounded-lg"
                           title="Delete"
                         >
                           <Trash2 size={14} />
                         </button>
                      </div>
                   )}
                </div>

                <div className="relative z-10" onClick={(e) => editingId !== wf.id && handleCreateFromTemplate(e, wf)}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner group-hover:scale-110 transition-all duration-500 text-indigo-400">
                        <Workflow size={20} />
                    </div>
                  </div>
                  
                  <div className="space-y-3 cursor-pointer">
                    {editingId === wf.id ? (
                        <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                            <input 
                                type="text" 
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                className="w-full bg-zinc-950 border border-indigo-500/50 text-white font-bold text-lg rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveName(e as any);
                                  if (e.key === 'Escape') cancelEdit(e as any);
                                }}
                            />
                            <button onClick={saveName} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 shadow-lg shrink-0"><Check size={14}/></button>
                            <button onClick={cancelEdit} className="p-2 bg-zinc-800 text-zinc-400 rounded-lg hover:text-white hover:bg-zinc-700 shrink-0"><X size={14}/></button>
                        </div>
                    ) : (
                        <h3 className="text-xl font-bold text-zinc-200 group-hover:text-white transition-colors truncate pr-8 leading-tight tracking-tight">{wf.name}</h3>
                    )}
                    
                    <p className="text-zinc-500 text-xs line-clamp-2 min-h-[2.5em]">{wf.description || "No description provided."}</p>

                    <div className="flex flex-wrap gap-2 mt-2">
                         {wf.tags.slice(0, 3).map((tag, i) => (
                             <span key={i} className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-zinc-400 border border-white/5 flex items-center gap-1">
                                <Tag size={8} /> {tag}
                             </span>
                         ))}
                    </div>

                    <div className="flex flex-col gap-1 pt-2">
                        <div className="flex items-center gap-2 text-zinc-500 text-[11px] font-medium">
                            <Calendar size={12} />
                            <span>{new Date(wf.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-500 text-[11px] font-medium">
                            <Cpu size={12} />
                            <span>{wf.nodes.length} Nodes</span>
                        </div>
                    </div>
                  </div>
                </div>
                
                <button 
                    onClick={(e) => handleCreateFromTemplate(e, wf)}
                    className="flex items-center justify-between w-full relative z-10 pt-4 border-t border-white/5 mt-4 group/btn"
                >
                   <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest group-hover/btn:text-indigo-400/70 transition-colors">Launch</span>
                   <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover/btn:bg-indigo-600 group-hover/btn:text-white transition-colors duration-300">
                       <Wand2 size={14} className="text-zinc-500 group-hover/btn:text-white transition-all duration-300" />
                   </div>
                </button>
              </div>
           ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setDeleteId(null)}>
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl max-w-sm w-full transform scale-100 flex flex-col gap-4 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 text-white">
                   <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                      <AlertTriangle size={20} />
                   </div>
                   <h3 className="text-lg font-bold">Delete Workflow?</h3>
                </div>
                
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Are you sure you want to delete this template? This action cannot be undone.
                </p>
                
                <div className="flex justify-end gap-3 mt-2">
                  <button 
                    onClick={() => setDeleteId(null)}
                    className="px-4 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-sm font-medium border border-transparent hover:border-zinc-700"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmDelete}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 text-sm font-bold flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
