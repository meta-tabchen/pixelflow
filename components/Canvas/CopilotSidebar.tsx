
import React, { useState, useRef, useEffect } from 'react';
import { X, MessageSquare, Send, Sparkles, Wand2, Loader2, Play } from 'lucide-react';
import { getAI } from '../../services/geminiService';
import { NodeType, GeneratorModel } from '../../types';
import { Type } from "@google/genai";

interface CopilotSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNodes: (nodes: any[], edges: any[]) => void;
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

const INSPIRATIONS = [
  "Cyberpunk street scene with neon lights",
  "Fantasy landscape with a floating castle",
  "Character sheet for a sci-fi warrior",
  "Create a text summary node",
  "Build a story workflow with 3 scenes"
];

export const CopilotSidebar: React.FC<CopilotSidebarProps> = ({ isOpen, onClose, onAddNodes }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Hi! I'm your PixelFlow Copilot. I can help you build workflows or generate ideas. Try asking me to 'Create a comic strip workflow'!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = getAI();
      
      const createWorkflowTool = {
          name: "create_workflow",
          description: "Generates a list of nodes and connections to build a visual workflow.",
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
        model: "gemini-3-flash-preview",
        config: {
            systemInstruction: "You are an expert AI Assistant for PixelFlow, a node-based generative AI tool. You can create workflows by using the `create_workflow` tool. When asked to build something, always try to call the tool. For general questions, just answer text. Available Node Types: GEN_IMAGE (Generates Image), GEN_TEXT (Generates Text), INPUT_TEXT (Raw Text Input).",
            tools: [{ functionDeclarations: [createWorkflowTool as any] }]
        }
      });

      // Send message using the correct object signature
      const response = await chat.sendMessage({ message: text });
      
      // Handle Tool Calls
      const functionCalls = response.functionCalls;
      
      if (functionCalls && functionCalls.length > 0) {
          let toolExecuted = false;
          for (const call of functionCalls) {
              if (call.name === 'create_workflow') {
                  const args = call.args as any;
                  if (args.nodes && Array.isArray(args.nodes)) {
                      onAddNodes(args.nodes, args.connections || []);
                      setMessages(prev => [...prev, { role: 'model', content: `Created workflow with ${args.nodes.length} nodes!` }]);
                      toolExecuted = true;
                  }
              }
          }
          if (!toolExecuted) {
             setMessages(prev => [...prev, { role: 'model', content: "I tried to create a workflow but something went wrong with the tool parameters." }]);
          }
      } else {
          setMessages(prev => [...prev, { role: 'model', content: response.text || "I processed that." }]);
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error. Please check your API key." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-0 bottom-0 w-[350px] bg-[#09090b] border-l border-white/10 z-[60] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-4 bg-white/5">
        <div className="flex items-center gap-2 text-zinc-200 font-bold">
            <Sparkles size={18} className="text-blue-400" />
            Copilot
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors">
            <X size={16} />
        </button>
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
                      {msg.content}
                  </div>
              </div>
          ))}
          {isLoading && (
              <div className="flex justify-start">
                  <div className="bg-zinc-800 p-3 rounded-2xl rounded-bl-none border border-white/5 flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-blue-400" />
                      <span className="text-xs text-zinc-500">Thinking...</span>
                  </div>
              </div>
          )}
      </div>

      {/* Inspirations */}
      <div className="p-4 pt-0">
          <div className="flex flex-wrap gap-2 mb-2">
              {INSPIRATIONS.map((insp, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleSend(insp)}
                    className="text-[10px] bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-blue-300 border border-white/5 px-2 py-1 rounded-full transition-colors truncate max-w-[150px]"
                  >
                    {insp}
                  </button>
              ))}
          </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5 bg-zinc-900/50">
          <div className="relative">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask to create a workflow..."
                className="w-full bg-black/50 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              />
              <button 
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
              >
                  <Send size={14} />
              </button>
          </div>
      </div>

    </div>
  );
};
