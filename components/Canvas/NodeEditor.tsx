
import React, { useCallback, useState, useEffect, useRef } from 'react';
import ReactFlow, { 
  Background, 
  MiniMap, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Connection, 
  Edge,
  Node,
  BackgroundVariant,
  getNodesBounds, // Updated from getRectOfNodes
  SelectionMode,
  ReactFlowProvider,
  useReactFlow,
  OnSelectionChangeParams,
  ReactFlowInstance,
  NodeMouseHandler,
  useViewport,
  Panel,
  Controls,
  OnConnectStart,
  OnConnectEnd
} from 'reactflow';
import dagre from 'dagre';
import { NodeType, GeneratorModel, HistoryItem, ProjectMeta, WorkflowTemplate, NodeData } from '../../types';
import { nodeTypes } from './CustomNodes';
import { DeletableEdge } from './CustomEdges';
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Type, 
  X,
  BoxSelect,
  Grid,
  Pencil,
  Save,
  Maximize,
  ArrowLeft,
  Sparkles,
  Workflow,
  MessageSquareText,
  Play,
  Ungroup,
  Globe,
  Copy,
  LayoutGrid,
  History,
  LayoutTemplate,
  AlignStartVertical,
  Wand
} from 'lucide-react';
import { generateImageContent, generateTextContent, generateSearchContent, isKeyRequired } from '../../services/geminiService';
import { ImageEditor } from './ImageEditor';
import { WorkflowModal } from './WorkflowModal';
import { CopilotSidebar } from './CopilotSidebar';
import { saveProjectData, loadProjectData, addToHistory, addBatchToHistory, getHistory, getProjects, updateProjectName, saveWorkflowTemplate, getWorkflowTemplates, deleteWorkflowTemplate } from '../../services/storageService';

const edgeTypes = {
  deletable: DeletableEdge,
};

// --- Auto Layout Logic ---
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Average node size (Generator Nodes are wider, Inputs are smaller, we take a safe max)
  const nodeWidth = 420;
  const nodeHeight = 500;

  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: 50, // Vertical spacing between nodes in same rank
    ranksep: 150  // Horizontal spacing between ranks
  });

  nodes.forEach((node) => {
    // Determine dimensions based on type if possible, otherwise default
    let width = nodeWidth;
    let height = nodeHeight;
    
    if (node.type === NodeType.INPUT_TEXT || node.type === NodeType.INPUT_IMAGE) {
        width = 250;
        height = 300;
    }

    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches React Flow's anchor point (top left).
      position: {
        x: nodeWithPosition.x - (nodeWidth / 2),
        y: nodeWithPosition.y - (nodeHeight / 2),
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

// --- Context Menu Component ---
const ContextMenu = ({ 
  x, 
  y, 
  onClose, 
  onAddNode,
  onAutoLayout
}: { 
  x: number, 
  y: number, 
  onClose: () => void, 
  onAddNode: (type: NodeType) => void,
  onAutoLayout: () => void
}) => {
  useEffect(() => {
    const handleClick = () => onClose();
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [onClose]);

  const menuItems = [
    { label: 'Image Gen', type: NodeType.GEN_IMAGE, icon: Sparkles, color: 'text-blue-400' },
    { label: 'Text Gen', type: NodeType.GEN_TEXT, icon: MessageSquareText, color: 'text-amber-400' },
    { label: 'Web Search', type: NodeType.GEN_SEARCH, icon: Globe, color: 'text-emerald-400' },
    { type: 'divider' },
    { label: 'Input Text', type: NodeType.INPUT_TEXT, icon: Type, color: 'text-zinc-400' },
    { label: 'Input Image', type: NodeType.INPUT_IMAGE, icon: ImageIcon, color: 'text-purple-400' },
    { label: 'Group', type: NodeType.GROUP, icon: LayoutGrid, color: 'text-zinc-500' },
  ];

  return (
    <div 
      className="absolute z-[100] bg-[#18181b] border border-white/10 rounded-xl shadow-2xl p-1.5 min-w-[180px] animate-in zoom-in-95 duration-100 origin-top-left overflow-hidden backdrop-blur-md"
      style={{ top: y, left: x }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="px-2 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 mb-1">
        Tools
      </div>
      <button
        onClick={onAutoLayout}
        className="flex items-center gap-3 px-2 py-2 text-sm text-zinc-300 hover:bg-white/10 hover:text-white rounded-lg transition-colors text-left group w-full mb-1"
      >
        <AlignStartVertical size={14} className="text-zinc-400 group-hover:text-white" />
        <span className="font-medium">Auto Layout</span>
      </button>

      <div className="px-2 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 mb-1">
        Add Node
      </div>
      <div className="flex flex-col gap-0.5">
        {menuItems.map((item, idx) => (
          item.type === 'divider' ? (
             <div key={idx} className="h-px bg-white/5 my-1" />
          ) : (
             <button
                key={idx}
                onClick={() => onAddNode(item.type as NodeType)}
                className="flex items-center gap-3 px-2 py-2 text-sm text-zinc-300 hover:bg-white/10 hover:text-white rounded-lg transition-colors text-left group"
             >
                <item.icon size={14} className={item.color} />
                <span className="font-medium">{item.label}</span>
             </button>
          )
        ))}
      </div>
    </div>
  );
};

// --- Editor Sidebar Panel ---
const EditorSidebar = ({ 
    activeTab, 
    onClose, 
    onAddNode, 
    onImportWorkflow 
}: { 
    activeTab: string | null, 
    onClose: () => void, 
    onAddNode: (type: NodeType) => void,
    onImportWorkflow: (wf: WorkflowTemplate) => void
}) => {
    const [items, setItems] = useState<any[]>([]);
    
    useEffect(() => {
        if (activeTab === 'history') {
            getHistory().then(setItems);
        } else if (activeTab === 'workflows') {
            getWorkflowTemplates().then(setItems);
        } else {
            setItems([]);
        }
    }, [activeTab]);

    if (!activeTab) return null;

    return (
        <div className="absolute left-24 top-24 bottom-6 w-72 bg-[#18181b]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-20 flex flex-col animate-in slide-in-from-left-4 duration-200 overflow-hidden pointer-events-auto">
             <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                 <h3 className="font-bold text-white capitalize text-sm tracking-wider">
                    {activeTab === 'add' ? 'Add Nodes' : activeTab === 'workflows' ? 'Library' : 'History'}
                 </h3>
                 <button onClick={onClose} className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white"><X size={16}/></button>
             </div>
             
             <div 
                className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 nowheel"
                onWheel={(e) => e.stopPropagation()}
             >
                 {/* Add Nodes */}
                 {activeTab === 'add' && (
                     <div className="grid grid-cols-1 gap-2">
                        {[
                            { label: 'Image Generator', type: NodeType.GEN_IMAGE, icon: Sparkles, color: 'text-blue-400', desc: "AI Image Synthesis" },
                            { label: 'Text Generator', type: NodeType.GEN_TEXT, icon: MessageSquareText, color: 'text-amber-400', desc: "LLM Text Generation" },
                            { label: 'Web Search', type: NodeType.GEN_SEARCH, icon: Globe, color: 'text-emerald-400', desc: "Google Search Grounding" },
                            { label: 'Input Text', type: NodeType.INPUT_TEXT, icon: Type, color: 'text-zinc-400', desc: "Static Text Block" },
                            { label: 'Input Image', type: NodeType.INPUT_IMAGE, icon: ImageIcon, color: 'text-purple-400', desc: "Upload / Paste Image" },
                            { label: 'Group', type: NodeType.GROUP, icon: LayoutGrid, color: 'text-zinc-500', desc: "Organize Nodes" },
                        ].map((item, i) => (
                            <button key={i} onClick={() => onAddNode(item.type as NodeType)} className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/50 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group text-left">
                                <div className={`p-2 rounded-lg bg-black/50 ${item.color} mt-0.5`}><item.icon size={16}/></div>
                                <div>
                                    <span className="block text-sm font-bold text-zinc-300 group-hover:text-white">{item.label}</span>
                                    <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400">{item.desc}</span>
                                </div>
                            </button>
                        ))}
                     </div>
                 )}

                 {/* Workflows */}
                 {activeTab === 'workflows' && (
                     items.length === 0 ? <div className="text-zinc-500 text-xs text-center py-4">No workflows saved.</div> :
                     items.map((wf: any) => (
                        <div key={wf.id} className="p-3 bg-zinc-900/50 rounded-xl border border-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/5 group cursor-pointer transition-all" onClick={() => onImportWorkflow(wf)}>
                            <div className="flex items-center gap-2 mb-1">
                                <Workflow size={14} className="text-indigo-400" />
                                <span className="font-bold text-sm text-zinc-200 group-hover:text-white truncate">{wf.name}</span>
                            </div>
                            <p className="text-[10px] text-zinc-500 line-clamp-2">{wf.description || "No description"}</p>
                        </div>
                     ))
                 )}

                 {/* History */}
                 {activeTab === 'history' && (
                     items.length === 0 ? <div className="text-zinc-500 text-xs text-center py-4">No history yet.</div> :
                     items.map((h: any) => (
                        <div key={h.id} className="relative group rounded-lg overflow-hidden border border-white/5 cursor-pointer bg-black/50">
                            <img src={h.imageData.startsWith('data:') ? h.imageData : `data:image/png;base64,${h.imageData}`} className="w-full h-auto object-cover opacity-80 group-hover:opacity-100 transition-opacity" loading="lazy" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                                <p className="text-[9px] text-white line-clamp-2 font-medium">{h.prompt}</p>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-[8px] text-zinc-400">{h.model?.split('-')[1] || 'AI'}</span>
                                    <span className="text-[8px] text-zinc-400">{new Date(h.timestamp).toLocaleTimeString()}</span>
                                </div>
                            </div>
                        </div>
                     ))
                 )}
             </div>
        </div>
    );
};

// --- Selection Overlay Component ---
const SelectionOverlay = ({ 
    selectedNodes, 
    onCluster, 
    onRunSeq, 
    onSave, 
    onUngroup,
    onDelete
}: { 
    selectedNodes: Node<NodeData>[],
    onCluster: () => void,
    onRunSeq: () => void,
    onSave: () => void,
    onUngroup: () => void,
    onDelete: () => void
}) => {
    const { x, y, zoom } = useViewport();
    
    if (selectedNodes.length === 0) return null;

    // Only show overlay if multiple nodes are selected OR the single selected node is a GROUP
    const isSingleNode = selectedNodes.length === 1;
    const isGroup = selectedNodes[0]?.type === NodeType.GROUP;
    
    if (isSingleNode && !isGroup) return null;
    
    // Calculate bounding box in canvas space
    const rect = getNodesBounds(selectedNodes as any);
    if (!rect) return null;

    const hasGroup = selectedNodes.some(n => n.type === NodeType.GROUP);
    const canCluster = selectedNodes.length > 1;
    const showRunSeq = selectedNodes.length > 1 || (selectedNodes.length === 1 && hasGroup);

    // Calculate screen position center-top of selection
    const canvasCenterX = rect.x + rect.width / 2;
    const canvasTopY = rect.y;

    // Project to screen space
    const screenLeft = canvasCenterX * zoom + x;
    const screenTop = canvasTopY * zoom + y;

    return (
        <div 
            className="absolute z-50 origin-bottom pointer-events-none flex justify-center"
            style={{
                left: screenLeft,
                top: screenTop,
                // Move up significantly (scaled) to avoid being "tightly above"
                transform: `translate(-50%, -80px) scale(${1})`, 
            }}
        >
            <div className="flex items-center bg-[#18181b] border border-white/20 rounded-full shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] p-1.5 pointer-events-auto backdrop-blur-xl gap-0 overflow-hidden min-w-max">
               
               {/* Cluster Button */}
               {canCluster && (
                 <>
                    <button 
                        onClick={onCluster} 
                        className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors group"
                        title="Group Nodes"
                    >
                        <BoxSelect size={16} className="text-blue-400 group-hover:scale-110 transition-transform"/> 
                        <span className="text-xs font-bold tracking-wide uppercase">Group</span>
                    </button>
                    <div className="w-px h-6 bg-white/10 mx-1" />
                 </>
               )}
               
               {/* RUN SEQ Button */}
               {showRunSeq && (
                 <>
                    <button 
                        onClick={onRunSeq} 
                        className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-full text-white transition-colors group"
                        title="Run Sequence"
                    >
                        <Play size={16} className="text-green-400 fill-green-400 group-hover:scale-110 transition-transform"/> 
                        <span className="text-xs font-bold tracking-wide uppercase">Run</span>
                    </button>
                    <div className="w-px h-6 bg-white/10 mx-1" />
                 </>
               )}
               
               {/* SAVE Button */}
               <button 
                onClick={onSave} 
                className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-full text-white transition-colors group"
                title="Save as Workflow"
               >
                  <Save size={16} className="text-amber-400 group-hover:scale-110 transition-transform"/> 
                  <span className="text-xs font-bold tracking-wide uppercase">Save</span>
               </button>
               
               <div className="w-px h-6 bg-white/10 mx-1" />

               {/* Ungroup */}
               {hasGroup && (
                   <>
                    <button 
                        onClick={() => onUngroup()} 
                        className="flex items-center gap-2 px-4 py-2 hover:bg-red-500/20 rounded-full text-zinc-400 hover:text-red-400 transition-colors group"
                        title="Ungroup"
                    >
                        <Ungroup size={16} className="group-hover:scale-110 transition-transform"/> 
                        <span className="text-xs font-bold tracking-wide uppercase">Ungroup</span>
                    </button>
                    <div className="w-px h-6 bg-white/10 mx-1" />
                   </>
               )}

               {/* Delete */}
               <button 
                    onClick={onDelete} 
                    className="flex items-center gap-2 px-4 py-2 hover:bg-red-500/20 rounded-full text-zinc-400 hover:text-red-400 transition-colors group"
                    title="Delete Selection"
                >
                    <Trash2 size={16} className="group-hover:scale-110 transition-transform"/> 
                </button>
            </div>
        </div>
    );
};

interface NodeEditorProps {
    projectId: string;
    onBack: () => void;
    onOpenSettings?: () => void;
}

// Inner Component containing main logic
const NodeEditorContent: React.FC<NodeEditorProps> = ({ projectId, onBack, onOpenSettings }) => {
  // React Flow State
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Selection State
  const [selectedNodes, setSelectedNodes] = useState<Node<NodeData>[]>([]);
  
  // Instance State for Custom Controls
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  
  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Sidebar State
  const [activeSidebar, setActiveSidebar] = useState<string | null>(null);

  // App State
  const [isLoaded, setIsLoaded] = useState(false);
  const [projectName, setProjectName] = useState("Project Workspace");
  const [isRenaming, setIsRenaming] = useState(false);
  
  // Editor State
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [editingSourceNodeId, setEditingSourceNodeId] = useState<string | null>(null);
  
  // Modal State
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Connection State
  const connectionStartRef = useRef<{ nodeId: string | null; handleId: string | null; handleType: string | null } | null>(null);

  // Refs for Access inside Async Functions to avoid dependency loops
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  // --- Persistence Logic ---
  useEffect(() => {
    const init = async () => {
      setIsLoaded(false);
      const { nodes: savedNodes, edges: savedEdges } = await loadProjectData(projectId);
      const projects = await getProjects();
      const currentProject = projects.find(p => p.id === projectId);
      if(currentProject) setProjectName(currentProject.name);

      if (savedNodes && savedNodes.length > 0) {
        setNodes(savedNodes as Node<NodeData>[]);
        setEdges(savedEdges || []);
      } else {
         const defaultNode: Node<NodeData> = { 
            id: 'gen-1', 
            type: NodeType.GEN_IMAGE, 
            position: { x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 150 }, 
            data: { 
              text: "A futuristic cyberpunk city with neon lights, realistic, 8k",
              params: { model: GeneratorModel.GEMINI_FLASH_IMAGE, aspectRatio: "16:9", imageSize: "1K", numberOfImages: 1 }
            } 
        };
        setNodes([defaultNode]);
        setEdges([]);
      }
      setIsLoaded(true);
    };
    init();
  }, [projectId, setNodes, setEdges]);

  // Auto-Save
  useEffect(() => {
    if (!isLoaded) return;
    const handler = setTimeout(() => {
        saveProjectData(projectId, nodes, edges);
    }, 2000); 
    return () => clearTimeout(handler);
  }, [nodes, edges, isLoaded, projectId]);

  // --- Handlers ---
  
  const handleRenameProject = async () => {
      if (projectName.trim()) {
          await updateProjectName(projectId, projectName);
          setIsRenaming(false);
      }
  };

  const onSelectionChange = useCallback(({ nodes }: OnSelectionChangeParams) => {
     setSelectedNodes(nodes as Node<NodeData>[]);
  }, []);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({ ...params, type: 'deletable', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2, strokeOpacity: 0.8 } }, eds));
  }, [setEdges]);

  const onConnectStart: OnConnectStart = useCallback((_, params) => {
      connectionStartRef.current = params;
  }, []);

  const onConnectEnd: OnConnectEnd = useCallback((event) => {
      const targetIsPane = (event.target as Element).classList.contains('react-flow__pane');
      
      if (targetIsPane && connectionStartRef.current && rfInstance) {
          // Drop happened on pane, create a new node
          const { nodeId, handleId } = connectionStartRef.current;
          
          if (nodeId) {
             const { clientX, clientY } = event as MouseEvent;
             const position = rfInstance.project({ x: clientX, y: clientY });
             
             // Create New Node (Defaulting to Gen Image for now, or could be context menu)
             const newId = `node_${Date.now()}_auto`;
             const newNode: Node = {
                  id: newId,
                  type: NodeType.GEN_IMAGE,
                  position: { x: position.x - 100, y: position.y - 50 }, // Centered on mouse
                  data: { 
                      title: 'Refined Gen', 
                      params: { model: GeneratorModel.GEMINI_FLASH_IMAGE, aspectRatio: '1:1' },
                      text: '',
                      // Handlers will be patched by effect
                      onChange: updateNodeData, 
                      onDelete: deleteNode, 
                      onRun: handleRunNode, 
                      onEdit: handleOpenImageEditor
                  }
              };
              
              setNodes((nds) => [...nds, newNode]);
              setEdges((eds) => addEdge({ 
                  id: `e-${nodeId}-${newId}`, 
                  source: nodeId, 
                  sourceHandle: handleId,
                  target: newId, 
                  type: 'deletable', 
                  animated: true, 
                  style: { stroke: '#3b82f6', strokeWidth: 2, strokeOpacity: 0.8 } 
              }, eds));
          }
      }
      
      connectionStartRef.current = null;
  }, [rfInstance, setNodes, setEdges]);


  const onNodeContextMenu: NodeMouseHandler = useCallback(
    (event, node) => {
      event.preventDefault();
      // Select the node right clicked
      setNodes((nds) => nds.map(n => ({...n, selected: n.id === node.id})));
      setSelectedNodes([node]);
    },
    [setNodes]
  );

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent) => {
        event.preventDefault();
        setContextMenu({ x: event.clientX, y: event.clientY });
    },
    []
  );

  const onPaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  const updateNodeData = useCallback((id: string, newData: Partial<NodeData>) => {
    // 1. Update React State
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === id) {
          const existingData = node.data;
          // Ensure nested params are merged correctly
          if (newData.params && existingData.params) {
             return { 
               ...node, 
               data: { 
                 ...existingData, 
                 ...newData, 
                 params: { ...existingData.params, ...newData.params } 
               } 
             };
          }
          return { ...node, data: { ...existingData, ...newData } };
        }
        return node;
      })
    );

    // 2. Synchronously Update Ref for Logic Execution cycles
    // This allows sequential execution (like Group Run) to see updates immediately
    const refNode = nodesRef.current.find(n => n.id === id);
    if (refNode) {
        if (newData.params && refNode.data.params) {
            refNode.data = { 
                 ...refNode.data, 
                 ...newData, 
                 params: { ...refNode.data.params, ...newData.params } 
            };
        } else {
            refNode.data = { ...refNode.data, ...newData };
        }
    }
  }, [setNodes]);

  const deleteNode = useCallback((id: string) => {
    setNodes((nds) => {
      const nodeToDelete = nds.find(n => n.id === id);
      if (nodeToDelete?.type === NodeType.GROUP) {
         const children = nds.filter(n => n.parentNode === id);
         const childrenIds = children.map(n => n.id);
         setEdges((eds) => eds.filter((edge) => 
             edge.source !== id && edge.target !== id && 
             !childrenIds.includes(edge.source) && !childrenIds.includes(edge.target)
         ));
         return nds.filter((node) => node.id !== id && node.parentNode !== id);
      }
      setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
      return nds.filter((node) => node.id !== id);
    });
  }, [setNodes, setEdges]);

  // --- Layout Handler ---
  const handleAutoLayout = useCallback(() => {
      const layouted = getLayoutedElements(nodes, edges);
      setNodes([...layouted.nodes]);
      setEdges([...layouted.edges]);
      if(rfInstance) {
          setTimeout(() => rfInstance.fitView({ padding: 0.2, duration: 800 }), 100);
      }
      setContextMenu(null);
  }, [nodes, edges, setNodes, setEdges, rfInstance]);

  // --- Execution Logic ---
  
  // Core Execution Function that runs a node WITHOUT checking deps recursively
  // It pulls data from upstream inputs, runs the API, and updates state.
  const executeNode = useCallback(async (nodeId: string) => {
      const node = nodesRef.current.find(n => n.id === nodeId);
      if (!node) return;

      // 1. Gather Inputs
      const inputEdges = edgesRef.current.filter(e => e.target === nodeId);
      const inputNodes = inputEdges
        .map(e => nodesRef.current.find(n => n.id === e.source))
        .filter(Boolean) as Node[];
      
      // Sort by Y for stable order input (top-down)
      inputNodes.sort((a, b) => a.position.y - b.position.y);

      const inputValues: string[] = [];
      for (const inputNode of inputNodes) {
          const val = inputNode.data.result || inputNode.data.image || inputNode.data.text;
          if (val) inputValues.push(val);
      }

      // 2. Run API
      if (node.type === NodeType.GEN_IMAGE) {
          updateNodeData(nodeId, { isLoading: true, error: undefined });
          try {
              let prompt = node.data.text || "";
              inputValues.forEach((val, idx) => {
                 if (!val.startsWith('data:')) {
                     prompt = prompt.replace(new RegExp(`{{node ${idx}}}`, 'g'), val);
                     prompt = prompt.replace(new RegExp(`{{input}}`, 'g'), inputValues.filter(v => !v.startsWith('data:')).join(' '));
                 }
              });

              const imageInputs = inputValues.filter(v => v.startsWith('data:'));
              
              const results = await generateImageContent({
                  prompt,
                  images: imageInputs,
                  model: (node.data.params?.model as GeneratorModel) || GeneratorModel.GEMINI_FLASH_IMAGE,
                  aspectRatio: node.data.params?.aspectRatio,
                  imageSize: node.data.params?.imageSize as any,
                  numberOfImages: node.data.params?.numberOfImages || 1,
                  camera: node.data.params?.camera
              });

              updateNodeData(nodeId, { isLoading: false, result: results[0], results: results });
              
              addBatchToHistory(results.map(r => ({
                  prompt,
                  imageData: r,
                  model: node.data.params?.model || 'unknown',
                  aspectRatio: node.data.params?.aspectRatio || '1:1',
                  camera: node.data.params?.camera,
                  referenceImages: imageInputs
              })));

          } catch (err: any) {
              updateNodeData(nodeId, { isLoading: false, error: err.message });
          }
      } else if (node.type === NodeType.GEN_TEXT) {
           updateNodeData(nodeId, { isLoading: true, error: undefined });
           try {
              let prompt = node.data.text || "";
              inputValues.forEach((val, idx) => {
                 if (!val.startsWith('data:')) {
                     prompt = prompt.replace(new RegExp(`{{node ${idx}}}`, 'g'), val);
                     prompt = prompt.replace(new RegExp(`{{input}}`, 'g'), inputValues.filter(v => !v.startsWith('data:')).join(' '));
                 }
              });
              
              const imageInputs = inputValues.filter(v => v.startsWith('data:'));

              const result = await generateTextContent({
                  prompt,
                  images: imageInputs,
                  model: node.data.params?.model || 'gemini-3-flash-preview',
                  thinkingBudget: node.data.params?.thinkingBudget
              });
              updateNodeData(nodeId, { isLoading: false, result });
           } catch (err: any) {
              updateNodeData(nodeId, { isLoading: false, error: err.message });
           }
      } else if (node.type === NodeType.GEN_SEARCH) {
           updateNodeData(nodeId, { isLoading: true, error: undefined });
           try {
              let query = node.data.text || "";
              inputValues.forEach((val, idx) => {
                 if (!val.startsWith('data:')) {
                     query = query.replace(new RegExp(`{{node ${idx}}}`, 'g'), val);
                 }
              });

              const { text, sources } = await generateSearchContent({ query });
              updateNodeData(nodeId, { isLoading: false, result: text, searchSources: sources });
           } catch (err: any) {
               updateNodeData(nodeId, { isLoading: false, error: err.message });
           }
      }
  }, [updateNodeData]);

  // Handles "Pull" logic for Single Node runs: Check deps, if cached use it, else run it.
  const processNode = useCallback(async (nodeId: string, visited = new Set<string>()): Promise<any> => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      // 1. Recursively ensure upstream deps have results
      const inputEdges = edgesRef.current.filter(e => e.target === nodeId);
      for (const edge of inputEdges) {
          const sourceNode = nodesRef.current.find(n => n.id === edge.source);
          // Only auto-run generator upstream nodes if they are missing results
          if (sourceNode && (sourceNode.type === NodeType.GEN_IMAGE || sourceNode.type === NodeType.GEN_TEXT || sourceNode.type === NodeType.GEN_SEARCH)) {
              if (!sourceNode.data.result) {
                  await processNode(sourceNode.id, visited);
              }
          }
      }

      // 2. Execute Current Node
      await executeNode(nodeId);
  }, [executeNode]);

  const handleRunNode = useCallback(async (id: string) => {
      await processNode(id);
  }, [processNode]);

  // Handles "Group" logic: Topologically sort and run ALL nodes in the group sequentially (Push logic)
  // This effectively regenerates the group flow from scratch.
  const handleRunGroup = useCallback(async (groupId: string) => {
      const groupNodes = nodesRef.current.filter(n => n.parentNode === groupId);
      const groupNodeIds = new Set(groupNodes.map(n => n.id));
      
      // Build adjacency list for group nodes only
      const adjacency = new Map<string, string[]>();
      const inDegree = new Map<string, number>();
      
      groupNodes.forEach(n => {
          adjacency.set(n.id, []);
          inDegree.set(n.id, 0);
      });

      const internalEdges = edgesRef.current.filter(e => 
          groupNodeIds.has(e.source) && groupNodeIds.has(e.target)
      );

      internalEdges.forEach(e => {
          adjacency.get(e.source)?.push(e.target);
          inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
      });

      // Kahn's Algorithm for Topological Sort
      const queue: string[] = [];
      groupNodes.forEach(n => {
          if ((inDegree.get(n.id) || 0) === 0) {
              queue.push(n.id);
          }
      });

      const sortedIds: string[] = [];
      while (queue.length > 0) {
          const id = queue.shift()!;
          sortedIds.push(id);
          
          const neighbors = adjacency.get(id) || [];
          for (const neighbor of neighbors) {
              inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
              if (inDegree.get(neighbor) === 0) {
                  queue.push(neighbor);
              }
          }
      }

      // Append any remaining nodes (cycles) just in case
      const missing = groupNodes.filter(n => !sortedIds.includes(n.id));
      sortedIds.push(...missing.map(n => n.id));

      // Execution Phase
      for (const nodeId of sortedIds) {
          const node = nodesRef.current.find(n => n.id === nodeId);
          // Only run generator nodes. 
          if (node && (node.type === NodeType.GEN_IMAGE || node.type === NodeType.GEN_TEXT || node.type === NodeType.GEN_SEARCH)) {
              await executeNode(nodeId);
          }
      }

  }, [executeNode]);

  const handleOpenImageEditor = useCallback((nodeId: string, imgData: string) => {
      setEditingSourceNodeId(nodeId);
      setEditingImage(imgData);
  }, []);

  const handleSaveEditedImage = useCallback((newImgData: string) => {
      if (editingSourceNodeId) {
          updateNodeData(editingSourceNodeId, { result: newImgData });
          setEditingImage(null);
          setEditingSourceNodeId(null);
      }
  }, [editingSourceNodeId, updateNodeData]);

  const handleUngroup = useCallback((groupId?: string) => {
      setNodes((nds) => {
          const targetId = typeof groupId === 'string' ? groupId : selectedNodes.find(n => n.type === NodeType.GROUP)?.id;
          if (!targetId) return nds;

          const group = nds.find(n => n.id === targetId);
          if (!group) return nds;

          const children = nds.filter(n => n.parentNode === targetId);
          const updatedChildren = children.map(n => ({
              ...n,
              parentNode: undefined,
              extent: undefined,
              position: { x: n.position.x + group.position.x, y: n.position.y + group.position.y }
          } as Node));

          return nds.filter(n => n.id !== targetId && n.parentNode !== targetId).concat(updatedChildren);
      });
  }, [selectedNodes, setNodes]);

  // --- Graph Management ---
  
  // Dedicated function to add a next step node connected to source
  const handleAddNextNode = useCallback((sourceId: string) => {
      const sourceNode = nodesRef.current.find(n => n.id === sourceId);
      if (!sourceNode) return;

      const newId = `node_${Date.now()}_next`;
      const newNode: Node = {
          id: newId,
          type: NodeType.GEN_IMAGE,
          position: { x: sourceNode.position.x + 450, y: sourceNode.position.y },
          data: { 
              title: 'Refined Gen', 
              params: { model: GeneratorModel.GEMINI_FLASH_IMAGE, aspectRatio: '1:1' },
              // These will be patched by useEffect, but providing keys here for initial render safety
              onChange: updateNodeData, 
              onDelete: deleteNode, 
              onRun: handleRunNode, 
              onEdit: handleOpenImageEditor
          }
      };

      setNodes(nds => [...nds, newNode]);
      setEdges(eds => addEdge({ 
          id: `e-${sourceId}-${newId}`, 
          source: sourceId, 
          target: newId, 
          type: 'deletable', 
          animated: true, 
          style: { stroke: '#3b82f6', strokeWidth: 2, strokeOpacity: 0.8 } 
      }, eds));
  }, [updateNodeData, deleteNode, handleRunNode, handleOpenImageEditor, setNodes, setEdges]);

  const handleAddNode = useCallback((type: NodeType, pos?: {x: number, y: number}) => {
      const id = `node_${Date.now()}`;
      let data: NodeData = { 
          title: type === NodeType.GEN_SEARCH ? 'Web Search' : 'Untitled',
          onChange: updateNodeData,
          onDelete: deleteNode,
          onRun: handleRunNode,
          onAddNext: handleAddNextNode,
          onEdit: handleOpenImageEditor
      };

      if (type === NodeType.GEN_IMAGE) {
          data.params = { model: GeneratorModel.GEMINI_FLASH_IMAGE, aspectRatio: "1:1", numberOfImages: 1 };
          data.text = "";
      } else if (type === NodeType.GEN_TEXT) {
          data.params = { model: 'gemini-3-flash-preview', thinkingBudget: 0 };
          data.text = "";
      } else if (type === NodeType.GEN_SEARCH) {
          data.text = "";
      } else if (type === NodeType.GROUP) {
          data.label = "Workflow Group";
          data.onRunGroup = handleRunGroup;
          data.onUngroup = handleUngroup;
      }

      let position = { x: 0, y: 0 };
      if (pos && rfInstance) {
          position = rfInstance.project(pos);
      } else if (rfInstance) {
          const { x, y, zoom } = rfInstance.getViewport();
          position = { x: -x/zoom + window.innerWidth/2/zoom - 150, y: -y/zoom + window.innerHeight/2/zoom - 100 };
      }

      const newNode: Node = {
          id,
          type,
          position,
          data,
          ...(type === NodeType.GROUP ? { style: { width: 400, height: 300, zIndex: -1 } } : {})
      };
      
      setNodes((nds) => [...nds, newNode]);
      setContextMenu(null);
      setActiveSidebar(null);
  }, [updateNodeData, deleteNode, handleRunNode, handleAddNextNode, handleRunGroup, handleUngroup, handleOpenImageEditor, rfInstance, setNodes]);

  const handleGroupSelection = () => {
      if (selectedNodes.length < 2) return;
      
      const rect = getNodesBounds(selectedNodes as any);
      const groupId = `group_${Date.now()}`;
      
      const groupNode: Node = {
          id: groupId,
          type: NodeType.GROUP,
          position: { x: rect.x - 20, y: rect.y - 40 },
          style: { width: rect.width + 40, height: rect.height + 60, zIndex: -1 },
          data: { label: 'New Group', onChange: updateNodeData, onRunGroup: handleRunGroup, onUngroup: handleUngroup }
      };

      const updatedNodes = nodes.map(n => {
          if (selectedNodes.find(sn => sn.id === n.id)) {
              return {
                  ...n,
                  parentNode: groupId,
                  extent: 'parent',
                  position: { x: n.position.x - (rect.x - 20), y: n.position.y - (rect.y - 40) } 
              } as Node;
          }
          return n;
      });

      setNodes([...updatedNodes, groupNode]);
      setSelectedNodes([]);
  };

  const handleCreateWorkflow = () => {
      setIsWorkflowModalOpen(true);
  };

  const saveWorkflow = async (meta: { name: string, tags: string[], description: string }) => {
      const nodesToSave = selectedNodes.length > 0 ? selectedNodes : nodes;
      const ids = nodesToSave.map(n => n.id);
      const edgesToSave = edges.filter(e => ids.includes(e.source) && ids.includes(e.target));
      
      await saveWorkflowTemplate({
          name: meta.name,
          tags: meta.tags,
          description: meta.description,
          nodes: nodesToSave,
          edges: edgesToSave
      });
      setIsWorkflowModalOpen(false);
      alert("Workflow saved to library!");
  };

  const handleImportWorkflow = useCallback((wf: WorkflowTemplate) => {
      const idMap = new Map<string, string>();
      const center = rfInstance ? rfInstance.project({ x: window.innerWidth / 2, y: window.innerHeight / 2 }) : { x: 0, y: 0 };
      
      // Calculate offset based on the first node in the workflow to center it
      const wfFirstNode = wf.nodes[0];
      const offsetX = wfFirstNode ? center.x - wfFirstNode.position.x : 0;
      const offsetY = wfFirstNode ? center.y - wfFirstNode.position.y : 0;

      const newNodes = wf.nodes.map(n => {
          const newId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
          idMap.set(n.id, newId);
          return {
              ...n,
              id: newId,
              selected: false,
              position: { x: n.position.x + offsetX, y: n.position.y + offsetY },
              data: {
                  ...n.data,
                  onChange: updateNodeData, 
                  onDelete: deleteNode, 
                  onRun: handleRunNode, 
                  onEdit: handleOpenImageEditor,
                  onAddNext: handleAddNextNode, 
                  onRunGroup: handleRunGroup,
                  onUngroup: handleUngroup
              }
          };
      });
      
      const newEdges = wf.edges.map(e => ({
          ...e,
          id: `e-${idMap.get(e.source)}-${idMap.get(e.target)}`,
          source: idMap.get(e.source)!,
          target: idMap.get(e.target)!
      }));

      setNodes(prev => [...prev.map(n => ({...n, selected: false})), ...newNodes]);
      setEdges(prev => [...prev, ...newEdges]);
      setActiveSidebar(null);
  }, [rfInstance, updateNodeData, deleteNode, handleRunNode, handleOpenImageEditor, handleAddNextNode, handleRunGroup, handleUngroup]);

  // Re-inject handlers into nodes when they change (only if handlers actually change)
  useEffect(() => {
      setNodes(nds => nds.map(n => ({
          ...n,
          data: {
              ...n.data,
              onChange: updateNodeData,
              onDelete: deleteNode,
              onRun: handleRunNode,
              onEdit: handleOpenImageEditor,
              onAddNext: handleAddNextNode, 
              onRunGroup: handleRunGroup,
              onUngroup: handleUngroup
          }
      })));
  }, [updateNodeData, deleteNode, handleRunNode, handleAddNextNode, handleRunGroup, handleUngroup, handleOpenImageEditor]);

  const handleCopilotAddNodes = (newNodes: any[], connections: any[]) => {
       const timestamp = Date.now();
       const mappedNodes = newNodes.map((n, i) => ({
           id: `cp_${timestamp}_${i}`,
           type: n.type || NodeType.GEN_IMAGE,
           position: { x: 100 + (i*450), y: 100 + (i * 50) },
           data: { 
               title: n.label || 'Copilot Node', 
               text: n.prompt, 
               params: { model: GeneratorModel.GEMINI_FLASH_IMAGE },
               onChange: updateNodeData, 
               onDelete: deleteNode, 
               onRun: handleRunNode, 
               onEdit: handleOpenImageEditor,
               onAddNext: handleAddNextNode
           }
       }));
       
       const mappedEdges = (connections || []).map((conn: any) => ({
           id: `e-cp-${timestamp}-${conn.fromIndex}-${conn.toIndex}`,
           source: mappedNodes[conn.fromIndex].id,
           target: mappedNodes[conn.toIndex].id,
           type: 'deletable',
           animated: true,
           style: { stroke: '#3b82f6', strokeWidth: 2, strokeOpacity: 0.8 }
       }));
       
       setNodes(nds => [...nds, ...mappedNodes]);
       setEdges(eds => [...eds, ...mappedEdges]);
  };

  return (
    <div className="w-full h-full bg-[#09090b] text-white flex flex-col relative overflow-hidden">
        {/* Header Bar */}
        <div className="h-16 border-b border-white/5 bg-[#18181b]/50 backdrop-blur-md flex items-center justify-between px-6 z-10 shrink-0">
             <div className="flex items-center gap-4">
                 <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-zinc-400 hover:text-white">
                     <ArrowLeft size={20} />
                 </button>
                 <div className="h-6 w-px bg-white/10" />
                 {isRenaming ? (
                     <input 
                        autoFocus
                        className="bg-transparent border border-blue-500/50 rounded px-2 py-0.5 text-lg font-bold text-white outline-none"
                        value={projectName}
                        onChange={e => setProjectName(e.target.value)}
                        onBlur={handleRenameProject}
                        onKeyDown={e => e.key === 'Enter' && handleRenameProject()}
                     />
                 ) : (
                     <h1 
                        className="text-lg font-bold text-white cursor-pointer hover:text-blue-400 transition-colors flex items-center gap-2"
                        onClick={() => setIsRenaming(true)}
                     >
                         {projectName}
                         <Pencil size={12} className="opacity-0 hover:opacity-100 text-zinc-500" />
                     </h1>
                 )}
             </div>

             <div className="flex items-center gap-3">
                 <div className="flex bg-zinc-900 rounded-lg p-1 border border-white/5">
                     <button className="px-3 py-1.5 rounded-md hover:bg-white/10 text-xs font-bold text-zinc-400 hover:text-white transition-colors" onClick={() => setIsCopilotOpen(!isCopilotOpen)}>
                        <Sparkles size={14} className={`inline mr-2 ${isCopilotOpen ? 'text-blue-400' : ''}`} />
                        Copilot
                     </button>
                     <div className="w-px h-full bg-white/5 mx-1" />
                     <button className="px-3 py-1.5 rounded-md hover:bg-white/10 text-xs font-bold text-zinc-400 hover:text-white transition-colors" onClick={handleCreateWorkflow}>
                        <Workflow size={14} className="inline mr-2" />
                        Save Workflow
                     </button>
                 </div>
                 <button onClick={onOpenSettings} className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors">
                     <Grid size={20} />
                 </button>
             </div>
        </div>

        {/* Sidebar Dock & Panel */}
        <div className="absolute left-6 top-24 bottom-6 z-20 flex gap-4 pointer-events-none">
            {/* Toolbar */}
            <div className="flex flex-col gap-2 pointer-events-auto">
               <button 
                   onClick={() => setActiveSidebar(activeSidebar === 'add' ? null : 'add')}
                   className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all shadow-lg ${activeSidebar === 'add' ? 'bg-blue-600 text-white border-blue-500' : 'bg-[#18181b] border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'}`}
                   title="Add Nodes"
               >
                   <Plus size={24} />
               </button>
               <button 
                   onClick={() => setActiveSidebar(activeSidebar === 'workflows' ? null : 'workflows')}
                   className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all shadow-lg ${activeSidebar === 'workflows' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-[#18181b] border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'}`}
                   title="Workflow Library"
               >
                   <LayoutTemplate size={20} />
               </button>
               <button 
                   onClick={() => setActiveSidebar(activeSidebar === 'history' ? null : 'history')}
                   className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all shadow-lg ${activeSidebar === 'history' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-[#18181b] border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'}`}
                   title="History"
               >
                   <History size={20} />
               </button>
            </div>

            {/* Panel */}
            <EditorSidebar 
                activeTab={activeSidebar} 
                onClose={() => setActiveSidebar(null)}
                onAddNode={handleAddNode}
                onImportWorkflow={handleImportWorkflow}
            />
        </div>

        {/* Canvas Area */}
        <div className="flex-1 w-full h-full relative" onContextMenu={onPaneContextMenu} onClick={onPaneClick}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onConnectStart={onConnectStart}
                onConnectEnd={onConnectEnd}
                onNodeContextMenu={onNodeContextMenu}
                onSelectionChange={onSelectionChange}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onInit={setRfInstance}
                minZoom={0.1}
                maxZoom={2}
                selectionMode={SelectionMode.Partial}
                deleteKeyCode={['Delete', 'Backspace']}
                multiSelectionKeyCode={['Control', 'Meta']}
                panOnScroll
                selectionOnDrag
                panOnDrag={[1, 2]} // Middle or Right click pan
                fitView
            >
                <Background color="#222" gap={24} size={1} variant={BackgroundVariant.Dots} />
                <Controls className="bg-zinc-900 border border-white/10 text-zinc-400 fill-zinc-400" />
                
                {contextMenu && (
                    <ContextMenu 
                        x={contextMenu.x} 
                        y={contextMenu.y} 
                        onClose={() => setContextMenu(null)}
                        onAddNode={(type) => handleAddNode(type, { x: contextMenu.x, y: contextMenu.y })}
                        onAutoLayout={handleAutoLayout}
                    />
                )}
            </ReactFlow>

            {/* Overlays */}
            <SelectionOverlay 
                selectedNodes={selectedNodes}
                onCluster={handleGroupSelection}
                onRunSeq={() => handleRunGroup(selectedNodes[0].id)}
                onSave={handleCreateWorkflow}
                onUngroup={handleUngroup}
                onDelete={() => selectedNodes.forEach(n => deleteNode(n.id))}
            />
        </div>

        {/* Sidebars & Modals */}
        {isCopilotOpen && (
            <CopilotSidebar 
                isOpen={isCopilotOpen} 
                onClose={() => setIsCopilotOpen(false)}
                onAddNodes={handleCopilotAddNodes}
            />
        )}

        <ImageEditor 
            isOpen={!!editingImage}
            imageUrl={editingImage}
            onClose={() => setEditingImage(null)}
            onSave={handleSaveEditedImage}
        />

        <WorkflowModal 
            isOpen={isWorkflowModalOpen}
            onClose={() => setIsWorkflowModalOpen(false)}
            onSave={saveWorkflow}
        />
    </div>
  );
};

// Wrapper ensuring ReactFlowProvider exists for useViewport hook in overlays
export const NodeEditor: React.FC<NodeEditorProps> = (props) => {
  return (
    <ReactFlowProvider>
      <NodeEditorContent {...props} />
    </ReactFlowProvider>
  );
};
