
import React from 'react';
import { BookOpen, Cpu, Camera, Zap, Keyboard, Layout, Layers, Image as ImageIcon, Sparkles, Command } from 'lucide-react';

export const Documentation: React.FC = () => {
  return (
    <div className="flex flex-col w-full h-full p-8 max-w-5xl mx-auto overflow-y-auto custom-scrollbar">
      
      {/* Header */}
      <div className="mb-12 border-b border-white/10 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-4 mb-4">
            <div className="p-4 rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)] animate-in zoom-in duration-500">
                <BookOpen size={32} />
            </div>
            <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Documentation</h1>
                <div className="h-1 w-20 bg-blue-500 rounded-full mt-2 opacity-50"></div>
            </div>
        </div>
        <p className="text-zinc-400 text-lg max-w-2xl leading-relaxed ml-[4.5rem] animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100">
            Master the node-based workflow for professional visual synthesis. <br/>
            Learn how to chain logic, direct camera angles, and optimize prompts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
        
        {/* Section 1: Core Concepts */}
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-backwards">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400"><Layout size={18} /></div>
                Core Workflow
            </h2>
            <div className="group bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-5 hover:border-blue-500/30 hover:bg-zinc-900/80 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                <p className="text-sm text-zinc-300 leading-relaxed">
                    PixelFlow uses a <strong className="text-white">Node-Based Architecture</strong>. Instead of a single linear chat, you build "logic chains" where data flows visually from left to right across an infinite canvas.
                </p>
                <ul className="space-y-4">
                    <li className="flex gap-4 text-sm text-zinc-400 group/item">
                        <div className="min-w-[24px] pt-0.5 flex justify-center">
                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shadow-[0_0_8px_rgba(59,130,246,0.8)] group-hover/item:scale-150 transition-transform"></div>
                        </div>
                        <span className="group-hover/item:text-zinc-300 transition-colors">
                            <strong>Add Nodes:</strong> Use the floating sidebar to add Text, Generators, or Image inputs to your workspace.
                        </span>
                    </li>
                    <li className="flex gap-4 text-sm text-zinc-400 group/item">
                        <div className="min-w-[24px] pt-0.5 flex justify-center">
                            <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shadow-[0_0_8px_rgba(168,85,247,0.8)] group-hover/item:scale-150 transition-transform"></div>
                        </div>
                        <span className="group-hover/item:text-zinc-300 transition-colors">
                            <strong>Connect:</strong> Drag cables from the <span className="text-blue-400 font-bold">Right Handle</span> (Output) of one node to the <span className="text-zinc-500 font-bold">Left Handle</span> (Input) of another.
                        </span>
                    </li>
                    <li className="flex gap-4 text-sm text-zinc-400 group/item">
                        <div className="min-w-[24px] pt-0.5 flex justify-center">
                            <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shadow-[0_0_8px_rgba(34,197,94,0.8)] group-hover/item:scale-150 transition-transform"></div>
                        </div>
                        <span className="group-hover/item:text-zinc-300 transition-colors">
                            <strong>Execute:</strong> Click the "Run" button on any Generator node. The engine will automatically process all connected upstream nodes first.
                        </span>
                    </li>
                </ul>
            </div>
        </div>

        {/* Section 2: Node Types */}
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-backwards">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400"><Layers size={18} /></div>
                Node Library
            </h2>
            <div className="grid gap-4">
                <div className="group bg-zinc-900/50 border border-white/5 rounded-2xl p-5 flex gap-5 hover:border-purple-500/30 hover:bg-zinc-900/80 transition-all duration-300 hover:-translate-x-1 cursor-default">
                    <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-110 group-hover:bg-purple-500/10 transition-all border border-white/5 group-hover:border-purple-500/20 shadow-inner"><Cpu size={24}/></div>
                    <div>
                        <h3 className="font-bold text-white text-base group-hover:text-purple-300 transition-colors">Generator Node</h3>
                        <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">The engine heart. Takes text prompts and image references to synthesize new visuals using Gemini models.</p>
                    </div>
                </div>
                <div className="group bg-zinc-900/50 border border-white/5 rounded-2xl p-5 flex gap-5 hover:border-green-500/30 hover:bg-zinc-900/80 transition-all duration-300 hover:translate-x-1 cursor-default">
                    <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-green-400 shrink-0 group-hover:scale-110 group-hover:bg-green-500/10 transition-all border border-white/5 group-hover:border-green-500/20 shadow-inner"><ImageIcon size={24}/></div>
                    <div>
                        <h3 className="font-bold text-white text-base group-hover:text-green-300 transition-colors">Input Asset</h3>
                        <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">Load local files or use previous generations as reference inputs for style transfer or composition.</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Section 3: Camera Director */}
        <div className="md:col-span-2 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-backwards">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400"><Camera size={18} /></div>
                Camera Director & Magic Tools
            </h2>
            <div className="group bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
                {/* Background Effects */}
                <div className="absolute top-0 right-0 p-40 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-1000"></div>
                <div className="absolute bottom-0 left-0 p-32 bg-purple-500/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-purple-500/10 transition-colors duration-1000"></div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
                    <div className="space-y-4 group/card">
                        <div className="flex items-center gap-3 text-blue-400 font-bold text-sm uppercase tracking-wider group-hover/card:translate-x-2 transition-transform">
                            <div className="p-2 bg-blue-500/10 rounded-lg"><Camera size={16} /></div> 
                            Camera Control
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed border-l-2 border-blue-500/20 pl-4 group-hover/card:border-blue-500/50 transition-colors">
                            Click the camera icon on any Generator node to open the Director Panel. Select Framing (Close-up, Wide), Angles (Low, High), and Motion types to enforce cinematic composition.
                        </p>
                    </div>

                    <div className="space-y-4 group/card">
                        <div className="flex items-center gap-3 text-purple-400 font-bold text-sm uppercase tracking-wider group-hover/card:translate-x-2 transition-transform">
                             <div className="p-2 bg-purple-500/10 rounded-lg"><Sparkles size={16} /></div>
                             Magic Optimize
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed border-l-2 border-purple-500/20 pl-4 group-hover/card:border-purple-500/50 transition-colors">
                            Stuck on a prompt? Click the Sparkle icon (or press <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 text-xs text-zinc-300 mx-1">Ctrl+1</kbd>) to have Gemini rewrite your simple text into a highly detailed artistic prompt.
                        </p>
                    </div>

                    <div className="space-y-4 group/card">
                        <div className="flex items-center gap-3 text-yellow-400 font-bold text-sm uppercase tracking-wider group-hover/card:translate-x-2 transition-transform">
                             <div className="p-2 bg-yellow-500/10 rounded-lg"><Command size={16} /></div>
                             Slash Commands
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed border-l-2 border-yellow-500/20 pl-4 group-hover/card:border-yellow-500/50 transition-colors">
                            Type <kbd className="bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700 text-xs text-zinc-300 mx-1 font-bold">/</kbd> inside any text area to bring up the command menu. Quickly inject presets like "Cinematic", "Photorealism", or "Cyberpunk".
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Section 4: Shortcuts */}
        <div className="md:col-span-2 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 fill-mode-backwards">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400"><Keyboard size={18} /></div>
                Keyboard Shortcuts
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                    { keys: ['Ctrl', '1'], desc: 'Magic Optimize' },
                    { keys: ['/'], desc: 'Slash Menu' },
                    { keys: ['Delete'], desc: 'Remove Node' },
                    { keys: ['Drag'], desc: 'Pan Canvas' },
                    { keys: ['Scroll'], desc: 'Zoom Canvas' },
                    { keys: ['Ctrl', 'Click'], desc: 'Multi-select' },
                ].map((item, i) => (
                    <div 
                        key={i} 
                        className="bg-zinc-900/30 border border-white/5 rounded-xl p-4 flex flex-col gap-3 hover:bg-zinc-800/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-white/10 group cursor-default"
                        style={{ animationDelay: `${500 + i * 100}ms` }}
                    >
                        <div className="flex gap-1.5 flex-wrap">
                            {item.keys.map(k => (
                                <span key={k} className="bg-zinc-950 border border-zinc-700 rounded-md px-2 py-1 text-[10px] text-zinc-300 font-mono shadow-sm group-hover:border-blue-500/30 group-hover:text-white transition-colors min-w-[24px] text-center">{k}</span>
                            ))}
                        </div>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide group-hover:text-zinc-400">{item.desc}</span>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};
