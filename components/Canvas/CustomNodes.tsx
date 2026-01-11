import React, { useRef, memo, useState, useEffect, useMemo } from 'react';
import { Handle, Position, NodeProps, useUpdateNodeInternals, NodeToolbar } from 'reactflow';
import { Node, NodeType, GeneratorModel } from '../../types';
import { X, Play, Image as ImageIcon, Type, Settings, Maximize2, Loader2, Sparkles, Upload, Video, Layers, Film, Plus, Wand2, ChevronDown, Maximize, Ratio, ArrowUp, Download, Zap, Camera, ScanLine, Pencil, Trash2, CloudUpload, BoxSelect, FolderPlus, Ungroup, LayoutGrid, Circle, Workflow, Aperture, User, ArrowRight, ArrowLeft, RotateCcw, Clock, Move, ZoomIn, Eye, ArrowDown, ScanFace, Mountain, Monitor, LocateFixed, Activity, Target, Contact, ScanEye, Plane, Footprints, Users, Glasses, Smartphone, Vibrate, ArrowUpDown, ArrowLeftRight, AlertCircle, ChevronsUpDown } from 'lucide-react';
import { optimizePrompt } from '../../services/geminiService';

// --- Shared Styles ---
const CARD_BG = "bg-[#121214]"; 
const CARD_BORDER = "border-white/5";
const CARD_HOVER_BORDER = "hover:border-blue-500/30";
const CARD_RADIUS = "rounded-[24px]";

// --- Advanced Camera Data ---
const CAMERA_OPTS = {
    framing: [
        { id: 'ews', label: '极远景', value: 'Extreme Wide Shot, EWS, Vast Landscape', desc: '极宏大场景，环境为主', icon: Mountain },
        { id: 'ws', label: '远景', value: 'Wide Shot, WS, Establishing Shot', desc: '交代环境与人物关系', icon: Maximize },
        { id: 'full', label: '全景', value: 'Full Shot, Head to Toe', desc: '人物全身完整可见', icon: Maximize2 },
        { id: 'cowboy', label: '牛仔景', value: 'Cowboy Shot, American Shot, Knees Up', desc: '膝盖以上，强调肢体', icon: User },
        { id: 'ms', label: '中景', value: 'Medium Shot, Waist Up', desc: '腰部以上，对话标准', icon: User },
        { id: 'mcu', label: '中特写', value: 'Medium Close-Up, Chest Up', desc: '胸部以上，强调神态', icon: Contact },
        { id: 'cu', label: '特写', value: 'Close-Up, Face Only', desc: '面部细节，情绪传达', icon: ScanFace },
        { id: 'ecu', label: '极特写', value: 'Extreme Close-Up, ECU, Eye Detail', desc: '局部细节，强视觉冲击', icon: ScanEye },
        { id: 'macro', label: '微距', value: 'Macro Photography, Microscopic', desc: '微观世界，纹理质感', icon: Target },
    ],
    angle: [
        { id: 'overhead', label: '上帝视角', value: 'Overhead Shot, Top-Down View, 90 Degree', desc: '垂直向下俯视', icon: Layers },
        { id: 'aerial', label: '航拍', value: 'Aerial View, Drone Shot, Helicopter View', desc: '高空鸟瞰，大场面', icon: Plane },
        { id: 'high', label: '高角度', value: 'High Angle, Looking Down', desc: '俯视，显得渺小脆弱', icon: ArrowDown },
        { id: 'eye', label: '平视', value: 'Eye Level, Neutral Angle', desc: '水平视线，客观真实', icon: Eye },
        { id: 'low', label: '低角度', value: 'Low Angle, Looking Up', desc: '仰视，显得高大威严', icon: ArrowUp },
        { id: 'worm', label: '虫视', value: 'Worm\'s Eye View, Ground Level', desc: '贴地拍摄，极度夸张', icon: Footprints },
        { id: 'ots', label: '过肩', value: 'Over the Shoulder, OTS', desc: '越过肩膀看对象', icon: Users },
        { id: 'pov', label: '第一人称', value: 'POV, First Person View, Through Eyes', desc: '主观视角，身临其境', icon: Glasses },
        { id: 'selfie', label: '自拍', value: 'Selfie, Front Camera', desc: '手持自拍视角', icon: Smartphone },
        { id: 'dutch', label: '荷兰倾斜', value: 'Dutch Angle, Tilted Frame', desc: '画面倾斜，不安感', icon: Activity },
    ],
    motion: [
        { id: 'static', label: '固定', value: 'Static Camera, Tripod', desc: '稳定不动', icon: LocateFixed },
        { id: 'handheld', label: '手持', value: 'Handheld Camera, Shaky Cam', desc: '呼吸感，真实晃动', icon: Vibrate },
        { id: 'pan', label: '摇摄', value: 'Pan Camera', desc: '左右旋转镜头', icon: ArrowLeft },
        { id: 'tilt', label: '俯仰', value: 'Tilt Camera', desc: '上下旋转镜头', icon: ArrowUpDown },
        { id: 'dolly', label: '推拉', value: 'Dolly Zoom, Vertigo Effect', desc: '移动摄影车', icon: Move },
        { id: 'truck', label: '横移', value: 'Truck Camera, Tracking Shot', desc: '左右平移跟随', icon: ArrowLeftRight },
        { id: 'zoom', label: '变焦', value: 'Camera Zoom, Crash Zoom', desc: '焦距推拉', icon: ZoomIn },
        { id: 'orbit', label: '环绕', value: 'Arc Shot, 360 Orbit', desc: '环绕主体拍摄', icon: RotateCcw },
        { id: 'fpv', label: '穿越机', value: 'FPV Drone, High Speed', desc: '高速飞行视角', icon: Video },
    ]
};

const SLASH_COMMANDS = [
    { id: '9grid', label: '多机位九宫格', desc: '基于关键帧参考图，从同一画面生成 9 种运镜角度参考。', value: 'Split screen 9 grid view, different camera angles, cinematic storyboard, character reference sheet, 8k', icon: Video },
    { id: 'lighting', label: '电影级光影校正', desc: '自动优化当前画面的光影质感。', value: 'Cinematic lighting, volumetric fog, dramatic atmosphere, color graded, raytracing, 8k', icon: Zap },
    { id: 'char_sheet', label: '角色三视图生成', desc: '生成角色的正面、侧面、背面视图。', value: 'Character reference sheet, front view, side view, back view, neutral background, concept art', icon: User },
    { id: 'next_3s', label: '画面推演 - 3秒后', desc: '推演当前画面发生后 3 秒的情景。', value: 'Sequence of events, 3 seconds later, narrative progression, next frame', icon: ArrowRight },
    { id: 'prev_5s', label: '画面推演 - 5秒前', desc: '推演当前画面发生前 5 秒的情景。', value: 'Sequence of events, 5 seconds before, prequel context, previous frame', icon: RotateCcw },
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
                className="bg-zinc-900 text-zinc-100 text-xs font-bold px-2 py-1 rounded-lg border border-blue-500 outline-none w-32 min-w-[100px] nodrag shadow-lg"
                onMouseDown={e => e.stopPropagation()}
            />
        )
    }

    return (
        <div 
            className="flex items-center gap-2 group/title cursor-text min-w-[80px] nodrag bg-white/5 px-2 py-1 rounded-lg border border-white/5 hover:border-white/10 transition-all" 
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            title="Click to rename"
        >
             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover/title:text-zinc-200 transition-colors truncate max-w-[150px]">
                 {title || placeholder}
             </span>
             <Pencil size={10} className="text-zinc-600 opacity-0 group-hover/title:opacity-100 transition-opacity" />
        </div>
    )
}

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
         <div className="flex items-center bg-[#18181b]/95 border border-white/10 p-1.5 rounded-2xl shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-300 pointer-events-auto whitespace-nowrap">
            <div className="flex items-center gap-2 pl-2 pr-3">
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                    <LayoutGrid size={10} className="text-white" />
                </div>
                <NodeTitle title={data.label} onChange={(val) => data.onChange?.(id, { label: val })} placeholder="Group" />
            </div>

            <div className="w-px h-6 bg-white/5 mx-1" />

            <button 
              onClick={() => data.onRunGroup?.(id)}
              className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-xl text-zinc-300 hover:text-white transition-all text-xs font-bold"
            >
               <Play size={14} className="fill-current" />
               Run All
            </button>
            
            <button 
              onClick={() => data.onUngroup?.(id)}
              className="flex items-center gap-2 px-4 py-2 hover:bg-red-500/10 rounded-xl text-zinc-400 hover:text-red-400 transition-all text-xs font-bold"
            >
               <Ungroup size={14} />
               Ungroup
            </button>
         </div>
      </NodeToolbar>

      <div className={`w-full h-full rounded-[40px] transition-all duration-500 relative group/group ${selected ? 'border-2 border-blue-500/50 bg-blue-500/5 shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)]' : 'border-2 border-dashed border-zinc-800 bg-zinc-900/10'}`}>
        <div className="absolute -top-12 left-0 px-4 py-1 opacity-0 group-hover/group:opacity-100 transition-all duration-300 translate-y-2 group-hover/group:translate-y-0">
          <span className="text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase">
            {data.label || 'Node Group'}
          </span>
        </div>
      </div>
    </>
  );
};

// --- Gen Image Node ---

const GenImageNode = ({ data, selected, id }: NodeProps) => {
  const isGenerating = data.isLoading;
  const isPro = data.params?.model === GeneratorModel.GEMINI_PRO_IMAGE;
  const hasResult = !!data.result;
  const hasError = !!data.error;
  
  const [isCollapsed, setIsCollapsed] = useState(!!data.result);
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
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          data.onRun?.(id);
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

  return (
    <div className={`relative group/node ${CARD_BG} ${CARD_BORDER} border ${CARD_RADIUS} w-[380px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] transition-all duration-500 ${selected ? 'ring-2 ring-blue-500 shadow-[0_0_80px_-20px_rgba(59,130,246,0.4)] scale-[1.02]' : CARD_HOVER_BORDER} overflow-hidden`}>
      
      <div className="absolute top-4 left-4 z-10">
          <NodeTitle title={data.title} onChange={(val) => data.onChange?.(id, { title: val })} placeholder="Generation" />
      </div>

      {(hasResult || isGenerating || hasError) && (
        <div 
            className={`relative w-full border-b ${isCollapsed ? 'border-transparent' : 'border-white/5'} bg-black/40 ${isGenerating || hasError ? 'aspect-video' : ''} ${isCollapsed ? 'rounded-b-[24px]' : ''} overflow-hidden cursor-pointer group/result`}
            onClick={toggleCollapse}
        >
           {isGenerating ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-4 bg-zinc-950/80 backdrop-blur-md">
               <div className="relative">
                 <div className="w-12 h-12 rounded-full border-[3px] border-white/5 border-t-blue-500 animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles size={16} className="text-blue-500 animate-pulse" />
                 </div>
               </div>
               <span className="text-[10px] font-black tracking-[0.3em] text-blue-500 animate-pulse">PROCESSING</span>
             </div>
           ) : hasError ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center bg-zinc-950/90" onClick={e => e.stopPropagation()}>
                 <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500">
                    <AlertCircle size={24} />
                 </div>
                 <div>
                    <span className="block text-xs font-black uppercase tracking-widest text-red-400 mb-1">Execution Error</span>
                    <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2 px-4">{data.error}</p>
                 </div>
                 <button onClick={() => data.onRun?.(id)} className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-[10px] font-bold text-white transition-all">Retry Generation</button>
             </div>
           ) : (
             <div className="relative w-full">
               <img src={data.result} alt="Generated" className="w-full h-auto block" />
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/result:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                    <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); data.onEdit?.(id, data.result!); }} className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full shadow-2xl hover:scale-110 transition-all"><Pencil size={18} /></button>
                        <a href={data.result} download="pixel-flow.png" onClick={(e) => e.stopPropagation()} className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full shadow-2xl hover:scale-110 transition-all"><Download size={18} /></a>
                    </div>
               </div>
               {isCollapsed && (
                   <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10 opacity-0 group-hover/result:opacity-100 transition-all duration-300 translate-y-2 group-hover/result:translate-y-0 pointer-events-none">
                        <ChevronsUpDown size={12} className="text-blue-400" />
                        <span className="text-[10px] font-black tracking-widest uppercase text-white">Expand Logic</span>
                   </div>
               )}
             </div>
           )}
        </div>
      )}

      {!isCollapsed && (
        <div className="flex flex-col animate-in fade-in slide-in-from-top-4 duration-500 ease-out p-5 gap-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative" onMouseDown={e => e.stopPropagation()}>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowCameraPanel(!showCameraPanel); }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all nodrag ${showCameraPanel || activeCount > 0 ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'bg-white/5 hover:bg-white/10 text-zinc-400 border border-white/5'}`}
                        >
                            <Camera size={14} />
                            <span>{activeCount > 0 ? `${activeCount} FX` : 'Camera'}</span>
                        </button>

                        {showCameraPanel && (
                            <div className="absolute top-10 left-0 z-[100] w-[320px] max-h-[400px] overflow-y-auto custom-scrollbar glass rounded-[32px] shadow-2xl p-6 animate-in slide-in-from-top-4 fade-in duration-300 flex flex-col gap-6 cursor-default">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase">Director Panel</span>
                                    <button onClick={() => data.onChange?.(id, { params: { ...data.params, camera: undefined }})} className="text-[9px] font-bold text-blue-500 hover:text-white transition-colors">RESET ALL</button>
                                </div>
                                
                                {Object.entries(CAMERA_OPTS).map(([cat, opts]) => (
                                    <div key={cat} className="space-y-3">
                                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{cat}</span>
                                        <div className="grid grid-cols-3 gap-2">
                                            {opts.map((opt) => {
                                                const isActive = (cat === 'framing' ? activeFraming : cat === 'angle' ? activeAngle : activeMotion) === opt.value;
                                                return (
                                                    <button 
                                                        key={opt.id}
                                                        onClick={() => updateCameraParam(cat as any, opt.value)}
                                                        className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all gap-1 h-16 ${isActive ? 'bg-blue-600 text-white shadow-xl scale-105' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`}
                                                    >
                                                        <opt.icon size={16} />
                                                        <span className="text-[8px] font-bold text-center leading-tight">{opt.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={handleMagicOptimize}
                        disabled={isOptimizing}
                        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all nodrag ${isOptimizing ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 hover:bg-white/10 text-zinc-400 border border-white/5'}`}
                        title="Magic Optimize (Ctrl+1)"
                    >
                        {isOptimizing ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14} />}
                    </button>
                </div>
                
                <button onClick={() => data.onDelete?.(id)} className="text-zinc-700 hover:text-red-500 transition-all nodrag p-2"><Trash2 size={16} /></button>
            </div>
            
            <div className="relative">
                <textarea
                    className="w-full h-32 bg-white/5 border border-white/5 text-sm text-zinc-200 placeholder-zinc-700 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed p-4 nodrag font-medium"
                    placeholder="Describe your vision or press &quot;/&quot; for shortcuts..."
                    value={data.text || ''}
                    onChange={(e) => data.onChange?.(id, { text: e.target.value })}
                    onKeyDown={handleKeyDown}
                    onMouseDown={(e) => e.stopPropagation()} 
                />
            
                {showCommands && (
                    <div className="absolute bottom-full left-0 w-full mb-3 glass rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in slide-in-from-bottom-4 duration-300 border border-white/10">
                        <div className="px-4 py-2 border-b border-white/5 bg-white/5">
                            <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Magic Actions</span>
                        </div>
                        <div className="max-h-[220px] overflow-y-auto custom-scrollbar">
                            {SLASH_COMMANDS.map((cmd, index) => (
                                <button
                                    key={cmd.id}
                                    className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-all ${index === commandIndex ? 'bg-blue-600 text-white' : 'hover:bg-white/5'}`}
                                    onClick={() => handleCommandSelect(cmd)}
                                    onMouseEnter={() => setCommandIndex(index)}
                                >
                                    <cmd.icon size={16} className={index === commandIndex ? 'text-white' : 'text-zinc-500'} />
                                    <div className="flex-1">
                                        <div className="text-[11px] font-bold">{cmd.label}</div>
                                        <div className={`text-[9px] opacity-60 truncate ${index === commandIndex ? 'text-white' : 'text-zinc-500'}`}>{cmd.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-[9px] font-black tracking-widest uppercase text-zinc-500">
                    <div className="relative group/model">
                        <button className="flex items-center gap-1.5 hover:text-blue-400 transition-all nodrag">
                            <Zap size={12} className="text-yellow-500" />
                            <span>{isPro ? 'Pro Engine' : 'Flash Engine'}</span>
                            <ChevronDown size={10} />
                        </button>
                        <select className="absolute inset-0 opacity-0 cursor-pointer nodrag" value={data.params?.model} onChange={(e) => data.onChange?.(id, { params: { ...data.params, model: e.target.value }})}>
                            <option value={GeneratorModel.GEMINI_FLASH_IMAGE}>Flash</option>
                            <option value={GeneratorModel.GEMINI_PRO_IMAGE}>Pro</option>
                        </select>
                    </div>

                    <div className="relative group/aspect">
                        <button className="flex items-center gap-1.5 hover:text-blue-400 transition-all nodrag">
                            <Ratio size={12} />
                            <span>{data.params?.aspectRatio || '16:9'}</span>
                        </button>
                        <select className="absolute inset-0 opacity-0 cursor-pointer nodrag" value={data.params?.aspectRatio || "16:9"} onChange={(e) => data.onChange?.(id, { params: { ...data.params, aspectRatio: e.target.value }})}>
                            <option value="1:1">1:1</option>
                            <option value="16:9">16:9</option>
                            <option value="9:16">9:16</option>
                            <option value="4:3">4:3</option>
                        </select>
                    </div>
                </div>

                <button 
                    onClick={() => data.onRun?.(id)}
                    disabled={isGenerating}
                    className={`h-11 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all nodrag shadow-xl font-black text-xs uppercase tracking-widest ${isGenerating ? 'bg-zinc-800 text-zinc-600' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40 hover:scale-105 active:scale-95'}`}
                >
                    {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <>Run Logic <ArrowUp size={16} /></>}
                </button>
            </div>
        </div>
      )}

      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !border-none !bg-zinc-700 hover:!bg-blue-500 transition-colors" />
      <Handle type="source" position={Position.Right} onClick={() => data.onAddNext?.(id)} className="!w-8 !h-8 !bg-white !border-none !flex !items-center !justify-center !rounded-full !shadow-2xl !opacity-0 group-hover/node:!opacity-100 !transition-all !-right-4 transition-transform hover:scale-110">
        <Plus size={16} className="text-black" />
      </Handle>
    </div>
  );
};

const InputTextNode = ({ data, selected, id }: NodeProps) => {
  return (
    <div className={`relative group/node ${CARD_BG} ${CARD_BORDER} border ${CARD_RADIUS} w-[300px] min-h-[160px] shadow-2xl transition-all duration-500 ${selected ? 'ring-2 ring-blue-500 scale-[1.02]' : CARD_HOVER_BORDER} flex flex-col overflow-hidden`}>
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <Type size={14} className="text-zinc-500" />
             <NodeTitle title={data.title} onChange={(val) => data.onChange?.(id, { title: val })} placeholder="Text Asset" />
          </div>
          <button onClick={() => data.onDelete?.(id)} className="text-zinc-700 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
      </div>
      <textarea
        className="w-full h-full flex-1 bg-transparent border-none text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:bg-white/5 p-5 rounded-b-[24px] resize-none nodrag leading-relaxed font-medium"
        placeholder="Enter raw text prompt components..."
        value={data.text || ''}
        onChange={(e) => data.onChange?.(id, { text: e.target.value })}
        onMouseDown={(e) => e.stopPropagation()}
      />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !border-none !bg-zinc-700 hover:!bg-blue-500" />
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
        <div className={`relative group/node ${CARD_BG} ${CARD_BORDER} border ${CARD_RADIUS} w-[280px] shadow-2xl transition-all duration-500 ${selected ? 'ring-2 ring-blue-500 scale-[1.02]' : CARD_HOVER_BORDER} overflow-hidden`}>
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <ImageIcon size={14} className="text-zinc-500" />
                   <NodeTitle title={data.title} onChange={(val) => data.onChange?.(id, { title: val })} placeholder="Image Asset" />
                </div>
                <button onClick={() => data.onDelete?.(id)} className="text-zinc-700 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
            </div>
            
            <div className="w-full aspect-square bg-zinc-950/40 relative group/image">
                {data.preview ? (
                    <>
                        <img src={data.preview} alt="Input" className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <label className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full cursor-pointer hover:scale-110 transition-transform">
                                <Upload size={18} />
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                             <button onClick={() => data.onChange?.(id, { image: undefined, preview: undefined })} className="w-10 h-10 flex items-center justify-center bg-red-500 text-white rounded-full hover:scale-110 transition-transform"><X size={18}/></button>
                         </div>
                    </>
                ) : (
                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-white/5 transition-all gap-4 text-zinc-700 hover:text-blue-500">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover/node:border-blue-500/20 group-hover/node:bg-blue-500/5 transition-all">
                            <CloudUpload size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Upload Source</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                )}
            </div>
            
            <Handle type="source" position={Position.Right} className="!w-3 !h-3 !border-none !bg-zinc-700" />
            <Handle type="target" position={Position.Left} className="!w-3 !h-3 !border-none !bg-zinc-700" />
        </div>
    )
}

export const nodeTypes = {
  [NodeType.GEN_IMAGE]: memo(GenImageNode),
  [NodeType.GROUP]: memo(GroupNode),
  [NodeType.INPUT_TEXT]: memo(InputTextNode),
  [NodeType.INPUT_IMAGE]: memo(InputImageNode),
  [NodeType.UPLOAD_IMAGE]: memo(InputImageNode),
};