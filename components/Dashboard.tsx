import React, { useEffect, useState, useRef } from 'react';
import { Plus, LayoutGrid, Trash2, ArrowRight, Pencil, Check, X, Cpu, ChevronRight, Wand2, Layers, Image as ImageIcon, Sparkles, Settings2, Zap, Terminal, Box, Workflow, Tag, AlignLeft, Calendar } from 'lucide-react';
import { getProjects, createProject, deleteProject, updateProjectName, getWorkflowTemplates, deleteWorkflowTemplate, updateWorkflowTemplate, saveProjectData } from '../services/storageService';
import { ProjectMeta, WorkflowTemplate } from '../types';

interface DashboardProps {
  onOpenProject: (id: string) => void;
  onOpenDocs: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenProject, onOpenDocs }) => {
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Project Renaming state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Workflow Renaming state
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null);
  const [editWorkflowName, setEditWorkflowName] = useState('');

  // Workflow Preview Modal
  const [previewWorkflow, setPreviewWorkflow] = useState<WorkflowTemplate | null>(null);

  // Spotlight State
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Canvas Ref for Particles
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadData();
    
    const handleMouseMove = (e: MouseEvent) => {
        setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // --- Dynamic Particle Network Effect (Lighter Version) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth;
    let height = canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight;

    let particles: Particle[] = [];
    const particleCount = Math.min(Math.floor((width * height) / 12000), 120); 
    
    const mouse = { x: -1000, y: -1000, radius: 250 };

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.3; // Slower, floatier
        this.vy = (Math.random() - 0.5) * 0.3;
        this.size = Math.random() * 2 + 0.5;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const force = (mouse.radius - distance) / mouse.radius;
            // Gentle push away
            this.vx -= forceDirectionX * force * 0.05;
            this.vy -= forceDirectionY * force * 0.05;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        // Cyan/Blue mix for lighter feel
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(34, 211, 238, 0.4)' : 'rgba(56, 189, 248, 0.4)';
        ctx.fill();
      }
    }

    const initParticles = () => {
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    };

    const connect = () => {
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                const dx = particles[a].x - particles[b].x;
                const dy = particles[a].y - particles[b].y;
                const distance = dx * dx + dy * dy;

                if (distance < (width/9) * (width/9)) {
                    const opacityValue = 1 - (distance / 25000);
                    if (opacityValue > 0) {
                        ctx.strokeStyle = `rgba(34, 211, 238, ${opacityValue * 0.1})`; // Very faint cyan lines
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                    }
                }
            }
        }
    };

    const animate = () => {
        ctx.clearRect(0, 0, width, height);
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }
        connect();
        requestAnimationFrame(animate);
    };

    const handleResize = () => {
        width = canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth;
        height = canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight;
        initParticles();
    };

    const handleCanvasMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleCanvasMouseMove);

    initParticles();
    animate();

    return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleCanvasMouseMove);
    };
  }, []);

  const loadData = async () => {
    const [projs, wfs] = await Promise.all([getProjects(), getWorkflowTemplates()]);
    setProjects(projs);
    setWorkflows(wfs);
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
      loadData();
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
          loadData();
      }
  };
  
  const cancelEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingId(null);
  };

  // Workflow Handlers
  const handleDeleteWorkflow = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (confirm('Are you sure you want to delete this workflow template?')) {
          await deleteWorkflowTemplate(id);
          loadData();
      }
  };

  const startEditingWorkflow = (e: React.MouseEvent, wf: WorkflowTemplate) => {
      e.stopPropagation();
      setEditingWorkflowId(wf.id);
      setEditWorkflowName(wf.name);
  };

  const saveWorkflowName = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if(editingWorkflowId && editWorkflowName.trim()) {
          await updateWorkflowTemplate(editingWorkflowId, { name: editWorkflowName });
          setEditingWorkflowId(null);
          loadData();
      }
  };

  const cancelEditWorkflow = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingWorkflowId(null);
  };

  const handleCreateFromTemplate = async (wf: WorkflowTemplate) => {
      setLoading(true);
      const newId = await createProject(`${wf.name} (Copy)`);
      // Initialize with template data
      await saveProjectData(newId, wf.nodes, wf.edges);
      onOpenProject(newId);
  };

  return (
    <div className="flex flex-col w-full h-full relative overflow-y-auto custom-scrollbar overflow-x-hidden">
      <style>{`
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-gradient-x { background-size: 200% 200%; animation: gradient-x 6s ease infinite; }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
      `}</style>

      {/* Interactive Spotlight Cursor */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
            background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(34, 211, 238, 0.08), transparent 40%)`
        }}
      />

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center min-h-[65vh] max-w-7xl mx-auto px-6 pt-24 pb-32">
        
        {/* Dynamic Canvas Background */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-70 pointer-events-none">
             <canvas ref={canvasRef} className="w-full h-full" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center">
            {/* Version Badge - Glass Style */}
            <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-cyan-200/80 font-mono text-[10px] tracking-[0.3em] uppercase font-bold shadow-xl backdrop-blur-xl flex items-center gap-3 hover:bg-white/10 transition-all cursor-default group">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]"></span>
                    PixelFlow Engine v2.0
                </div>
            </div>
            
            {/* Main Heading - Light & Breathable */}
            <h1 className="relative text-6xl md:text-8xl lg:text-9xl tracking-tight mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 leading-[0.9] drop-shadow-2xl flex flex-col items-center gap-2">
                <span className="font-light text-zinc-300">Visual Logic</span>
                <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-blue-400 to-indigo-400 animate-gradient-x pb-2">
                    No Boundaries.
                </span>
            </h1>
            
            {/* Subtitle - Increased Readability */}
            <p className="text-blue-100/70 max-w-2xl text-lg md:text-xl leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 font-light tracking-wide mix-blend-plus-lighter">
                Empower your creativity with a node-based universe. <br className="hidden md:block"/>
                Built for the next generation of <span className="text-white font-medium">AI Architects</span>.
            </p>
            
            {/* Action Buttons - Lighter, Glassy */}
            <div className="flex flex-wrap items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                <button 
                    onClick={handleCreate}
                    className="h-14 px-10 bg-white text-slate-950 hover:bg-cyan-50 rounded-full font-bold text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-3 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(34,211,238,0.5)] group"
                >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                    <span>Initialize Canvas</span>
                </button>
                
                <button 
                    onClick={onOpenDocs}
                    className="h-14 px-10 bg-white/5 hover:bg-white/10 text-white rounded-full font-bold text-sm uppercase tracking-widest border border-white/10 hover:border-white/20 transition-all flex items-center gap-3 backdrop-blur-md group"
                >
                    <Terminal size={18} className="text-zinc-400 group-hover:text-cyan-200 transition-colors" />
                    <span>Documentation</span>
                </button>
            </div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-[1600px] mx-auto p-6 lg:px-12 pb-24 space-y-16">
         {/* Projects Grid Section */}
         <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400">
                      <LayoutGrid size={16} />
                   </div>
                   <h2 className="text-sm font-bold text-zinc-300 tracking-[0.2em] uppercase">Active Workspaces</h2>
                </div>
                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
                   {projects.length} Projects
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                   {[1,2,3,4].map(i => (
                      <div key={i} className="h-64 bg-white/5 rounded-[32px] animate-pulse border border-white/5" />
                   ))}
                </div>
            ) : projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-[40px] bg-white/5 text-zinc-500 backdrop-blur-sm">
                   <Layers size={32} className="opacity-50 text-white mb-4" />
                   <p className="text-sm font-medium mb-4 text-zinc-400 uppercase tracking-wide">Workspace Empty</p>
                   <button onClick={handleCreate} className="text-cyan-400 hover:text-white font-bold flex items-center gap-2 hover:translate-x-1 transition-all text-xs uppercase tracking-wider bg-cyan-500/10 hover:bg-cyan-500 px-6 py-3 rounded-full border border-cyan-500/20 hover:border-cyan-500">
                     Initialize First Process <ArrowRight size={14} />
                   </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                   {projects.map((project, idx) => (
                      <div 
                        key={project.id}
                        onClick={() => onOpenProject(project.id)}
                        className="group relative bg-white/5 border border-white/10 hover:border-cyan-500/30 rounded-[32px] p-6 cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:bg-white/[0.07] hover:shadow-[0_20px_60px_-15px_rgba(8,145,178,0.3)] overflow-hidden min-h-[240px] flex flex-col justify-between animate-in fade-in slide-in-from-bottom-8 backdrop-blur-md"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        
                        <div className="absolute top-0 right-0 p-5 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 flex gap-2 translate-y-2 group-hover:translate-y-0">
                           {editingId !== project.id && (
                              <div className="flex gap-1 bg-black/40 backdrop-blur-md rounded-xl p-1.5 border border-white/10 shadow-xl">
                                 <button 
                                   onClick={(e) => startEditing(e, project)}
                                   className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                                   title="Rename Project"
                                 >
                                   <Pencil size={14} />
                                 </button>
                                 <button 
                                   onClick={(e) => handleDelete(e, project.id)}
                                   className="text-zinc-400 hover:text-red-400 transition-colors p-2 hover:bg-white/10 rounded-lg"
                                   title="Delete Project"
                                 >
                                   <Trash2 size={14} />
                                 </button>
                              </div>
                           )}
                        </div>

                        <div className="relative z-10">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center border border-white/10 shadow-inner mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 group-hover:shadow-[0_0_20px_-5px_rgba(34,211,238,0.4)] group-hover:border-cyan-500/30 group-hover:bg-cyan-500/10">
                            <Box size={20} className="text-zinc-400 group-hover:text-cyan-300 transition-colors" />
                          </div>
                          
                          <div className="space-y-3">
                            {editingId === project.id ? (
                                <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                                    <input 
                                        type="text" 
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        className="w-full bg-black/50 border border-cyan-500/50 text-white font-bold text-lg rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 shadow-inner"
                                        autoFocus
                                        placeholder="Project Name"
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') saveName(e as any);
                                          if (e.key === 'Escape') cancelEdit(e as any);
                                        }}
                                    />
                                    <button onClick={saveName} className="p-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 shadow-lg shrink-0"><Check size={14}/></button>
                                    <button onClick={cancelEdit} className="p-2 bg-zinc-800 text-zinc-400 rounded-lg hover:text-white hover:bg-zinc-700 shrink-0"><X size={14}/></button>
                                </div>
                            ) : (
                                <h3 className="text-2xl font-bold text-zinc-100 group-hover:text-white transition-colors truncate pr-8 leading-tight tracking-tight">{project.name}</h3>
                            )}
                            {editingId !== project.id && (
                               <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-mono uppercase tracking-wider group-hover:text-zinc-400">
                                  <span>Modified {new Date(project.lastModified).toLocaleDateString()}</span>
                               </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between relative z-10 pt-6 border-t border-white/5 mt-4">
                           <div className="flex items-center gap-2">
                               <div className={`w-2 h-2 rounded-full ${project.nodeCount > 0 ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-zinc-700'}`}></div>
                               <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide group-hover:text-zinc-300 transition-colors">{project.nodeCount} Active Nodes</span>
                           </div>
                           <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-white transition-colors duration-300 shadow-inner">
                               <ArrowRight size={14} className="text-zinc-500 group-hover:text-white group-hover:-rotate-45 transition-all duration-300" />
                           </div>
                        </div>
                      </div>
                   ))}
                </div>
            )}
         </div>

         {/* Workflow Templates Section */}
         <div className="space-y-6">
             <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                      <Workflow size={16} />
                   </div>
                   <h2 className="text-sm font-bold text-zinc-300 tracking-[0.2em] uppercase">Workflow Library</h2>
                </div>
                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
                   {workflows.length} Templates
                </div>
             </div>

             {workflows.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-16 border border-dashed border-white/10 rounded-[32px] bg-white/5 text-zinc-500 backdrop-blur-sm">
                     <p className="text-xs uppercase tracking-widest opacity-60">No saved workflows</p>
                     <p className="text-[10px] mt-2 text-zinc-600">Save a workflow from the editor to see it here.</p>
                 </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                   {workflows.map((wf, idx) => (
                      <div 
                        key={wf.id}
                        onClick={() => setPreviewWorkflow(wf)}
                        className="group relative bg-white/5 border border-white/10 hover:border-indigo-500/30 rounded-[32px] p-6 cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:bg-white/[0.07] hover:shadow-[0_20px_60px_-15px_rgba(99,102,241,0.3)] overflow-hidden min-h-[200px] flex flex-col justify-between animate-in fade-in slide-in-from-bottom-8 backdrop-blur-md"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                         <div className="absolute top-0 right-0 p-5 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 flex gap-2 translate-y-2 group-hover:translate-y-0">
                           {editingWorkflowId !== wf.id && (
                              <div className="flex gap-1 bg-black/40 backdrop-blur-md rounded-xl p-1.5 border border-white/10 shadow-xl">
                                 <button 
                                   onClick={(e) => startEditingWorkflow(e, wf)}
                                   className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                                   title="Rename Workflow"
                                 >
                                   <Pencil size={14} />
                                 </button>
                                 <button 
                                   onClick={(e) => handleDeleteWorkflow(e, wf.id)}
                                   className="text-zinc-400 hover:text-red-400 transition-colors p-2 hover:bg-white/10 rounded-lg"
                                   title="Delete Workflow"
                                 >
                                   <Trash2 size={14} />
                                 </button>
                              </div>
                           )}
                        </div>

                         <div className="relative z-10">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 mb-4 text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all">
                                <Workflow size={18} />
                            </div>

                            <div className="space-y-2">
                                {editingWorkflowId === wf.id ? (
                                    <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                                        <input 
                                            type="text" 
                                            value={editWorkflowName}
                                            onChange={e => setEditWorkflowName(e.target.value)}
                                            className="w-full bg-black/50 border border-indigo-500/50 text-white font-bold text-lg rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner"
                                            autoFocus
                                            placeholder="Workflow Name"
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') saveWorkflowName(e as any);
                                              if (e.key === 'Escape') cancelEditWorkflow(e as any);
                                            }}
                                        />
                                        <button onClick={saveWorkflowName} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 shadow-lg shrink-0"><Check size={14}/></button>
                                        <button onClick={cancelEditWorkflow} className="p-2 bg-zinc-800 text-zinc-400 rounded-lg hover:text-white hover:bg-zinc-700 shrink-0"><X size={14}/></button>
                                    </div>
                                ) : (
                                    <h3 className="text-lg font-bold text-zinc-200 group-hover:text-white transition-colors truncate">{wf.name}</h3>
                                )}
                                <p className="text-zinc-500 text-xs line-clamp-2">{wf.description || "No description provided."}</p>
                            </div>
                         </div>

                         <div className="flex items-center justify-between relative z-10 pt-4 border-t border-white/5 mt-2">
                            <div className="flex items-center gap-2">
                               {wf.tags.slice(0, 2).map((tag, i) => (
                                   <span key={i} className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-zinc-400 border border-white/5">{tag}</span>
                               ))}
                               {wf.tags.length > 2 && <span className="text-[9px] text-zinc-500">+{wf.tags.length - 2}</span>}
                            </div>
                            <span className="text-[10px] font-mono text-zinc-500">{wf.nodes.length} Nodes</span>
                         </div>
                      </div>
                   ))}
                </div>
             )}
         </div>
      </div>

      {/* Workflow Preview Modal */}
      {previewWorkflow && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setPreviewWorkflow(null)}>
              <div className="w-[500px] bg-[#18181b] border border-zinc-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <div className="h-32 bg-indigo-500/10 flex items-center justify-center border-b border-indigo-500/10 relative overflow-hidden">
                      <Workflow size={64} className="text-indigo-500/30 absolute -bottom-4 -right-4 rotate-12" />
                      <div className="text-center z-10 px-6">
                          <h2 className="text-2xl font-bold text-white mb-1">{previewWorkflow.name}</h2>
                          <div className="flex items-center justify-center gap-2 text-xs text-indigo-300">
                             <Calendar size={12} />
                             <span>Created {new Date(previewWorkflow.createdAt).toLocaleDateString()}</span>
                          </div>
                      </div>
                  </div>
                  
                  <div className="p-8 space-y-6">
                      <div className="space-y-2">
                          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2"><AlignLeft size={12}/> Description</h3>
                          <p className="text-zinc-300 text-sm leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                              {previewWorkflow.description || "No description available."}
                          </p>
                      </div>

                      <div className="flex gap-8">
                          <div className="space-y-2 flex-1">
                              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2"><Tag size={12}/> Tags</h3>
                              <div className="flex flex-wrap gap-2">
                                  {previewWorkflow.tags.length > 0 ? previewWorkflow.tags.map((tag, i) => (
                                      <span key={i} className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs border border-zinc-700">{tag}</span>
                                  )) : <span className="text-zinc-600 text-xs italic">No tags</span>}
                              </div>
                          </div>
                          <div className="space-y-2">
                              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2"><Cpu size={12}/> Complexity</h3>
                              <span className="text-white text-sm font-bold">{previewWorkflow.nodes.length} Nodes</span>
                          </div>
                      </div>
                  </div>

                  <div className="p-6 pt-0 flex gap-3">
                      <button 
                        onClick={(e) => handleDeleteWorkflow(e, previewWorkflow.id)}
                        className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                        title="Delete Workflow"
                      >
                         <Trash2 size={20} />
                      </button>
                      <button 
                         onClick={() => handleCreateFromTemplate(previewWorkflow)}
                         className="flex-1 bg-white text-black hover:bg-indigo-500 hover:text-white py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2"
                      >
                         <Wand2 size={18} />
                         Create Project from Template
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};