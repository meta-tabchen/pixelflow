
import React, { useState, useRef, useEffect } from 'react';
import { X, MessageSquare, Send, Sparkles, Wand2, Loader2, Play, ChevronDown, Zap, Cpu, Image as ImageIcon, Paperclip, Trash2, Workflow, MessageCircle, Ratio, Monitor, Save } from 'lucide-react';
import { getAI, fileToBase64 } from '../../services/geminiService';
import { NodeType, GeneratorModel } from '../../types';
import { Type, Content, Part } from "@google/genai";

interface CopilotSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNodes: (nodes: any[], edges: any[]) => void;
}

interface Message {
  role: 'user' | 'model';
  content: string;
  images?: string[]; // Input images (base64)
  isImageOutput?: boolean; // Output is an image
}

const INSPIRATIONS_CHAT = [
  "Explain how to use the Camera Director",
  "What is the difference between Flash and Pro?",
  "Analyze this image for me",
  "Give me a prompt for a sci-fi city"
];

const INSPIRATIONS_WORKFLOW = [
  "Create a basic text-to-image workflow",
  "Build a story generator with 3 scenes",
  "Create a workflow that summarizes text then generates an image",
  "Setup a character sheet workflow"
];

const COPILOT_MODELS = [
  { id: 'gemini-3-flash-preview', label: 'Flash Text', icon: Zap, desc: 'Fast Chat & Vision', mode: 'text' },
  { id: 'gemini-3-pro-preview', label: 'Pro Text', icon: Cpu, desc: 'Reasoning & Logic', mode: 'text' },
  { id: 'gemini-2.5-flash-image', label: 'Flash Image', icon: ImageIcon, desc: 'Fast Generation', mode: 'image' },
  { id: 'gemini-3-pro-image-preview', label: 'Pro Image', icon: Sparkles, desc: 'High Quality Gen', mode: 'image' },
];

const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4"];
const IMAGE_SIZES = ["1K", "2K", "4K"];

export const CopilotSidebar: React.FC<CopilotSidebarProps> = ({ isOpen, onClose, onAddNodes }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Hi! I'm your PixelFlow Copilot. Switch between 'Chat' for help & generation, or 'Workflow' to build node graphs." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(COPILOT_MODELS[0].id);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [mode, setMode] = useState<'chat' | 'workflow'>('chat');
  
  // Image Generation Settings
  const [imageSettings, setImageSettings] = useState({ aspectRatio: '1:1', imageSize: '1K' });

  // Attachments
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load History on Mount
  useEffect(() => {
    const saved = localStorage.getItem('pixelflow_copilot_history');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                setMessages(parsed);
            }
        } catch (e) {
            console.error("Failed to load history", e);
        }
    }
  }, []);

  // Auto-Save History
  useEffect(() => {
    if (messages.length > 0) {
        localStorage.setItem('pixelflow_copilot_history', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
      if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
      }
  }, [input]);

  // Handle Model Filtering based on Mode
  const activeModelId = mode === 'workflow' && COPILOT_MODELS.find(m => m.id === selectedModel)?.mode === 'image' 
      ? 'gemini-3-flash-preview' 
      : selectedModel;

  const activeModel = COPILOT_MODELS.find(m => m.id === activeModelId) || COPILOT_MODELS[0];
  const availableModels = mode === 'workflow' ? COPILOT_MODELS.filter(m => m.mode === 'text') : COPILOT_MODELS;

  const handleClearHistory = () => {
      if (confirm("Clear chat history?")) {
          setMessages([{ role: 'model', content: "Chat history cleared." }]);
          localStorage.removeItem('pixelflow_copilot_history');
      }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const newImages: string[] = [];
          for (let i = 0; i < e.target.files.length; i++) {
              try {
                  const base64 = await fileToBase64(e.target.files[i]);
                  newImages.push(base64);
              } catch (err) {
                  console.error("Failed to process image", err);
              }
          }
          setAttachedImages(prev => [...prev, ...newImages]);
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
      setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (text: string = input) => {
    if ((!text.trim() && attachedImages.length === 0) || isLoading) return;
    
    // 1. Add User Message
    const userMsg: Message = { 
        role: 'user', 
        content: text, 
        images: attachedImages.length > 0 ? [...attachedImages] : undefined 
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachedImages([]); 
    setIsLoading(true);
    
    // Reset height
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const ai = getAI();
      
      if (mode === 'workflow') {
          // --- WORKFLOW MODE ---
          const workflowModel = activeModel.mode === 'text' ? activeModel.id : 'gemini-3-flash-preview';

          const createWorkflowTool = {
              name: "create_workflow",
              description: "Generates a list of nodes and connections to build a visual workflow based on user description.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  nodes: {
                    type: Type.ARRAY,
                    description: "List of nodes to create",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        type: { type: Type.STRING, description: "Node Type: GEN_IMAGE, GEN_TEXT, INPUT_TEXT" },
                        prompt: { type: Type.STRING, description: "The text content/prompt for the node" },
                        label: { type: Type.STRING, description: "Short title for the node" }
                      }
                    }
                  },
                  connections: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        fromIndex: { type: Type.NUMBER, description: "Index of source node in the nodes array" },
                        toIndex: { type: Type.NUMBER, description: "Index of target node in the nodes array" }
                      }
                    }
                  }
                }
              }
          };

          const chat = ai.chats.create({
            model: workflowModel,
            config: {
                systemInstruction: "You are an AI Workflow Architect for PixelFlow. Your GOAL is to interpret the user's request and build a node-based workflow using the `create_workflow` tool. Do not just chat; build the workflow.",
                tools: [{ functionDeclarations: [createWorkflowTool as any] }]
            }
          });

          const response = await chat.sendMessage({ message: text });
          const functionCalls = response.functionCalls;
          
          if (functionCalls && functionCalls.length > 0) {
              let toolExecuted = false;
              for (const call of functionCalls) {
                  if (call.name === 'create_workflow') {
                      const args = call.args as any;
                      if (args.nodes && Array.isArray(args.nodes)) {
                          onAddNodes(args.nodes, args.connections || []);
                          setMessages(prev => [...prev, { role: 'model', content: `✅ I've built a workflow with ${args.nodes.length} nodes for you.` }]);
                          toolExecuted = true;
                      }
                  }
              }
              if (!toolExecuted) {
                 setMessages(prev => [...prev, { role: 'model', content: "I couldn't generate a valid workflow layout." }]);
              }
          } else {
              setMessages(prev => [...prev, { role: 'model', content: response.text || "Please describe the workflow you want me to build." }]);
          }

      } else {
          // --- CHAT MODE ---
          if (activeModel.mode === 'text') {
               // Text Chat / Vision
               const history: Content[] = messages.map(m => {
                  if (m.role === 'user') {
                      const parts: Part[] = [{ text: m.content || " " }];
                      if (m.images) {
                          m.images.forEach(img => {
                              parts.push({ inlineData: { mimeType: 'image/png', data: img } });
                          });
                      }
                      return { role: 'user', parts };
                  } else {
                      return { role: 'model', parts: [{ text: m.content || " " }] };
                  }
               });

               const chat = ai.chats.create({
                    model: activeModel.id,
                    history: history,
                    config: {
                        systemInstruction: "You are PixelFlow Copilot, a helpful AI assistant. You can answer questions about the app, general topics, or analyze images provided by the user. Keep answers concise.",
                    }
               });

               const currentParts: Part[] = [{ text: userMsg.content || " " }];
               if (userMsg.images) {
                   userMsg.images.forEach(img => {
                       currentParts.push({ inlineData: { mimeType: 'image/png', data: img } });
                   });
               }

               const response = await chat.sendMessage({ message: currentParts });
               setMessages(prev => [...prev, { role: 'model', content: response.text || "I processed that." }]);

          } else {
               // --- IMAGE GENERATION MODE ---
               const parts: any[] = [];
               
               // Multi-turn Logic: Use last generated image as reference if no new images attached
               let referenceImages = userMsg.images || [];
               
               if (referenceImages.length === 0) {
                   const lastModelMsg = [...messages].reverse().find(m => m.role === 'model' && m.isImageOutput && m.content);
                   if (lastModelMsg) {
                       referenceImages = [lastModelMsg.content];
                   }
               }
               
               if (referenceImages.length > 0) {
                    referenceImages.forEach(img => {
                        parts.push({ inlineData: { mimeType: 'image/png', data: img } });
                    });
               }

               parts.push({ text: userMsg.content });

               // Build Image Config
               const config: any = {
                   imageConfig: {
                       aspectRatio: imageSettings.aspectRatio
                   }
               };
               
               // Only add imageSize for Pro Image Model
               if (activeModel.id === 'gemini-3-pro-image-preview') {
                   config.imageConfig.imageSize = imageSettings.imageSize;
               }

               const response = await ai.models.generateContent({
                    model: activeModel.id,
                    contents: { parts },
                    config: config
               });
               
               let foundImage = null;
               if (response.candidates && response.candidates[0].content.parts) {
                    for (const part of response.candidates[0].content.parts) {
                        if (part.inlineData && part.inlineData.data) {
                            foundImage = part.inlineData.data;
                            break;
                        }
                    }
               }

               if (foundImage) {
                    setMessages(prev => [...prev, { role: 'model', content: foundImage, isImageOutput: true }]);
               } else {
                    setMessages(prev => [...prev, { role: 'model', content: response.text || "No image generated." }]);
               }
          }
      }

    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: `Error: ${error.message || "Something went wrong."}` }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
      }
  };

  if (!isOpen) return null;

  const activeInspirations = mode === 'workflow' ? INSPIRATIONS_WORKFLOW : INSPIRATIONS_CHAT;

  return (
    <div className="absolute right-0 top-0 bottom-0 w-[400px] bg-[#09090b] border-l border-white/10 z-[60] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
      
      {/* Header with Tabs */}
      <div className="flex flex-col border-b border-white/5 bg-white/5 relative shrink-0">
          <div className="h-14 flex items-center justify-between px-4">
            <div className="flex items-center gap-2 text-zinc-200 font-bold">
                <Sparkles size={18} className="text-blue-400" />
                Copilot
            </div>
            
            <div className="flex items-center gap-1">
                <button 
                    onClick={handleClearHistory} 
                    className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"
                    title="Clear History"
                >
                    <Trash2 size={16} />
                </button>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors">
                    <X size={16} />
                </button>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="px-4 pb-3 flex gap-2">
             <button 
                onClick={() => setMode('chat')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${mode === 'chat' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'}`}
             >
                <MessageCircle size={14} /> Chat
             </button>
             <button 
                onClick={() => setMode('workflow')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${mode === 'workflow' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'}`}
             >
                <Workflow size={14} /> Build Flow
             </button>
          </div>
      </div>
      
      {/* Model & Settings Area */}
      <div className="flex flex-col border-b border-white/5 bg-zinc-900/50">
          <div className="px-4 py-2 flex justify-end">
                 <div className="relative">
                    <button 
                        onClick={() => setShowModelMenu(!showModelMenu)}
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-zinc-800 border border-white/5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all min-w-[140px]"
                    >
                        <activeModel.icon size={12} className={activeModel.mode === 'image' ? 'text-purple-400' : 'text-amber-400'} />
                        <span className="truncate flex-1 text-left">{activeModel.label}</span>
                        <ChevronDown size={10} />
                    </button>

                    {showModelMenu && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col animate-in zoom-in-95 duration-100">
                            {availableModels.map(model => (
                                <button
                                    key={model.id}
                                    onClick={() => { setSelectedModel(model.id); setShowModelMenu(false); }}
                                    className={`flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-colors ${selectedModel === model.id ? 'bg-white/5' : ''}`}
                                >
                                    <model.icon size={14} className={model.mode === 'image' ? 'text-purple-400' : 'text-amber-400'} />
                                    <div>
                                        <div className="text-[11px] font-bold text-zinc-200">{model.label}</div>
                                        <div className="text-[9px] text-zinc-500">{model.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                    {showModelMenu && <div className="fixed inset-0 z-40" onClick={() => setShowModelMenu(false)} />}
                </div>
          </div>
          
          {/* Image Generation Toolbar (Only visible in Chat Mode with Image Model) */}
          {mode === 'chat' && activeModel.mode === 'image' && (
              <div className="px-4 pb-2 flex items-center gap-2 animate-in slide-in-from-top-1">
                  {/* Aspect Ratio */}
                  <div className="relative flex-1 group/ratio">
                      <div className="flex items-center gap-1.5 bg-zinc-800/50 border border-white/5 rounded-lg px-2 py-1 cursor-pointer hover:bg-zinc-800 hover:border-white/10 transition-colors h-7">
                          <Ratio size={12} className="text-zinc-500" />
                          <span className="text-[10px] font-bold text-zinc-300 flex-1">{imageSettings.aspectRatio}</span>
                          <ChevronDown size={10} className="text-zinc-600" />
                      </div>
                      <select 
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          value={imageSettings.aspectRatio}
                          onChange={(e) => setImageSettings(p => ({ ...p, aspectRatio: e.target.value }))}
                      >
                          {ASPECT_RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                  </div>

                  {/* Resolution (Only for Pro Image) */}
                  <div className={`relative flex-1 group/res ${activeModel.id !== 'gemini-3-pro-image-preview' ? 'opacity-50 pointer-events-none' : ''}`}>
                      <div className="flex items-center gap-1.5 bg-zinc-800/50 border border-white/5 rounded-lg px-2 py-1 cursor-pointer hover:bg-zinc-800 hover:border-white/10 transition-colors h-7">
                          <Monitor size={12} className={activeModel.id === 'gemini-3-pro-image-preview' ? "text-purple-400" : "text-zinc-600"} />
                          <span className="text-[10px] font-bold text-zinc-300 flex-1">{imageSettings.imageSize}</span>
                          <ChevronDown size={10} className="text-zinc-600" />
                      </div>
                       <select 
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          value={imageSettings.imageSize}
                          onChange={(e) => setImageSettings(p => ({ ...p, imageSize: e.target.value }))}
                          disabled={activeModel.id !== 'gemini-3-pro-image-preview'}
                      >
                          {IMAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                  </div>
              </div>
          )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
          {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-zinc-800 text-zinc-300 rounded-bl-none border border-white/5'
                  }`}>
                      {/* Images in Message */}
                      {msg.images && msg.images.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                              {msg.images.map((img, i) => (
                                  <img key={i} src={`data:image/png;base64,${img}`} className="w-16 h-16 object-cover rounded-lg border border-white/10" alt="attachment" />
                              ))}
                          </div>
                      )}

                      {/* Content */}
                      {msg.isImageOutput ? (
                          <div className="rounded-lg overflow-hidden border border-white/10 bg-black/50 group relative">
                             <img src={`data:image/png;base64,${msg.content}`} className="w-full h-auto" alt="Generated" />
                             <a 
                                href={`data:image/png;base64,${msg.content}`} 
                                download={`copilot-gen-${Date.now()}.png`}
                                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600"
                                title="Download"
                             >
                                 <Save size={14} />
                             </a>
                          </div>
                      ) : (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                      )}
                  </div>
              </div>
          ))}
          {isLoading && (
              <div className="flex justify-start">
                  <div className="bg-zinc-800 p-3 rounded-2xl rounded-bl-none border border-white/5 flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-blue-400" />
                      <span className="text-xs text-zinc-500">{mode === 'workflow' ? 'Building workflow...' : 'Thinking...'}</span>
                  </div>
              </div>
          )}
      </div>

      {/* Inspirations */}
      {messages.length < 3 && (
        <div className="p-4 pt-0 shrink-0">
            <div className="flex flex-wrap gap-2">
                {activeInspirations.map((insp, i) => (
                    <button 
                        key={i} 
                        onClick={() => handleSend(insp)}
                        className="text-[10px] bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-blue-300 border border-white/5 px-2 py-1 rounded-full transition-colors truncate max-w-full"
                    >
                        {insp}
                    </button>
                ))}
            </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-white/5 bg-zinc-900/50 shrink-0">
          {/* Attachment Previews */}
          {attachedImages.length > 0 && (
              <div className="flex gap-2 mb-2 overflow-x-auto pb-1 scrollbar-hide">
                  {attachedImages.map((img, idx) => (
                      <div key={idx} className="relative group shrink-0">
                          <img src={`data:image/png;base64,${img}`} className="w-12 h-12 object-cover rounded-md border border-white/10" />
                          <button 
                             onClick={() => removeAttachment(idx)}
                             className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          >
                             <X size={10} />
                          </button>
                      </div>
                  ))}
              </div>
          )}

          <div className="relative flex items-end gap-2">
              <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  multiple 
                  onChange={handleFileSelect} 
              />
              
              <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-zinc-800 text-zinc-400 rounded-xl hover:bg-zinc-700 hover:text-white transition-colors border border-white/5 mb-[1px]"
                  title="Attach Images"
              >
                  <Paperclip size={18} />
              </button>

              <div className="relative flex-1">
                  <textarea 
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={mode === 'workflow' ? "Describe the workflow to build..." : (activeModel.mode === 'image' ? "Describe image..." : "Ask Copilot...")}
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none min-h-[44px] max-h-[120px] custom-scrollbar"
                    rows={1}
                  />
                  <button 
                    onClick={() => handleSend()}
                    disabled={(!input.trim() && attachedImages.length === 0) || isLoading}
                    className="absolute right-2 bottom-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
                  >
                      <Send size={14} />
                  </button>
              </div>
          </div>
          <div className="text-[10px] text-zinc-500 mt-2 text-center flex items-center justify-center gap-1">
             <span className={`w-1.5 h-1.5 rounded-full ${mode === 'workflow' ? 'bg-indigo-500' : 'bg-blue-500'}`}></span>
             <span>{mode === 'workflow' ? 'Workflow Architect Mode' : 'Conversation Mode'}</span>
          </div>
      </div>

    </div>
  );
};
