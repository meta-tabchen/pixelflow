
import React, { useRef, memo, useState, useEffect, useMemo } from 'react';
import { Handle, Position, NodeProps, NodeToolbar, useReactFlow, useEdges, useNodes } from 'reactflow';
import { Node, NodeType, GeneratorModel } from '../../types';
import { X, Play, Image as ImageIcon, Type, Settings, Maximize2, Loader2, Sparkles, Upload, Video, Layers, Film, Plus, Wand2, ChevronDown, Maximize, Ratio, ArrowUp, Download, Zap, Camera, ScanLine, Pencil, Trash2, CloudUpload, BoxSelect, FolderPlus, Ungroup, LayoutGrid, Circle, Workflow, Aperture, User, ArrowRight, ArrowLeft, RotateCcw, Clock, Move, ZoomIn, Eye, ArrowDown, ScanFace, Mountain, Monitor, LocateFixed, Activity, Target, Contact, ScanEye, Plane, Footprints, Users, Glasses, Smartphone, Vibrate, ArrowUpDown, ArrowLeftRight, AlertCircle, ChevronsUpDown, Cpu, Save, Palette, Star, Copy, Check, MessageSquareText, Link } from 'lucide-react';
import { optimizePrompt } from '../../services/geminiService';

// --- Shared Styles ---
const CARD_BG = "bg-zinc-950/90 backdrop-blur-xl"; 
const CARD_BORDER = "border-white/10";
const CARD_HOVER_BORDER = "hover:border-blue-500/50";
const CARD_RADIUS = "rounded-[24px]";

// --- Advanced Camera Data ---
const CAMERA_OPTS = {
    framing: [
        { id: 'ews', label: 'EXTREME WIDE', value: 'Extreme Wide Shot, EWS, Vast Landscape', desc: 'Vast landscape, environment focus', icon: Mountain },
        { id: 'ws', label: 'WIDE SHOT', value: 'Wide Shot, WS, Establishing Shot', desc: 'Establishing environment', icon: Maximize },
        { id: 'full', label: 'FULL BODY', value: 'Full Shot, Head to Toe', desc: 'Complete character view', icon: Maximize2 },
        { id: 'cowboy', label: 'COWBOY', value: 'Cowboy Shot, American Shot, Knees Up', desc: 'Knees up, action ready', icon: User },
        { id: 'ms', label: 'MEDIUM', value: 'Medium Shot, Waist Up', desc: 'Waist up, standard dialogue', icon: User },
        { id: 'mcu', label: 'MED CLOSE', value: 'Medium Close-Up, Chest Up', desc: 'Chest up, emotion focus', icon: Contact },
        { id: 'cu', label: 'CLOSE UP', value: 'Close-Up, Face Only', desc: 'Face only, detailed expression', icon: ScanFace },
        { id: 'ecu', label: 'EXTREME CU', value: 'Extreme Close-Up, ECU, Eye Detail', desc: 'Eye detail, high impact', icon: ScanEye },
        { id: 'macro', label: 'MACRO', value: 'Macro Photography, Microscopic', desc: 'Microscopic texture', icon: Target },
    ],
    angle: [
        { id: 'overhead', label: 'TOP DOWN', value: 'Overhead Shot, Top-Down View, 90 Degree', desc: '90 degree vertical', icon: Layers },
        { id: 'aerial', label: 'AERIAL', value: 'Aerial View, Drone Shot, Helicopter View', desc: 'High altitude drone', icon: Plane },
        { id: 'high', label: 'HIGH ANGLE', value: 'High Angle, Looking Down', desc: 'Looking down, vulnerability', icon: ArrowDown },
        { id: 'eye', label: 'EYE LEVEL', value: 'Eye Level, Neutral Angle', desc: 'Neutral perspective', icon: Eye },
        { id: 'low', label: 'LOW ANGLE', value: 'Low Angle, Looking Up', desc: 'Looking up, dominance', icon: ArrowUp },
        { id: 'worm', label: 'WORM EYE', value: 'Worm\'s Eye View, Ground Level', desc: 'Ground level', icon: Footprints },
        { id: 'ots', label: 'OTS', value: 'Over the Shoulder, OTS', desc: 'Over shoulder perspective', icon: Users },
        { id: 'pov', label: 'POV', value: 'POV, First Person View, Through Eyes', desc: 'First person view', icon: Glasses },
        { id: 'selfie', label: 'SELFIE', value: 'Selfie, Front Camera', desc: 'Front camera', icon: Smartphone },
        { id: 'dutch', label: 'DUTCH', value: 'Dutch Angle, Tilted Frame', desc: 'Tilted frame, unease', icon: Activity },
    ],
    motion: [
        { id: 'static', label: 'STATIC', value: 'Static Camera, Tripod', desc: 'Locked off, stable', icon: LocateFixed },
        { id: 'handheld', label: 'HANDHELD', value: 'Handheld Camera, Shaky Cam', desc: 'Raw, shaky movement', icon: Vibrate },
        { id: 'pan', label: 'PAN', value: 'Pan Camera', desc: 'Horizontal rotation', icon: ArrowLeft },
        { id: 'tilt', label: 'TILT', value: 'Tilt Camera', desc: 'Vertical rotation', icon: ArrowUpDown },
        { id: 'dolly', label: 'DOLLY', value: 'Dolly Zoom, Vertigo Effect', desc: 'Move in/out', icon: Move },
        { id: 'truck', label: 'TRUCK', value: 'Truck Camera, Tracking Shot', desc: 'Side tracking', icon: ArrowLeftRight },
        { id: 'zoom', label: 'ZOOM', value: 'Camera Zoom, Crash Zoom', desc: 'Focal length change', icon: ZoomIn },
        { id: 'orbit', label: 'ORBIT', value: 'Arc Shot, 360 Orbit', desc: 'Circle around subject', icon: RotateCcw },
        { id: 'fpv', label: 'FPV', value: 'FPV Drone, High Speed', desc: 'High speed flight', icon: Video },
    ]
};

const ASPECT_RATIOS = ["1:1","2:3","3:2","3:4","4:3","4:5","5:4","9:16","16:9","21:9"];

const SLASH_COMMANDS = [
    { id: 'photo', label: 'Photorealism', desc: 'Hyper-realistic photography style.', value: 'Photorealistic, hyper-realistic, 8k resolution, sharp focus, raw photo, highly detailed, ray tracing', icon: Aperture },
    { id: 'cinema', label: 'Cinematic', desc: 'Movie-like lighting and atmosphere.', value: 'Cinematic lighting, dramatic atmosphere, volumetric fog, color graded, 8k, movie scene, widescreen', icon: Film },
    { id: 'char', label: 'Character Sheet', desc: 'Front, side, and back views.', value: 'Character reference sheet, front view, side view, back view, neutral background, concept art, consistency', icon: Users },
    { id: 'cyber', label: 'Cyberpunk', desc: 'Futuristic neon aesthetic.', value: 'Cyberpunk style, neon lights, futuristic city, high tech, dystopian, vibrant colors, night', icon: Zap },
    { id: 'anime', label: 'Anime Style', desc: 'Vibrant Japanese animation style.', value: 'Anime style, highly detailed, vibrant colors, cel shaded, studio ghibli inspired, 4k', icon: Star },
    { id: 'studio', label: 'Studio Portrait', desc: 'Professional lighting setup.', value: 'Professional studio portrait, rim lighting, softbox, 4k, sharp focus on eyes, bokeh', icon: User },
    { id: 'oil', label: 'Oil Painting', desc: 'Classical textured art.', value: 'Oil painting, thick brushstrokes, textured canvas, classical art style, masterpiece', icon: Palette },
    { id: 'story', label: 'Storyboard', desc: '9-grid narrative sequence.', value: 'Split screen 9 grid view, different camera angles, cinematic storyboard, narrative sequence', icon: LayoutGrid },
];

// --- Reusable UI Components ---

const NodeTitle = ({ title, onChange, placeholder = "Untitled" }: { title?: string, onChange: (val: string) => void, placeholder?: string }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [localTitle, setLocalTitle] = useState(title || "");

    useEffect(() => { setLocalTitle(title || ""); }, [title]);

    const handleCommit = () => {
        setIsEditing(false);
        if (localTitle !== title) onChange(localTitle);
    };

    if (isEditing) {
        return (
            <input 
                autoFocus
                value={localTitle}
                onChange={e => setLocalTitle(e.target.value)}
                onBlur={handleCommit}
                onKeyDown={e => { 
                    e.stopPropagation(); 
                    if(e.key === 'Enter') handleCommit(); 
                }}
                className="bg-zinc-950 text-white text-xs font-bold px-2 py-1 rounded border border-blue-500 outline-none w-32 min-w-[120px] nodrag shadow-xl font-sans tracking-wide absolute top-0 left-0"
                onMouseDown={e => e.stopPropagation()}
            />
        )
    }

    return (
        <div 
            className="flex items-center gap-2 group/title cursor-text min-w-[80px] nodrag py-1 rounded transition-all relative" 
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            title="Click to rename"
        >
             <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-hover/title:text-zinc-300 transition-colors truncate max-w-[150px] font-mono">
                 {title || placeholder}
             </span>
             <Pencil size={10} className="text-zinc-600 opacity-0 group-hover/title:opacity-100 transition-opacity" />
        </div>
    )
}

// --- Visual Legend for Input Variables ---
const InputVariablesLegend = ({ nodeId }: { nodeId: string }) => {
    // Only fetch edges/nodes when this component is mounted (when parent is selected)
    // This avoids perf issues for unselected nodes.
    const { getNodes, getEdges } = useReactFlow();
    
    // We use a simplified state here that updates every second or on specific triggers if possible
    // But since this is only rendered when selected, we can just grab current state.
    // For real-time updates while dragging *other* nodes, we'd need useNodes() hook, 
    // but that causes re-renders. Let's try useNodes/useEdges but wrapped to be safe.
    
    const edges = useEdges();
    const nodes = useNodes();
    
    const inputs = useMemo(() => {
        const inputEdges = edges.filter(e => e.target === nodeId);
        const inputNodes = inputEdges.map(e => nodes.find(n => n.id === e.source)).filter(Boolean) as Node[];
        
        // Sort by Y position (Top to Bottom) to match execution logic
        return inputNodes.sort((a, b) => a.position.y - b.position.y).map((node, index) => ({
            index,
            id: node.id,
            title: node.data.title || node.data.label || "Untitled Node",
            type: node.type
        }));
    }, [edges, nodes, nodeId]);

    if (inputs.length === 0) return null;

    return (
        <div className="absolute top-full left-4 mt-2 p-2.5 bg-zinc-900/95 backdrop-blur-md rounded-xl border border-white/10 text-[10px] w-64 z-20 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-200 ring-1 ring-black/50">
             <div className="flex items-center gap-2 font-bold text-zinc-500 uppercase tracking-wider mb-2 px-1 border-b border-white/5 pb-1">
                 <Link size={10} />
                 <span>Input Variables</span>
             </div>
             <div className="space-y-1.5 max-h-[150px] overflow-y-auto custom-scrollbar">
                 {inputs.map(input => (
                     <div key={input.id} className="flex items-center justify-between text-zinc-300 bg-black/40 px-2 py-1.5 rounded border border-white/5 group">
                         <span className="font-mono text-blue-400 font-bold bg-blue-500/10 px-1 rounded">{"{{"}node {input.index}{"}}"}</span>
                         <span className="truncate flex-1 text-right text-zinc-400 group-hover:text-white transition-colors ml-2">{input.title}</span>
                     </div>
                 ))}
                 <div className="flex items-center justify-between text-zinc-500 bg-transparent px-2 py-1">
                     <span className="font-mono font-bold">{"{{"}input{"}}"}</span>
                     <span>(All Joined)</span>
                 </div>
             </div>
             <div className="mt-2 text-[9px] text-zinc-600 px-1 leading-relaxed">
                 Use variables in prompt to reference inputs. Order is determined by vertical position (Top to Bottom).
             </div>
        </div>
    );
};

// --- Group Node ---
const GroupNode = ({ data, selected, id }: NodeProps) => {
  return (
    <>
      <NodeToolbar 
        isVisible={selected} 
        position={Position.Top} 
        offset={15} 
        className="flex items-center justify-center pointer-events-none" 
      >
         <div className="flex items-center bg-black/80 border border-white/10 p-1.5 rounded-full shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-300 pointer-events-auto whitespace-nowrap">
            <div className="flex items-center gap-2 px-2">
                <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                    <LayoutGrid size={10} className="text-zinc-300" />
                </div>
                <NodeTitle title={data.label} onChange={(val) => data.onChange?.(id, { label: val })} placeholder="Group" />
            </div>
            {/* Redundant buttons removed as they are now handled by SelectionOverlay */}
         </div>
      </NodeToolbar>

      <div className={`w-full h-full rounded-[32px] transition-all duration-300 relative group/group ${selected ? 'border-2 border-blue-500/30 bg-blue-500/5' : 'border border-dashed border-zinc-800 bg-zinc-900/5'}`}>
        <div className="absolute -top-8 left-0 opacity-0 group-hover/group:opacity-100 transition-all duration-300">
          <span className="text-[10px] font-mono font-bold text-zinc-600 uppercase">
            // {data.label || 'GROUP'}
          </span>
        </div>
      </div>
    </>
  );
};

// --- Gen Text Node ---
const GenTextNode = ({ data, selected, id }: NodeProps) => {
    const isGenerating = data.isLoading;
    const hasResult = !!data.result;
    const hasError = !!data.error;

    const statusStyles = useMemo(() => {
        if (isGenerating) return 'ring-1 ring-amber-500 border-amber-500 shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)]';
        if (hasError) return 'ring-1 ring-red-500 border-red-500 shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]';
        if (selected) return 'ring-1 ring-amber-500/50 shadow-[0_0_50px_-10px_rgba(245,158,11,0.3)]';
        return 'hover:border-amber-500/50';
    }, [isGenerating, hasError, selected]);

    return (
        <div className={`relative group/node ${CARD_BG} ${CARD_BORDER} border ${CARD_RADIUS} w-[360px] shadow-2xl transition-all duration-300 ${statusStyles} overflow-visible`}>
            {/* Input Variables Legend (Only when selected) */}
            {selected && <InputVariablesLegend nodeId={id} />}

            {/* Title */}
            <div className="absolute -top-7 left-1 z-10 flex items-center gap-2">
                <MessageSquareText size={12} className="text-amber-400" />
                <NodeTitle title={data.title} onChange={(val) => data.onChange?.(id, { title: val })} placeholder="TEXT GEN" />
            </div>

            <div className="flex flex-col h-full">
                 {/* Output Area */}
                 {hasResult || isGenerating || hasError ? (
                    <div className="relative w-full border-b border-white/5 bg-black/50 p-4 max-h-[300px] overflow-y-auto custom-scrollbar rounded-t-[24px]">
                         {isGenerating ? (
                            <div className="flex items-center gap-2 text-amber-500 animate-pulse py-4">
                                <Loader2 size={14} className="animate-spin" />
                                <span className="text-[10px] font-mono">WRITING...</span>
                            </div>
                         ) : hasError ? (
                             <div className="text-red-400 text-xs">{data.error}</div>
                         ) : (
                             <div className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
                                 {data.result}
                             </div>
                         )}
                         {hasResult && !isGenerating && (
                             <button 
                                onClick={() => { navigator.clipboard.writeText(data.result || ''); }}
                                className="absolute top-2 right-2 p-1.5 bg-black/50 text-zinc-500 hover:text-white rounded-md transition-colors"
                                title="Copy Text"
                             >
                                 <Copy size={12} />
                             </button>
                         )}
                    </div>
                 ) : null}

                 {/* Input Area */}
                 <div className={`p-3 space-y-3 ${hasResult ? 'rounded-b-[24px]' : 'rounded-[24px]'}`}>
                     <textarea 
                        className="w-full h-24 bg-black/20 border border-white/5 text-sm text-zinc-300 placeholder-zinc-700 rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 leading-relaxed p-3 nodrag font-medium transition-all group-hover/input:bg-black/40"
                        placeholder="Instructions (e.g., Summarize {{node 0}})"
                        value={data.text || ''}
                        onChange={(e) => data.onChange?.(id, { text: e.target.value })}
                        onMouseDown={e => e.stopPropagation()}
                     />
                     
                     <div className="flex items-center justify-between">
                         {/* Model Select */}
                         <div className="relative group/model">
                             <button className="flex items-center gap-1.5 hover:text-amber-400 transition-all nodrag text-[9px] font-bold uppercase tracking-wider text-zinc-500 border border-white/5 px-2 py-1 rounded bg-zinc-900/50 hover:bg-zinc-800 h-7">
                                 <Zap size={10} className={data.params?.model === GeneratorModel.GEMINI_PRO_TEXT ? "text-purple-400" : "text-amber-500"} />
                                 <span>{data.params?.model === GeneratorModel.GEMINI_PRO_TEXT ? 'Pro' : 'Flash'}</span>
                                 <ChevronDown size={10} />
                             </button>
                             <select className="absolute inset-0 opacity-0 cursor-pointer nodrag" value={data.params?.model} onChange={(e) => data.onChange?.(id, { params: { ...data.params, model: e.target.value }})}>
                                 <option value={GeneratorModel.GEMINI_FLASH_TEXT}>Flash</option>
                                 <option value={GeneratorModel.GEMINI_PRO_TEXT}>Pro</option>
                             </select>
                         </div>

                         <div className="flex items-center gap-2">
                             <button 
                                onClick={() => data.onDelete?.(id)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg transition-all nodrag border bg-zinc-900 text-zinc-500 border-white/5 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20"
                             >
                                <Trash2 size={12} />
                             </button>
                             <button 
                                onClick={() => data.onRun?.(id)}
                                disabled={isGenerating}
                                className={`h-7 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all nodrag font-bold text-[9px] uppercase tracking-widest ${isGenerating ? 'bg-zinc-800 text-zinc-600 border border-white/5' : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/40 hover:scale-105 active:scale-95 border border-amber-400/20'}`}
                             >
                                {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <>Run <ArrowRight size={10} /></>}
                             </button>
                         </div>
                     </div>
                 </div>
            </div>

            <Handle type="target" position={Position.Left} className="!w-2.5 !h-5 !rounded-[2px] !border-none !bg-zinc-700 hover:!bg-amber-500 transition-colors" />
            <Handle 
                type="source" 
                position={Position.Right} 
                className="!w-2.5 !h-5 !rounded-[2px] !border-none !bg-zinc-700 hover:!bg-amber-500" 
            />
        </div>
    );
};

// --- Gen Image Node ---

const GenImageNode = ({ data, selected, id }: NodeProps) => {
  const isGenerating = data.isLoading;
  const isPro = data.params?.model === GeneratorModel.GEMINI_PRO_IMAGE;
  const hasResult = !!data.result;
  const hasError = !!data.error;
  const allResults = data.results || (data.result ? [data.result] : []);
  const resultCount = allResults.length;
  
  const [isCollapsed, setIsCollapsed] = useState(!!data.result);
  const [gridView, setGridView] = useState(false);
  
  const prevGenerating = useRef(false);
  useEffect(() => {
      if (prevGenerating.current && !isGenerating && hasResult) {
          setIsCollapsed(true);
      }
      prevGenerating.current = !!isGenerating;
  }, [isGenerating, hasResult]);

  const [showCameraPanel, setShowCameraPanel] = useState(false);
  const currentCameraStr = data.params?.camera || "";
  
  const activeFraming = useMemo(() => CAMERA_OPTS.framing.find(opt => currentCameraStr.includes(opt.value))?.value, [currentCameraStr]);
  const activeAngle = useMemo(() => CAMERA_OPTS.angle.find(opt => currentCameraStr.includes(opt.value))?.value, [currentCameraStr]);
  const activeMotion = useMemo(() => CAMERA_OPTS.motion.find(opt => currentCameraStr.includes(opt.value))?.value, [currentCameraStr]);
  const activeCount = [activeFraming, activeAngle, activeMotion].filter(Boolean).length;

  const updateCameraParam = (category: 'framing' | 'angle' | 'motion', value: string) => {
      let newFraming = activeFraming;
      let newAngle = activeAngle;
      let newMotion = activeMotion;
      if (category === 'framing') newFraming = (activeFraming === value ? undefined : value);
      if (category === 'angle') newAngle = (activeAngle === value ? undefined : value);
      if (category === 'motion') newMotion = (activeMotion === value ? undefined : value);
      const parts = [newFraming, newAngle, newMotion].filter(Boolean);
      const finalCameraString = parts.length > 0 ? parts.join(", ") : undefined;
      data.onChange?.(id, { params: { ...data.params, camera: finalCameraString }});
  };

  const handleResolutionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      const updates: any = { imageSize: val };
      // Auto-upgrade to Pro if high res selected
      if ((val === '2K' || val === '4K') && data.params?.model !== GeneratorModel.GEMINI_PRO_IMAGE) {
          updates.model = GeneratorModel.GEMINI_PRO_IMAGE;
      }
      data.onChange?.(id, { params: { ...data.params, ...updates }});
  };

  const [showCommands, setShowCommands] = useState(false);
  const [commandIndex, setCommandIndex] = useState(0);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleMagicOptimize = async () => {
     if (!data.text || isOptimizing) return;
     setIsOptimizing(true);
     try {
         const optimized = await optimizePrompt(data.text);
         data.onChange?.(id, { text: optimized });
     } catch(e) {
         console.error("Optimization failed", e);
     } finally {
         setIsOptimizing(false);
     }
  };

  const handleCommandSelect = (cmd: typeof SLASH_COMMANDS[0]) => {
      const currentText = data.text || "";
      const newText = currentText.endsWith("/") ? currentText.slice(0, -1) + cmd.value : currentText + " " + cmd.value;
      data.onChange?.(id, { text: newText });
      setShowCommands(false);
      setTimeout(() => data.onRun?.(id), 100); 
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === '1' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          handleMagicOptimize();
          return;
      }
      if (showCommands) {
          if (e.key === 'ArrowUp') {
              e.preventDefault();
              setCommandIndex(prev => (prev - 1 + SLASH_COMMANDS.length) % SLASH_COMMANDS.length);
          } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              setCommandIndex(prev => (prev + 1) % SLASH_COMMANDS.length);
          } else if (e.key === 'Enter') {
              e.preventDefault();
              handleCommandSelect(SLASH_COMMANDS[commandIndex]);
          } else if (e.key === 'Escape') {
              setShowCommands(false);
          }
          return;
      }
      if (e.key === '/' && !e.shiftKey) {
          setShowCommands(true);
          setCommandIndex(0);
      }
  };

  useEffect(() => {
      const handleClickOutside = () => {
          setShowCommands(false);
          setShowCameraPanel(false);
      };
      if(showCommands || showCameraPanel) {
          window.addEventListener('click', handleClickOutside);
      }
      return () => window.removeEventListener('click', handleClickOutside);
  }, [showCommands, showCameraPanel]);

  const toggleCollapse = (e: React.MouseEvent) => {
      if (hasResult) setIsCollapsed(!isCollapsed);
  };
  
  const handleSelectResult = (e: React.MouseEvent, img: string) => {
      e.preventDefault(); 
      e.stopPropagation();
      // Set as main result and close grid
      data.onChange?.(id, { result: img });
      setGridView(false);
  };

  // Border & Shadow Status Styles
  const statusStyles = useMemo(() => {
     if (isGenerating) return 'ring-1 ring-blue-500 border-blue-500 shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]';
     if (hasError) return 'ring-1 ring-red-500 border-red-500 shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]';
     if (selected) return 'ring-1 ring-blue-500/50 shadow-[0_0_50px_-10px_rgba(59,130,246,0.3)]';
     return CARD_HOVER_BORDER;
  }, [isGenerating, hasError, selected]);

  const showTopSection = hasResult || isGenerating || hasError;

  return (
    <div className={`relative group/node ${CARD_BG} ${CARD_BORDER} border ${CARD_RADIUS} w-[400px] shadow-2xl transition-all duration-300 ${statusStyles} overflow-visible`}>
      
      {/* Input Variables Legend (Only when selected) */}
      {selected && <InputVariablesLegend nodeId={id} />}

      {/* Title - Outside Card */}
      <div className="absolute -top-7 left-1 z-10 flex items-center gap-2">
         <Cpu size={12} className={isPro ? "text-purple-400" : "text-blue-400"} />
         <NodeTitle title={data.title} onChange={(val) => data.onChange?.(id, { title: val })} placeholder="GENERATION" />
      </div>

      {/* Camera Panel */}
      {showCameraPanel && (
           <div className="absolute bottom-14 -right-12 z-[100] w-[340px] max-h-[400px] overflow-y-auto custom-scrollbar glass-panel bg-black/95 rounded-2xl shadow-2xl p-5 animate-in slide-in-from-bottom-2 fade-in duration-200 flex flex-col gap-5 cursor-default border border-white/10 origin-bottom-right" onMouseDown={e => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">Camera Control</span>
                    <button onClick={() => data.onChange?.(id, { params: { ...data.params, camera: undefined }})} className="text-[9px] font-mono text-red-400 hover:text-red-300 transition-colors">RESET</button>
                </div>
                {Object.entries(CAMERA_OPTS).map(([cat, opts]) => (
                    <div key={cat} className="space-y-2">
                        <span className="text-[9px] font-mono text-blue-500/70 uppercase tracking-widest pl-1">{cat}</span>
                        <div className="grid grid-cols-3 gap-1.5">
                            {opts.map((opt) => {
                                const isActive = (cat === 'framing' ? activeFraming : cat === 'angle' ? activeAngle : activeMotion) === opt.value;
                                return (
                                    <button 
                                        key={opt.id}
                                        onClick={() => updateCameraParam(cat as any, opt.value)}
                                        className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all gap-1.5 h-14 border ${isActive ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_-3px_rgba(37,99,235,0.4)]' : 'bg-zinc-900/50 text-zinc-500 border-white/5 hover:bg-zinc-800 hover:text-zinc-300'}`}
                                    >
                                        <opt.icon size={14} />
                                        <span className="text-[8px] font-bold text-center leading-none tracking-tight">{opt.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
      )}

      {/* Inner Container for Content */}
      <div className={`w-full h-full flex flex-col`}>
        
        {showTopSection && (
            <div 
                className={`relative w-full border-b ${isCollapsed ? 'border-transparent' : 'border-white/5'} bg-black/50 ${isGenerating || hasError ? 'aspect-video' : ''} overflow-hidden cursor-pointer group/result rounded-t-[24px] ${isCollapsed ? 'rounded-b-[24px]' : ''}`}
                onClick={toggleCollapse}
            >
            {isGenerating ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-4 bg-zinc-950/80 backdrop-blur-sm">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-white/5 border-t-blue-500 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles size={14} className="text-blue-500 animate-pulse" />
                    </div>
                </div>
                <span className="text-[9px] font-mono text-blue-500 animate-pulse">PROCESSING...</span>
                </div>
            ) : hasError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center bg-zinc-950/90" onClick={e => e.stopPropagation()}>
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500">
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-red-400 mb-1">Execution Failed</span>
                        <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2 px-4 font-mono">{data.error}</p>
                    </div>
                    <button onClick={() => data.onRun?.(id)} className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-[10px] font-bold text-white transition-all uppercase tracking-wide">Retry</button>
                </div>
            ) : (
                <div className="relative w-full group/image-area">
                    {gridView ? (
                        <div className="w-full max-h-[320px] overflow-y-auto custom-scrollbar bg-zinc-900 p-2 grid grid-cols-2 gap-2" onClick={e => e.stopPropagation()}>
                            {allResults.map((img, idx) => (
                                <div 
                                    key={idx} 
                                    className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer group/item ${img === data.result ? 'border-green-500 bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'border-zinc-700 hover:border-blue-400 bg-black/40'}`}
                                    onClick={(e) => handleSelectResult(e, img)}
                                >
                                    <img src={img} className="w-full h-full object-contain" />
                                    {img === data.result && (
                                        <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-black shadow-sm z-10">
                                            <Check size={12} strokeWidth={4} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 hover:bg-white/10 transition-colors pointer-events-none" />
                                </div>
                            ))}
                            <button onClick={(e) => { e.stopPropagation(); setGridView(false); }} className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-md hover:bg-black/80 hover:text-red-400 z-20 backdrop-blur-sm border border-white/10"><X size={12}/></button>
                        </div>
                    ) : (
                        <>
                            <div className="w-full bg-zinc-950/50 flex items-center justify-center">
                                <img src={data.result} alt="Generated" className="max-w-full max-h-[500px] object-contain shadow-sm" />
                            </div>
                            
                            {/* Overlay Controls */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/result:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                    <div className="flex gap-2 scale-90 group-hover/result:scale-100 transition-transform duration-300">
                                        <button onClick={(e) => { e.stopPropagation(); data.onEdit?.(id, data.result!); }} className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full shadow-lg hover:bg-blue-500 hover:text-white transition-all" title="Annotate / Edit"><Pencil size={16} /></button>
                                        <a href={data.result} download="pixel-flow.png" onClick={(e) => e.stopPropagation()} className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full shadow-lg hover:bg-blue-500 hover:text-white transition-all" title="Download"><Download size={16} /></a>
                                        {resultCount > 1 && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setGridView(true); }}
                                                className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full shadow-lg hover:bg-blue-500 hover:text-white transition-all"
                                                title="View All Variations"
                                            >
                                                <LayoutGrid size={16} />
                                            </button>
                                        )}
                                    </div>
                            </div>

                            {/* Result Counter Badge */}
                            {resultCount > 1 && !isCollapsed && (
                                <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md border border-white/10 text-[9px] font-bold text-white flex items-center gap-1.5 shadow-lg pointer-events-none">
                                    <Copy size={10} />
                                    <span>{allResults.indexOf(data.result!) + 1}/{resultCount}</span>
                                </div>
                            )}

                            {isCollapsed && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 opacity-0 group-hover/result:opacity-100 transition-all duration-300 translate-y-2 group-hover/result:translate-y-0 pointer-events-none">
                                        <ChevronsUpDown size={10} className="text-blue-400" />
                                        <span className="text-[9px] font-bold tracking-widest uppercase text-white">Expand</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
            </div>
        )}

        {!isCollapsed && (
            <div className={`flex flex-col animate-in fade-in slide-in-from-top-2 duration-300 ease-out p-3 gap-3 ${!showTopSection ? 'rounded-[24px]' : 'rounded-b-[24px]'}`}>
                <div className="relative group/input">
                    <textarea
                        className="w-full h-24 bg-black/20 border border-white/5 text-sm text-zinc-300 placeholder-zinc-700 rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 leading-relaxed p-3 nodrag font-medium transition-all group-hover/input:bg-black/40"
                        placeholder="Describe your vision or press &quot;/&quot; for shortcuts... Use {{node 0}} for inputs."
                        value={data.text || ''}
                        onChange={(e) => data.onChange?.(id, { text: e.target.value })}
                        onKeyDown={handleKeyDown}
                        onMouseDown={(e) => e.stopPropagation()} 
                    />
                
                    {showCommands && (
                        <div className="absolute bottom-full left-0 w-full mb-2 bg-[#18181b] rounded-xl shadow-2xl overflow-hidden z-[100] animate-in slide-in-from-bottom-2 duration-200 border border-white/10 ring-1 ring-white/10">
                            <div className="px-3 py-2 border-b border-white/5 bg-white/5">
                                <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Quick Presets</span>
                            </div>
                            <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                                {SLASH_COMMANDS.map((cmd, index) => (
                                    <button
                                        key={cmd.id}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all ${index === commandIndex ? 'bg-blue-600 text-white' : 'hover:bg-white/5'}`}
                                        onClick={() => handleCommandSelect(cmd)}
                                        onMouseEnter={() => setCommandIndex(index)}
                                    >
                                        <cmd.icon size={14} className={index === commandIndex ? 'text-white' : 'text-zinc-500'} />
                                        <div className="flex-1">
                                            <div className="text-[10px] font-bold uppercase tracking-wider">{cmd.label}</div>
                                            <div className={`text-[9px] truncate ${index === commandIndex ? 'text-white/70' : 'text-zinc-500'}`}>{cmd.desc}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between gap-2">
                    {/* Left: Settings */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Model Selector */}
                        <div className="relative group/model">
                            <button className="flex items-center gap-1.5 hover:text-blue-400 transition-all nodrag text-[9px] font-bold uppercase tracking-wider text-zinc-500 border border-white/5 px-2 py-1 rounded bg-zinc-900/50 hover:bg-zinc-800 h-7">
                                <Zap size={10} className={isPro ? "text-purple-400 fill-purple-400" : "text-yellow-500 fill-yellow-500"} />
                                <span>{isPro ? 'Pro' : 'Flash'}</span>
                                <ChevronDown size={10} />
                            </button>
                            <select className="absolute inset-0 opacity-0 cursor-pointer nodrag" value={data.params?.model} onChange={(e) => data.onChange?.(id, { params: { ...data.params, model: e.target.value }})}>
                                <option value={GeneratorModel.GEMINI_FLASH_IMAGE}>Flash</option>
                                <option value={GeneratorModel.GEMINI_PRO_IMAGE}>Pro</option>
                            </select>
                        </div>
                        
                        {/* Aspect Ratio */}
                        <div className="relative group/aspect">
                            <button className="flex items-center gap-1.5 hover:text-blue-400 transition-all nodrag text-[9px] font-bold uppercase tracking-wider text-zinc-500 border border-white/5 px-2 py-1 rounded bg-zinc-900/50 hover:bg-zinc-800 h-7">
                                <Ratio size={10} />
                                <span>{data.params?.aspectRatio || '16:9'}</span>
                            </button>
                            <select className="absolute inset-0 opacity-0 cursor-pointer nodrag" value={data.params?.aspectRatio || "16:9"} onChange={(e) => data.onChange?.(id, { params: { ...data.params, aspectRatio: e.target.value }})}>
                                {ASPECT_RATIOS.map(ratio => (
                                    <option key={ratio} value={ratio}>{ratio}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Count Selector */}
                        <div className="relative group/count">
                            <button className="flex items-center gap-1.5 hover:text-blue-400 transition-all nodrag text-[9px] font-bold uppercase tracking-wider text-zinc-500 border border-white/5 px-2 py-1 rounded bg-zinc-900/50 hover:bg-zinc-800 h-7">
                                <Copy size={10} />
                                <span>x{data.params?.numberOfImages || 1}</span>
                            </button>
                            <select className="absolute inset-0 opacity-0 cursor-pointer nodrag" value={data.params?.numberOfImages || 1} onChange={(e) => data.onChange?.(id, { params: { ...data.params, numberOfImages: parseInt(e.target.value) }})}>
                                <option value={1}>1 Image</option>
                                <option value={2}>2 Images</option>
                                <option value={3}>3 Images</option>
                                <option value={4}>4 Images</option>
                                <option value={5}>5 Images</option>
                                <option value={6}>6 Images</option>
                                <option value={8}>8 Images</option>
                            </select>
                        </div>

                        {/* Resolution */}
                        <div className="relative group/res">
                            <button className={`flex items-center gap-1.5 transition-all nodrag text-[9px] font-bold uppercase tracking-wider border border-white/5 px-2 py-1 rounded h-7 ${data.params?.imageSize === '2K' || data.params?.imageSize === '4K' ? 'text-purple-400 bg-purple-500/10 hover:bg-purple-500/20' : 'text-zinc-500 bg-zinc-900/50 hover:bg-zinc-800 hover:text-blue-400'}`}>
                                <Monitor size={10} />
                                <span>{data.params?.imageSize || '1K'}</span>
                            </button>
                            <select className="absolute inset-0 opacity-0 cursor-pointer nodrag" value={data.params?.imageSize || "1K"} onChange={handleResolutionChange}>
                                <option value="1K">1K</option>
                                <option value="2K">2K</option>
                                <option value="4K">4K</option>
                            </select>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5">
                         {/* Camera Director */}
                        <div className="relative" onMouseDown={e => e.stopPropagation()}>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowCameraPanel(!showCameraPanel); }}
                                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all nodrag border ${showCameraPanel || activeCount > 0 ? 'bg-blue-600/20 text-blue-300 border-blue-500/30' : 'bg-zinc-900 text-zinc-500 border-white/5 hover:bg-zinc-800 hover:text-white'}`}
                                title="Camera Director"
                            >
                                <Camera size={12} />
                            </button>
                        </div>

                        {/* Magic Optimize */}
                        <button 
                            onClick={handleMagicOptimize}
                            disabled={isOptimizing}
                            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all nodrag border ${isOptimizing ? 'bg-blue-600 text-white border-blue-500' : 'bg-zinc-900 text-zinc-500 border-white/5 hover:text-white hover:bg-zinc-800'}`}
                            title="Magic Optimize (Ctrl+1)"
                        >
                            {isOptimizing ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} />}
                        </button>

                         {/* Delete */}
                        <button 
                            onClick={() => data.onDelete?.(id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all nodrag border bg-zinc-900 text-zinc-500 border-white/5 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20"
                            title="Delete Node"
                        >
                            <Trash2 size={12} />
                        </button>
                        
                        {/* Run Button */}
                        <button 
                            onClick={() => data.onRun?.(id)}
                            disabled={isGenerating}
                            className={`h-7 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all nodrag font-bold text-[9px] uppercase tracking-widest ${isGenerating ? 'bg-zinc-800 text-zinc-600 border border-white/5' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 hover:scale-105 active:scale-95 border border-blue-400/20'}`}
                        >
                            {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <>Run <ArrowRight size={10} /></>}
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>

      <Handle type="target" position={Position.Left} className="!w-2.5 !h-5 !rounded-[2px] !border-none !bg-zinc-700 hover:!bg-blue-500 transition-colors" />
      {/* Improved Source Handle with pointer-events-none on icon to fix drag */}
      <Handle 
        type="source" 
        position={Position.Right} 
        onClick={() => data.onAddNext?.(id)}
        className="!w-6 !h-6 !bg-blue-600 !border-2 !border-black !flex !items-center !justify-center !rounded-full !shadow-[0_0_10px_rgba(37,99,235,0.5)] !opacity-100 !transition-all !-right-3 hover:!scale-125 z-50 cursor-pointer"
        title="Add Next Node"
      >
        <Plus size={12} className="text-white pointer-events-none" strokeWidth={3} />
      </Handle>
    </div>
  );
};

const InputTextNode = ({ data, selected, id }: NodeProps) => {
  return (
    <div className={`relative group/node ${CARD_BG} ${CARD_BORDER} border ${CARD_RADIUS} w-[300px] min-h-[160px] shadow-2xl transition-all duration-300 ${selected ? 'ring-1 ring-blue-500/50 scale-[1.02]' : CARD_HOVER_BORDER} flex flex-col overflow-hidden`}>
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-900/30">
          <div className="flex items-center gap-2">
             <Type size={12} className="text-blue-400" />
             <NodeTitle title={data.title} onChange={(val) => data.onChange?.(id, { title: val })} placeholder="TEXT ASSET" />
          </div>
          <button onClick={() => data.onDelete?.(id)} className="text-zinc-600 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
      </div>
      <textarea
        className="w-full h-full flex-1 bg-transparent border-none text-sm text-zinc-300 placeholder-zinc-700 focus:outline-none focus:bg-white/5 p-4 resize-none nodrag leading-relaxed font-medium"
        placeholder="Enter raw text prompt components..."
        value={data.text || ''}
        onChange={(e) => data.onChange?.(id, { text: e.target.value })}
        onMouseDown={(e) => e.stopPropagation()}
      />
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-5 !rounded-[2px] !border-none !bg-zinc-700 hover:!bg-blue-500" />
    </div>
  );
};

const InputImageNode = ({ data, selected, id }: NodeProps) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                const base64 = result.split(',')[1];
                data.onChange?.(id, { image: base64, preview: result });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className={`relative group/node ${CARD_BG} ${CARD_BORDER} border ${CARD_RADIUS} w-[280px] shadow-2xl transition-all duration-300 ${selected ? 'ring-1 ring-blue-500/50 scale-[1.02]' : CARD_HOVER_BORDER} overflow-hidden`}>
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-900/30">
                <div className="flex items-center gap-2">
                   <ImageIcon size={12} className="text-purple-400" />
                   <NodeTitle title={data.title} onChange={(val) => data.onChange?.(id, { title: val })} placeholder="IMAGE ASSET" />
                </div>
                <button onClick={() => data.onDelete?.(id)} className="text-zinc-600 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
            </div>
            
            <div className={`w-full bg-black/40 relative group/image ${!data.preview ? 'aspect-square' : ''}`}>
                {data.preview ? (
                    <>
                        <div className="w-full flex items-center justify-center bg-zinc-950/50">
                             <img src={data.preview} alt="Input" className="max-w-full max-h-[280px] object-contain" />
                        </div>
                         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                            <label className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full cursor-pointer hover:scale-110 transition-transform">
                                <Upload size={16} />
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                             <button onClick={() => data.onChange?.(id, { image: undefined, preview: undefined })} className="w-10 h-10 flex items-center justify-center bg-red-500 text-white rounded-full hover:scale-110 transition-transform"><X size={16}/></button>
                         </div>
                    </>
                ) : (
                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-white/5 transition-all gap-4 text-zinc-700 hover:text-blue-500 group/upload">
                        <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center border border-white/5 group-hover/upload:border-blue-500/30 group-hover/upload:bg-blue-500/10 transition-all">
                            <CloudUpload size={20} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Upload Source</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                )}
            </div>
            
            <Handle type="source" position={Position.Right} className="!w-2.5 !h-5 !rounded-[2px] !border-none !bg-zinc-700" />
            <Handle type="target" position={Position.Left} className="!w-2.5 !h-5 !rounded-[2px] !border-none !bg-zinc-700" />
        </div>
    )
}

export const nodeTypes = {
  [NodeType.GEN_IMAGE]: memo(GenImageNode),
  [NodeType.GEN_TEXT]: memo(GenTextNode),
  [NodeType.GROUP]: memo(GroupNode),
  [NodeType.INPUT_TEXT]: memo(InputTextNode),
  [NodeType.INPUT_IMAGE]: memo(InputImageNode),
  [NodeType.UPLOAD_IMAGE]: memo(InputImageNode),
};
