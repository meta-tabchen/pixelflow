
import React, { useEffect, useState, useRef } from 'react';
import { Plus, LayoutGrid, Trash2, ArrowRight, Pencil, Check, X, Cpu, ChevronRight, Wand2, Layers, Image as ImageIcon, Sparkles, Settings2, Zap, Terminal, Box } from 'lucide-react';
import { getProjects, createProject, deleteProject, updateProjectName } from '../services/storageService';
import { ProjectMeta } from '../types';

interface DashboardProps {
  onOpenProject: (id: string) => void;
  onOpenDocs: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenProject, onOpenDocs }) => {
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Renaming state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Canvas Ref for Particles
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  // --- Dynamic Particle Network Effect ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth;
    let height = canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight;

    let particles: Particle[] = [];
    const particleCount = Math.min(Math.floor((width * height) / 15000), 100); // Responsive count
    
    // Mouse interaction
    const mouse = { x: -1000, y: -1000, radius: 200 };

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      baseX: number;
      baseY: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5; // Slow movement
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 1;
        this.baseX = this.x;
        this.baseY = this.y;
      }

      update() {
        // Simple physics
        this.x += this.vx;
        this.y += this.vy;

        // Wall bounce
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Mouse interaction (Fluid disturbance)
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const force = (mouse.radius - distance) / mouse.radius;
            const directionX = forceDirectionX * force * 2; // Push strength
            const directionY = forceDirectionY * force * 2;
            
            this.vx -= directionX * 0.05;
            this.vy -= directionY * 0.05;
        }

        // Friction to return to normal speed
        // Limit max speed
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if(speed > 2) {
            this.vx *= 0.9;
            this.vy *= 0.9;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.5)'; // Blueish
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

                if (distance < (width/7) * (width/7)) {
                    const opacityValue = 1 - (distance / 20000);
                    if (opacityValue > 0) {
                        ctx.strokeStyle = `rgba(59, 130, 246, ${opacityValue * 0.2})`;
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

    const handleMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    initParticles();
    animate();

    return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
    };
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
    <div className="flex flex-col w-full h-full relative overflow-y-auto custom-scrollbar overflow-x-hidden">
      <style>{`
        @keyframes scan-line {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes engine-pulse {
            0% { box-shadow: 0 0 20px -5px rgba(59, 130, 246, 0.6), 0 0 10px rgba(255,255,255,0.2) inset; }
            50% { box-shadow: 0 0 40px 5px rgba(59, 130, 246, 0.8), 0 0 20px rgba(255,255,255,0.6) inset; }
            100% { box-shadow: 0 0 20px -5px rgba(59, 130, 246, 0.6), 0 0 10px rgba(255,255,255,0.2) inset; }
        }
        .animate-scan { animation: scan-line 3s linear infinite; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
        .animate-gradient-x { background-size: 200% 200%; animation: gradient-x 8s ease infinite; }
        .animate-engine-pulse { animation: engine-pulse 2s ease-in-out infinite; }
      `}</style>

      {/* Background Ambience Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[20%] w-[60vw] h-[60vw] bg-blue-600/10 blur-[150px] rounded-full animate-pulse-glow"></div>
          <div className="absolute bottom-[-20%] right-[10%] w-[50vw] h-[50vw] bg-purple-600/10 blur-[150px] rounded-full animate-pulse-glow" style={{animationDelay: '2s'}}></div>
          {/* Subtle Grid Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]"></div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center min-h-[60vh] max-w-7xl mx-auto px-6 pt-20 pb-32 overflow-hidden">
        
        {/* Dynamic Network Visual Canvas - Positioned behind text */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-60 pointer-events-none">
             <canvas ref={canvasRef} className="w-full h-full" />
        </div>

        {/* Content Container (z-10 to sit above canvas) */}
        <div className="relative z-10 flex flex-col items-center">
            {/* Version Badge */}
            <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="px-4 py-2 rounded-full bg-black/50 border border-white/10 text-white/70 font-mono text-[10px] tracking-[0.3em] uppercase font-bold shadow-2xl backdrop-blur-xl flex items-center gap-3 hover:bg-white/5 transition-all cursor-default ring-1 ring-white/5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_#3b82f6]"></span>
                    PixelFlow Engine v2.0
                </div>
            </div>
            
            {/* Main Heading */}
            <h1 className="relative text-6xl md:text-8xl lg:text-9xl font-black text-white tracking-tighter mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 leading-[0.85] drop-shadow-2xl">
            Visual Logic <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-400 to-purple-400 animate-gradient-x pb-4 block">
                No Boundaries.
            </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-zinc-400 max-w-2xl text-lg md:text-xl leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 font-light tracking-wide mix-blend-plus-lighter">
            Orchestrate complex AI workflows on an infinite canvas. <br className="hidden md:block"/>
            From simple prompts to advanced procedural generation.
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-5 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <button 
                onClick={handleCreate}
                className="h-16 px-10 bg-white text-black hover:bg-zinc-100 rounded-full font-bold text-sm uppercase tracking-widest animate-engine-pulse transition-all hover:scale-105 active:scale-95 flex items-center gap-3 group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                <span>Initialize Canvas</span>
            </button>
            
            <button 
                onClick={onOpenDocs}
                className="h-16 px-10 bg-black/40 hover:bg-black/60 text-white rounded-full font-bold text-sm uppercase tracking-widest border border-white/10 hover:border-white/30 transition-all flex items-center gap-3 group backdrop-blur-xl"
            >
                <Terminal size={20} className="text-zinc-400 group-hover:text-white transition-colors" />
                <span>Documentation</span>
            </button>
            </div>
        </div>
      </div>

      {/* Projects Grid Section */}
      <div className="relative z-10 w-full max-w-[1600px] mx-auto p-6 lg:px-12 pb-24">
         <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                  <LayoutGrid size={16} />
               </div>
               <h2 className="text-sm font-bold text-white tracking-[0.2em] uppercase">Active Workspaces</h2>
            </div>
            <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
               {projects.length} / Unlimited
            </div>
         </div>

         {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {[1,2,3,4].map(i => (
                  <div key={i} className="h-64 bg-zinc-900/30 rounded-[32px] animate-pulse border border-white/5" />
               ))}
            </div>
         ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 border border-dashed border-zinc-800 rounded-[40px] bg-black/20 text-zinc-500 animate-in fade-in duration-500 backdrop-blur-sm">
               <div className="w-20 h-20 rounded-3xl bg-zinc-900 flex items-center justify-center mb-6 border border-white/5 shadow-2xl rotate-12 group hover:rotate-0 transition-transform duration-500">
                  <Layers size={32} className="opacity-40 text-white group-hover:opacity-100 transition-opacity" />
               </div>
               <p className="text-sm font-medium mb-6 text-zinc-400 uppercase tracking-wide">Workspace Empty</p>
               <button onClick={handleCreate} className="text-blue-400 hover:text-white font-bold flex items-center gap-2 hover:translate-x-1 transition-all text-xs uppercase tracking-wider bg-blue-500/10 hover:bg-blue-500 px-6 py-3 rounded-full border border-blue-500/20 hover:border-blue-500">
                 Initialize First Process <ArrowRight size={14} />
               </button>
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {projects.map((project, idx) => (
                  <div 
                    key={project.id}
                    onClick={() => onOpenProject(project.id)}
                    className="group relative bg-[#09090b] border border-white/5 hover:border-blue-500/50 rounded-[32px] p-6 cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_-20px_rgba(59,130,246,0.3)] overflow-hidden min-h-[220px] flex flex-col justify-between animate-in fade-in slide-in-from-bottom-8"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    {/* Glass sheen effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    
                    <div className="absolute top-0 right-0 p-5 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 flex gap-2 translate-y-2 group-hover:translate-y-0">
                       {editingId !== project.id && (
                          <div className="flex gap-1 bg-zinc-900/90 backdrop-blur-md rounded-xl p-1.5 border border-white/10 shadow-xl">
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
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center border border-white/5 shadow-inner mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 group-hover:shadow-[0_0_20px_-5px_rgba(59,130,246,0.4)] group-hover:border-blue-500/30">
                        <Box size={20} className="text-zinc-500 group-hover:text-blue-400 transition-colors" />
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
                                    placeholder="Project Name"
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
                        {editingId !== project.id && (
                           <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-mono uppercase tracking-wider">
                              <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">Updated {new Date(project.lastModified).toLocaleDateString()}</span>
                           </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between relative z-10 pt-6 border-t border-white/5 mt-4">
                       <div className="flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${project.nodeCount > 0 ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-zinc-700'}`}></div>
                           <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide group-hover:text-zinc-300 transition-colors">{project.nodeCount} Active Nodes</span>
                       </div>
                       <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                           <ArrowRight size={14} className="text-zinc-500 group-hover:text-white group-hover:-rotate-45 transition-all duration-300" />
                       </div>
                    </div>
                  </div>
               ))}
            </div>
         )}
      </div>
    </div>
  );
};
