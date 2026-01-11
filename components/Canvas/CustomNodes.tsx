import React, { useRef, memo, useState, useEffect, useMemo } from 'react';
import { Handle, Position, NodeProps, useUpdateNodeInternals, NodeToolbar } from 'reactflow';
import { Node, NodeType, GeneratorModel } from '../../types';
import { X, Play, Image as ImageIcon, Type, Settings, Maximize2, Loader2, Sparkles, Upload, Video, Layers, Film, Plus, Wand2, ChevronDown, Maximize, Ratio, ArrowUp, Download, Zap, Camera, ScanLine, Pencil, Trash2, CloudUpload, BoxSelect, FolderPlus, Ungroup, LayoutGrid, Circle, Workflow, Aperture, User, ArrowRight, ArrowLeft, RotateCcw, Clock, Move, ZoomIn, Eye, ArrowDown, ScanFace, Mountain, Monitor, LocateFixed, Activity, Target, Contact, ScanEye, Plane, Footprints, Users, Glasses, Smartphone, Vibrate, ArrowUpDown, ArrowLeftRight, AlertCircle, ChevronsUpDown } from 'lucide-react';
import { optimizePrompt } from '../../services/geminiService';

// --- Shared Styles ---
const CARD_BG = "bg-[#18181b]"; // Zinc 950
const CARD_BORDER = "border-zinc-800/80";
const CARD_HOVER_BORDER = "hover:border-zinc-700";
const CARD_RADIUS = "rounded-[20px]";

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
                    e.stopPropagation(); // Stop ReactFlow events like Backspace deleting the node
                    if(e.key === 'Enter') handleCommit(); 
                }}
                className="bg-zinc-900 text-zinc-200 text-xs font-bold px-1.5 py-0.5 rounded border border-blue-500 outline-none w-32 min-w-[80px] nodrag"
                onMouseDown={e => e.stopPropagation()}
            />
        )
    }

    return (
        <div 
            className="flex items-center gap-2 group/title cursor-text min-w-[60px] nodrag" 
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            title="Click to rename"
        >
             <span className="text-xs font-bold text-zinc-400 group-hover/title:text-zinc-200 transition-colors truncate max-w-[150px]">
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
        offset={10} 
        className="flex items-center justify-center pointer-events-none" 
      >
         <div className="flex items-center bg-[#27272a] border border-zinc-700 p-1.5 rounded-full shadow-2xl backdrop-blur-md animate-in zoom-in-95 duration-200 pointer-events-auto whitespace-nowrap">
            {/* Left Icons */}
            <div className="flex items-center gap-2 pl-2 pr-2">
                <div className="w-4 h-4 rounded-full bg-zinc-100 flex items-center justify-center">
                    <Circle size={10} className="fill-black text-black" />
                </div>
                <NodeTitle title={data.label} onChange={(val) => data.onChange?.(id, { label: val })} placeholder="Group" />
            </div>

            <div className="w-px h-5 bg-zinc-700 mx-2" />

            <button 
              onClick={() => data.onRunGroup?.(id)}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-700 rounded-full text-zinc-300 hover:text-white transition-colors text-xs font-medium"
            >
               <Play size={14} className="fill-current" />
               整组执行
            </button>
            
            <button 
              onClick={() => data.onCreateWorkflow?.(id)}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-700 rounded-full text-zinc-300 hover:text-white transition-colors text-xs font-medium"
            >
               <Workflow size={14} />
               创建工作流
            </button>
            
            <button 
              onClick={() => data.onUngroup?.(id)}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-700 hover:bg-red-900/20 rounded-full text-zinc-300 hover:text-red-400 transition-colors text-xs font-medium"
            >
               <Ungroup size={14} />
               解组
            </button>
         </div>
      </NodeToolbar>

      <div className={`w-full h-full rounded-3xl transition-all duration-300 relative group/group ${selected ? 'border-2 border-zinc-600 bg-zinc-900/40' : 'border-2 border-dashed border-zinc-800 bg-zinc-900/10'}`}>
        <div className="absolute -top-10 left-0 px-2 py-1 opacity-0 group-hover/group:opacity-100 transition-opacity pointer-events-none">
          <span className="text-xs font-bold tracking-wide text-zinc-500 uppercase">
            {data.label || 'Node Group'}
          </span>
        </div>
        
        {/* Resize Handle placeholder */}
        <div className="absolute bottom-2 right-2 p-1 opacity-0 group-hover/group:opacity-100 transition-opacity">
           <ScanLine className="text-zinc-600 w-4 h-4 rotate-90" />
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
  
  // Collapse State
  const [isCollapsed, setIsCollapsed] = useState(!!data.result);
  
  // Track generation completion to auto-collapse
  const prevGenerating = useRef(false);
  useEffect(() => {
      if (prevGenerating.current && !isGenerating && hasResult) {
          setIsCollapsed(true);
      }
      prevGenerating.current = !!isGenerating;
  }, [isGenerating, hasResult]);

  // Camera Panel State
  const [showCameraPanel, setShowCameraPanel] = useState(false);
  
  // Derived Camera State from Prop String
  const currentCameraStr = data.params?.camera || "";
  
  const activeFraming = useMemo(() => 
      CAMERA_OPTS.framing.find(opt => currentCameraStr.includes(opt.value))?.value
  , [currentCameraStr]);
  
  const activeAngle = useMemo(() => 
      CAMERA_OPTS.angle.find(opt => currentCameraStr.includes(opt.value))?.value
  , [currentCameraStr]);

  const activeMotion = useMemo(() => 
      CAMERA_OPTS.motion.find(opt => currentCameraStr.includes(opt.value))?.value
  , [currentCameraStr]);

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

  // Slash Command State
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
      const newText = currentText.endsWith("/") 
          ? currentText.slice(0, -1) + cmd.value 
          : currentText + " " + cmd.value;
      
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

  // Close menus if clicked outside
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
      // Only toggle if we have a result and we are not in loading/error state (though error state might want expansion)
      if (hasResult) {
          setIsCollapsed(!isCollapsed);
      }
  };

  return (
    <div className={`relative group/node ${CARD_BG} ${CARD_BORDER} border ${CARD_RADIUS} w-[380px] shadow-2xl transition-all duration-300 ${selected ? 'ring-1 ring-blue-500/30 border-blue-500/50' : CARD_HOVER_BORDER}`}>
      
      {/* 1. Header with Rename */}
      <div className="absolute -top-8 left-0 flex items-center gap-2 px-1">
          {isGenerating ? <Loader2 size={12} className="animate-spin text-blue-500"/> : <ImageIcon size={12} className="text-zinc-500"/>}
          <NodeTitle title={data.title} onChange={(val) => data.onChange?.(id, { title: val })} placeholder="Generation" />
      </div>

      {/* 2. Image Result Area */}
      {(hasResult || isGenerating || hasError) && (
        <div 
            className={`relative w-full border-b ${isCollapsed ? 'border-transparent' : 'border-zinc-800/50'} bg-black/20 ${isGenerating || hasError ? 'aspect-video' : ''} first:rounded-t-[20px] ${isCollapsed ? 'rounded-b-[20px]' : ''} overflow-hidden cursor-pointer`}
            onClick={toggleCollapse}
        >
           {isGenerating ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-3">
               <div className="relative">
                 <div className="w-10 h-10 rounded-full border-2 border-zinc-800 border-t-blue-500 animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles size={14} className="text-blue-500/50 animate-pulse" />
                 </div>
               </div>
               <span className="text-[10px] font-medium tracking-wide animate-pulse">GENERATING...</span>
             </div>
           ) : hasError ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 gap-2 p-4 text-center cursor-default" onClick={e => e.stopPropagation()}>
                 <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <AlertCircle size={20} />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-wider">Failed</span>
                    <span className="text-[10px] text-zinc-500 mt-1">{data.error}</span>
                 </div>
                 <button 
                    onClick={() => data.onRun?.(id)}
                    className="mt-2 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-full text-[10px] text-zinc-300 transition-colors"
                 >
                    Retry
                 </button>
                 <button onClick={() => data.onChange?.(id, { error: undefined })} className="absolute top-2 right-2 text-zinc-600 hover:text-white"><X size={12}/></button>
             </div>
           ) : (
             <div className="relative w-full group/image">
               <img src={data.result} alt="Generated" className="w-full h-auto block" />
               
               {/* Overlay for Action Buttons */}
               <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <button 
                    onClick={(e) => { e.stopPropagation(); data.onEdit?.(id, data.result!); }}
                    className="w-7 h-7 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md border border-white/10 transition-all pointer-events-auto hover:scale-105 active:scale-95 nodrag"
                    title="Edit / Annotate"
                  >
                    <Pencil size={12} />
                  </button>
                  <a 
                    href={data.result} 
                    download={`aether-${Date.now()}.png`} 
                    onClick={(e) => e.stopPropagation()}
                    className="w-7 h-7 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md border border-white/10 transition-all pointer-events-auto hover:scale-105 active:scale-95 nodrag"
                  >
                    <Download size={12} />
                  </a>
                  <button 
                    onClick={(e) => { e.stopPropagation(); data.onChange?.(id, { result: undefined }); }}
                    className="w-7 h-7 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md border border-white/10 transition-all pointer-events-auto hover:scale-105 active:scale-95 nodrag"
                  >
                    <X size={12} />
                  </button>
               </div>

               {/* Hint to expand */}
               {isCollapsed && (
                   <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 opacity-0 group-hover/image:opacity-100 transition-opacity pointer-events-none">
                        <ChevronsUpDown size={12} className="text-zinc-300" />
                        <span className="text-[10px] font-medium text-zinc-300">Edit Prompt</span>
                   </div>
               )}
             </div>
           )}
        </div>
      )}

      {/* 3. Control Area */}
      {!isCollapsed && (
        <div className="flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Top Controls: Style / Camera / Delete */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 bg-[#27272a] hover:bg-[#3f3f46] px-2.5 py-1 rounded-lg text-[10px] font-medium text-zinc-300 transition-colors nodrag">
                    <Plus size={10} />
                    <span>Style</span>
                </button>
                
                {/* Camera Button */}
                <div className="relative" onMouseDown={e => e.stopPropagation()}>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowCameraPanel(!showCameraPanel);
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors nodrag ${showCameraPanel || activeCount > 0 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-[#27272a] hover:bg-[#3f3f46] text-zinc-300'}`}
                        title="Open Camera Director"
                    >
                        <Camera size={12} />
                        <span>{activeCount > 0 ? `${activeCount} Active` : 'Camera'}</span>
                    </button>

                    {/* Camera Director Panel */}
                    {showCameraPanel && (
                        <div 
                            className="absolute top-8 left-0 z-[100] w-[340px] max-h-[500px] overflow-y-auto custom-scrollbar bg-[#18181b] border border-zinc-700 rounded-xl shadow-2xl p-4 animate-in slide-in-from-top-2 fade-in duration-200 flex flex-col gap-4 cursor-default pointer-events-auto" 
                            onMouseDown={e => e.stopPropagation()}
                            onClick={e => e.stopPropagation()} // Stop bubbling to prevent window click listener from closing panel
                        >
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                                <span className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                                    <Aperture size={14} className="text-blue-500" />
                                    Camera Director
                                </span>
                                <button onClick={() => {
                                    data.onChange?.(id, { params: { ...data.params, camera: undefined }});
                                }} className="text-[10px] text-zinc-500 hover:text-white transition-colors">Reset</button>
                            </div>

                            {/* Framing Section */}
                            <div className="space-y-2">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Framing (景别)</span>
                                <div className="grid grid-cols-3 gap-2">
                                    {CAMERA_OPTS.framing.map((opt) => (
                                        <button 
                                            key={opt.id}
                                            onClick={() => updateCameraParam('framing', opt.value)}
                                            className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all gap-1 h-16 group/opt ${activeFraming === opt.value ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'}`}
                                            title={opt.desc}
                                        >
                                            <opt.icon size={16} className={activeFraming === opt.value ? 'text-white' : 'text-zinc-500 group-hover/opt:text-zinc-300'} />
                                            <span className="text-[9px] font-medium leading-tight text-center">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Angle Section */}
                            <div className="space-y-2">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Angle (角度)</span>
                                <div className="grid grid-cols-3 gap-2">
                                    {CAMERA_OPTS.angle.map((opt) => (
                                        <button 
                                            key={opt.id}
                                            onClick={() => updateCameraParam('angle', opt.value)}
                                            className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all gap-1 h-14 group/opt ${activeAngle === opt.value ? 'bg-purple-600 border-purple-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'}`}
                                            title={opt.desc}
                                        >
                                            <opt.icon size={14} className={activeAngle === opt.value ? 'text-white' : 'text-zinc-500 group-hover/opt:text-zinc-300'} />
                                            <span className="text-[9px] font-medium leading-tight text-center">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Motion Section */}
                            <div className="space-y-2">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Motion (运镜)</span>
                                <div className="grid grid-cols-3 gap-2">
                                    {CAMERA_OPTS.motion.map((opt) => (
                                        <button 
                                            key={opt.id}
                                            onClick={() => updateCameraParam('motion', opt.value)}
                                            className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all gap-1 h-14 group/opt ${activeMotion === opt.value ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'}`}
                                            title={opt.desc}
                                        >
                                            <opt.icon size={14} className={activeMotion === opt.value ? 'text-white' : 'text-zinc-500 group-hover/opt:text-zinc-300'} />
                                            <span className="text-[9px] font-medium leading-tight text-center">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <button 
                    onClick={handleMagicOptimize}
                    disabled={isOptimizing}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors nodrag ${isOptimizing ? 'bg-blue-500/20 text-blue-400' : 'bg-[#27272a] hover:bg-[#3f3f46] text-zinc-300'}`}
                    title="Magic Optimize (Ctrl+1)"
                >
                    {isOptimizing ? <Loader2 size={12} className="animate-spin"/> : <Wand2 size={12} />}
                </button>
            </div>
            
            <button 
                onClick={() => data.onDelete?.(id)}
                className="text-zinc-600 hover:text-red-500 transition-colors nodrag"
                title="Delete Node"
            >
                <Trash2 size={14} />
            </button>
            </div>
            
            {/* Prompt Text Area - Full Width */}
            <div className="relative bg-black/20 border-y border-white/5">
                <textarea
                    className="w-full h-24 bg-transparent border-none text-sm text-zinc-200 placeholder-zinc-600 resize-y focus:outline-none focus:ring-0 leading-relaxed font-light nodrag p-3"
                    placeholder="输入描述或按 &quot;/&quot; 呼出指令（Enter 发送，Shift+Enter 换行，Ctrl+1 魔法选择）"
                    value={data.text || ''}
                    onChange={(e) => data.onChange?.(id, { text: e.target.value })}
                    onKeyDown={handleKeyDown}
                    onMouseDown={(e) => e.stopPropagation()} 
                />
            
                {/* Slash Command Menu */}
                {showCommands && (
                    <div className="absolute bottom-full left-0 w-full mb-2 bg-[#1e1e1e] border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-[100] animate-in zoom-in-95 fade-in slide-in-from-bottom-2 duration-200" onMouseDown={e => e.stopPropagation()}>
                    <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-900/50">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">快捷指令 (Slash Commands)</span>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                        {SLASH_COMMANDS.map((cmd, index) => (
                            <button
                                key={cmd.id}
                                className={`w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors ${index === commandIndex ? 'bg-blue-600/20 border-l-2 border-blue-500' : 'hover:bg-zinc-800/50 border-l-2 border-transparent'}`}
                                onClick={() => handleCommandSelect(cmd)}
                                onMouseEnter={() => setCommandIndex(index)}
                            >
                                <div className={`mt-0.5 p-1 rounded-md ${index === commandIndex ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                                    <cmd.icon size={14} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs font-bold ${index === commandIndex ? 'text-blue-200' : 'text-zinc-200'}`}>{cmd.label}</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">{cmd.desc}</p>
                                </div>
                                {index === commandIndex && (
                                    <div className="self-center">
                                        <span className="text-[9px] bg-white/10 text-zinc-300 px-1.5 py-0.5 rounded">Enter</span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                    </div>
                )}
            </div>

            {/* Bottom Controls: Model / Ratio / Generate */}
            <div className="flex items-center justify-between px-4 pb-4 pt-2">
            <div className="flex items-center gap-3 text-[10px] font-medium text-zinc-400">
                {/* Model Selector */}
                <div className="relative group/model">
                    <button className="flex items-center gap-1 hover:text-zinc-200 transition-colors nodrag">
                        <span className="text-yellow-500">⚡</span>
                        <span>{isPro ? 'Pro' : 'Flash'}</span>
                        <ChevronDown size={10} className="opacity-50" />
                    </button>
                    <select 
                    className="absolute inset-0 opacity-0 cursor-pointer nodrag"
                    value={data.params?.model || GeneratorModel.GEMINI_FLASH_IMAGE}
                    onChange={(e) => data.onChange?.(id, { params: { ...data.params, model: e.target.value }})}
                    >
                    <option value={GeneratorModel.GEMINI_FLASH_IMAGE}>Flash</option>
                    <option value={GeneratorModel.GEMINI_PRO_IMAGE}>Pro</option>
                    </select>
                </div>

                {/* Aspect Ratio Selector */}
                <div className="relative group/aspect">
                    <button className="flex items-center gap-1 hover:text-zinc-200 transition-colors nodrag">
                        <ScanLine size={12} />
                        <span>{data.params?.aspectRatio || '16:9'}</span>
                    </button>
                    <select 
                    className="absolute inset-0 opacity-0 cursor-pointer nodrag"
                    value={data.params?.aspectRatio || "16:9"}
                    onChange={(e) => data.onChange?.(id, { params: { ...data.params, aspectRatio: e.target.value }})}
                    >
                    <option value="1:1">1:1</option>
                    <option value="16:9">16:9</option>
                    <option value="9:16">9:16</option>
                    <option value="4:3">4:3</option>
                    <option value="3:4">3:4</option>
                    </select>
                </div>

                {/* Resolution Selector (1K, 2K, 4K) */}
                <div className="relative group/res">
                        <button className="flex items-center gap-1 hover:text-zinc-200 transition-colors nodrag" title="Output Resolution">
                            <Maximize size={12} />
                            <span>{data.params?.imageSize || '1K'}</span>
                        </button>
                        <select 
                            className="absolute inset-0 opacity-0 cursor-pointer nodrag"
                            value={data.params?.imageSize || "1K"}
                            onChange={(e) => data.onChange?.(id, { params: { ...data.params, imageSize: e.target.value }})}
                        >
                            <option value="1K">1K</option>
                            <option value="2K">2K</option>
                            <option value="4K">4K</option>
                        </select>
                    </div>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-zinc-500 text-[10px] font-mono">1x</span>
                <div className="flex items-center bg-[#27272a] rounded-full p-0.5 pl-2 gap-1.5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-0.5 text-[9px] font-bold text-zinc-400">
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-700 flex items-center justify-center">
                            <Zap size={6} className="text-zinc-400" />
                        </div>
                        15
                    </div>
                    <button 
                        onClick={() => data.onRun?.(id)}
                        disabled={isGenerating}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all nodrag shadow-lg ${isGenerating ? 'bg-zinc-700 text-zinc-500' : 'bg-zinc-200 hover:bg-white text-black'}`}
                    >
                        {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <ArrowUp size={14} />}
                    </button>
                </div>
            </div>
            </div>
        </div>
      )}

      <Handle type="target" position={Position.Left} className="!bg-[#27272a] !border-zinc-600 !w-3 !h-3 !-left-1.5 transition-all hover:!bg-blue-500 hover:!border-blue-400" />
      <Handle 
        type="source" 
        position={Position.Right} 
        onClick={(e) => { data.onAddNext?.(id); }}
        className="!w-8 !h-8 !bg-[#18181b] !border-zinc-700 hover:!border-blue-500 hover:!text-blue-400 !text-zinc-500 !flex !items-center !justify-center !rounded-full !absolute !-right-4 !top-1/2 !-translate-y-1/2 z-50 shadow-xl transition-all opacity-0 group-hover/node:opacity-100"
      >
        <Plus size={16} className="pointer-events-none" />
      </Handle>
    </div>
  );
};

// --- Input Text Node ---
const InputTextNode = ({ data, selected, id }: NodeProps) => {
  return (
    <div className={`relative group/node ${CARD_BG} ${CARD_BORDER} border ${CARD_RADIUS} w-[280px] min-h-[160px] shadow-2xl transition-all duration-300 ${selected ? 'ring-1 ring-blue-500/30 border-blue-500/50' : CARD_HOVER_BORDER} flex flex-col`}>
      <div className="absolute -top-8 left-0 flex items-center gap-2 px-1">
          <Type size={12} className="text-zinc-500"/>
          <NodeTitle title={data.title} onChange={(val) => data.onChange?.(id, { title: val })} placeholder="Text Input" />
      </div>
      <textarea
        className="w-full h-full flex-1 bg-transparent border-none text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:bg-zinc-900/50 p-4 rounded-[20px] resize-none nodrag leading-relaxed"
        placeholder="Enter text..."
        value={data.text || ''}
        onChange={(e) => data.onChange?.(id, { text: e.target.value })}
        onMouseDown={(e) => e.stopPropagation()}
      />
      <Handle type="source" position={Position.Right} className="!bg-[#27272a] !border-zinc-600 !w-3 !h-3 !-right-1.5 transition-all hover:!bg-blue-500 hover:!border-blue-400" />
    </div>
  );
};

// --- Input/Upload Image Node ---
const InputImageNode = ({ data, selected, id }: NodeProps) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                // data.image stores base64 without prefix for API usually, but let's stick to what geminiService expects.
                // geminiService fileToBase64 returns base64 string without prefix.
                // data.preview stores full data url.
                const base64 = result.split(',')[1];
                data.onChange?.(id, { image: base64, preview: result });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className={`relative group/node ${CARD_BG} ${CARD_BORDER} border ${CARD_RADIUS} w-[280px] shadow-2xl transition-all duration-300 ${selected ? 'ring-1 ring-blue-500/30 border-blue-500/50' : CARD_HOVER_BORDER}`}>
             <div className="absolute -top-8 left-0 flex items-center gap-2 px-1">
                <Upload size={12} className="text-zinc-500"/>
                <NodeTitle title={data.title} onChange={(val) => data.onChange?.(id, { title: val })} placeholder="Image Input" />
            </div>
            
            <div className="w-full aspect-square bg-zinc-900/20 rounded-[20px] overflow-hidden relative group/image">
                {data.preview ? (
                    <>
                        <img src={data.preview} alt="Input" className="w-full h-full object-cover" />
                         <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/image:opacity-100 transition-opacity">
                             {/* Allow re-upload */}
                            <label className="w-7 h-7 flex items-center justify-center bg-black/60 text-white rounded-full cursor-pointer hover:bg-black/80 backdrop-blur-md border border-white/10">
                                <Upload size={12} />
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                             <button onClick={() => data.onChange?.(id, { image: undefined, preview: undefined })} className="w-7 h-7 flex items-center justify-center bg-black/60 text-white rounded-full hover:bg-black/80 backdrop-blur-md border border-white/10"><X size={12}/></button>
                         </div>
                    </>
                ) : (
                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-zinc-800/50 transition-colors gap-2 text-zinc-600 hover:text-zinc-400">
                        <CloudUpload size={24} />
                        <span className="text-xs font-medium">Upload Image</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                )}
            </div>
            
            <Handle type="source" position={Position.Right} className="!bg-[#27272a] !border-zinc-600 !w-3 !h-3 !-right-1.5 transition-all hover:!bg-blue-500 hover:!border-blue-400" />
            {/* Target handle allowing this node to receive image from another node (e.g. for simple pass-through or holding) */}
            <Handle type="target" position={Position.Left} className="!bg-[#27272a] !border-zinc-600 !w-3 !h-3 !-left-1.5 transition-all hover:!bg-blue-500 hover:!border-blue-400" />
        </div>
    )
}


export const nodeTypes = {
  [NodeType.GEN_IMAGE]: memo(GenImageNode),
  [NodeType.GROUP]: memo(GroupNode),
  [NodeType.INPUT_TEXT]: memo(InputTextNode),
  [NodeType.INPUT_IMAGE]: memo(InputImageNode),
  [NodeType.UPLOAD_IMAGE]: memo(InputImageNode), // Reusing same component for now
};