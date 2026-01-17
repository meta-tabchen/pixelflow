
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
  getRectOfNodes,
  SelectionMode,
  ReactFlowProvider,
  useReactFlow,
  OnSelectionChangeParams,
  ReactFlowInstance,
  NodeMouseHandler,
  useViewport
} from 'reactflow';
import { NodeType, GeneratorModel, HistoryItem, ProjectMeta, WorkflowTemplate, NodeData } from '../../types';
import { nodeTypes } from './CustomNodes';
import { DeletableEdge } from './CustomEdges';
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Upload, 
  FolderOpen, 
  Network, 
  MessageSquare,
  Clock,
  Images,
  Shapes,
  Type, 
  Video, 
  Music, 
  X,
  Scan,
  HelpCircle,
  BoxSelect,
  Grid,
  ChevronRight,
  Pencil,
  Check,
  Download,
  Share2,
  Cpu,
  Save,
  Minus,
  Maximize,
  Lock,
  Unlock,
  ArrowLeft,
  Sparkles,
  Workflow,
  MessageSquareText,
  Copy,
  Scissors,
  Play,
  Ungroup
} from 'lucide-react';
import { generateImageContent, generateTextContent, isKeyRequired } from '../../services/geminiService';
import { ImageEditor } from './ImageEditor';
import { WorkflowModal } from './WorkflowModal';
import { CopilotSidebar } from './CopilotSidebar';
import { saveProjectData, loadProjectData, addToHistory, addBatchToHistory, getHistory, getProjects, updateProjectName, saveWorkflowTemplate, getWorkflowTemplates, deleteWorkflowTemplate } from '../../services/storageService';

const edgeTypes = {
  deletable: DeletableEdge,
};

// --- Selection Overlay Component ---
const SelectionOverlay = ({ 
    selectedNodes, 
    onCluster, 
    onRunSeq, 
    onSave, 
    onUngroup 
}: { 
    selectedNodes: Node<NodeData>[],
    onCluster: () => void,
    onRunSeq: () => void,
    onSave: () => void,
    onUngroup: () => void
}) => {
    const { zoom } = useViewport();
    
    if (selectedNodes.length === 0) return null;
    
    // Calculate bounding box
    const rect = getRectOfNodes(selectedNodes);
    if (!rect) return null;

    const hasGroup = selectedNodes.some(n => n.type === NodeType.GROUP);
    const canCluster = selectedNodes.length > 1;
    // Only show Run Seq if multiple nodes are selected OR if a single Group node is selected
    const showRunSeq = selectedNodes.length > 1 || (selectedNodes.length === 1 && hasGroup);

    // Scale logic to keep the menu size consistent visually regardless of zoom
    const scale = 1 / Math.max(zoom, 0.1);
    
    return (
        <div 
            className="absolute z-50 origin-bottom left-0 top-0 pointer-events-none"
            style={{
                transform: `translate(${rect.x + rect.width / 2}px, ${rect.y - (60 * scale)}px) scale(${scale})`,
            }}
        >
            <div className="flex items-center gap-1 bg-zinc-950/90 border border-zinc-700 p-1.5 rounded-full shadow-2xl backdrop-blur-md -translate-x-1/2 pointer-events-auto">
               {canCluster && (
                 <>
                    <button onClick={onCluster} className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-full text-zinc-300 hover:text-white transition-colors text-xs font-bold uppercase tracking-wide whitespace-nowrap">
                        <BoxSelect size={12} className="text-blue-400"/> 
                        Cluster
                    </button>
                    <div className="w-px h-4 bg-white/10" />
                 </>
               )}
               
               {showRunSeq && (
                 <>
                    <button onClick={onRunSeq} className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-full text-zinc-300 hover:text-white transition-colors text-xs font-bold uppercase tracking-wide whitespace-nowrap">
                        <Play size={12} className="text-green-400 fill-current"/> 
                        Run Seq
                    </button>
                    <div className="w-px h-4 bg-white/10" />
                 </>
               )}
               
               <button onClick={onSave} className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-full text-zinc-300 hover:text-white transition-colors text-xs font-bold uppercase tracking-wide whitespace-nowrap">
                  <Save size={12} className="text-amber-400"/> 
                  Save
               </button>
               
               {hasGroup && (
                   <>
                    <div className="w-px h-4 bg-white/10" />
                    <button onClick={onUngroup} className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-500/10 rounded-full text-zinc-300 hover:text-red-400 transition-colors text-xs font-bold uppercase tracking-wide whitespace-nowrap">
                        <Ungroup size={12}/> 
                        Ungroup
                    </button>
                   </>
               )}
            </div>
        </div>
    );
};

interface NodeEditorProps {
    projectId: string;
    onBack: () => void;
    onOpenSettings?: () => void;
}

export const NodeEditor: React.FC<NodeEditorProps> = ({ projectId, onBack, onOpenSettings }) => {
  // React Flow State
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Selection State
  const [selectedNodes, setSelectedNodes] = useState<Node<NodeData>[]>([]);
  
  // Instance State for Custom Controls
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  
  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Refs for Access inside Async Functions
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  // App State
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [projectName, setProjectName] = useState("Project Workspace");
  const [isRenaming, setIsRenaming] = useState(false);
  
  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [editingSourceNodeId, setEditingSourceNodeId] = useState<string | null>(null);
  
  // Modal State
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // UI State
  const [activeMenu, setActiveMenu] = useState<'add' | 'history' | 'workflows' | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [workflowTemplates, setWorkflowTemplates] = useState<WorkflowTemplate[]>([]);

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
        saveProjectData(projectId, nodes, edges).then(() => {
            setLastSaved(new Date());
        });
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
    if (isLocked) return;
    setEdges((eds) => addEdge({ ...params, type: 'deletable', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2, strokeOpacity: 0.8 } }, eds));
  }, [setEdges, isLocked]);

  const onNodeContextMenu: NodeMouseHandler = useCallback(
    (event, node) => {
      event.preventDefault();
      // If we right-click a node that isn't selected, select it exclusively
      const isSelected = node.selected || selectedNodes.some(n => n.id === node.id);
      if (!isSelected) {
          setNodes((nds) => nds.map(n => ({...n, selected: n.id === node.id})));
          setSelectedNodes([node]); 
      }
      setContextMenu({ x: event.clientX, y: event.clientY });
    },
    [selectedNodes, setNodes]
  );

  const onPaneClick = useCallback(() => {
    setContextMenu(null);
    setActiveMenu(null);
  }, []);

  const updateNodeData = useCallback((id: string, newData: Partial<NodeData>) => {
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
  }, [setNodes]);

  const deleteNode = useCallback((id: string) => {
    if (isLocked) return;
    setNodes((nds) => {
      const nodeToDelete = nds.find(n => n.id === id);
      if (nodeToDelete?.type === NodeType.GROUP) {
         const children = nds.filter(n => n.parentNode === id);
         const childrenIds = children.map(n => n.id);
         setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id && !childrenIds.includes(edge.source) && !childrenIds.includes(edge.target)));
         return nds.filter((node) => node.id !== id && node.parentNode !== id);
      }
      return nds.filter((node) => node.id !== id);
    });
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  }, [setNodes, setEdges, isLocked]);

  const handleDeleteSelected = useCallback(() => {
     selectedNodes.forEach(node => deleteNode(node.id));
     setContextMenu(null);
  }, [selectedNodes, deleteNode]);

  const addNextNode = useCallback((sourceId: string) => {
    if (isLocked) return;
    setNodes((nds) => {
        const sourceNode = nds.find(n => n.id === sourceId);
        if (!sourceNode) return nds;

        const newId = `${NodeType.GEN_IMAGE}-${Date.now()}`;
        const isSmallSource = sourceNode.type === NodeType.INPUT_IMAGE || sourceNode.type === NodeType.UPLOAD_IMAGE;
        const sourceWidth = isSmallSource ? 280 : 380;
        const gap = 100; 
        
        let newPos = { 
            x: sourceNode.position.x + sourceWidth + gap, 
            y: sourceNode.position.y 
        };

        // Inherit params but ensure valid image model
        let inheritedParams = sourceNode.data.params ? { ...sourceNode.data.params } : { model: GeneratorModel.GEMINI_FLASH_IMAGE, aspectRatio: "16:9", imageSize: "1K", numberOfImages: 1 };
        
        // Prevent inheriting Text models for Image nodes
        if (inheritedParams.model === GeneratorModel.GEMINI_FLASH_TEXT || inheritedParams.model === GeneratorModel.GEMINI_PRO_TEXT) {
            inheritedParams.model = GeneratorModel.GEMINI_FLASH_IMAGE;
        }

        const newNode: Node<NodeData> = {
            id: newId,
            type: NodeType.GEN_IMAGE,
            position: newPos,
            data: { 
                text: "", 
                params: inheritedParams 
            }
        };

        setEdges((eds) => addEdge({ 
            source: sourceId, 
            target: newId, 
            id: `e-${sourceId}-${newId}`,
            type: 'deletable', 
            animated: true,
            style: { stroke: '#3b82f6', strokeWidth: 2 }
        }, eds));

        return [...nds, newNode];
    });
  }, [setNodes, setEdges, isLocked]);

  // --- Execution Engine ---

  const executeNode = async (id: string, overrides?: Map<string, any>) => {
    if (isKeyRequired()) {
        if (confirm("The current system key is for demonstration only. Image generation is disabled.\n\nWould you like to open Settings to provide your own Gemini API Key?")) {
            onOpenSettings?.();
        }
        return;
    }

    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;
    
    const node = currentNodes.find(n => n.id === id);
    if (!node) return;

    updateNodeData(id, { isLoading: true, result: undefined, results: undefined, error: undefined });

    try {
      // Find connected input nodes
      const inputEdges = currentEdges.filter(e => e.target === id);
      
      // Sort edges by source node Y position to allow deterministic indexing for placeholders
      // This matches the visual order in the "Input Variables" legend
      inputEdges.sort((a, b) => {
          const nodeA = currentNodes.find(n => n.id === a.source);
          const nodeB = currentNodes.find(n => n.id === b.source);
          return (nodeA?.position.y || 0) - (nodeB?.position.y || 0);
      });

      // Map edges to their content to preserve index mapping for {{node N}}
      const inputContent = inputEdges.map(edge => {
          const sourceNode = currentNodes.find(n => n.id === edge.source);
          let text: string | null = null;
          let image: string | null = null;

          if (sourceNode) {
              // Override checking (for Group execution)
              if (overrides && overrides.has(edge.source)) {
                 const ov = overrides.get(edge.source);
                 if (ov?.result) {
                     if (typeof ov.result === 'string' && !ov.result.startsWith('data:')) {
                         text = ov.result;
                     } else {
                         image = ov.result;
                     }
                 }
              }

              // Normal extraction if no override or override didn't provide specific type
              if (!text && !image) {
                  // Text Extraction
                  if (sourceNode.type === NodeType.INPUT_TEXT && sourceNode.data.text) {
                      text = sourceNode.data.text;
                  } else if (sourceNode.type === NodeType.GEN_TEXT && sourceNode.data.result) {
                      text = sourceNode.data.result;
                  }

                  // Image Extraction
                  if (sourceNode.data.result && sourceNode.data.result.startsWith('data:image')) {
                      image = sourceNode.data.result;
                  } else if (sourceNode.data.preview) {
                      image = sourceNode.data.preview;
                  } else if (sourceNode.data.image) {
                      image = sourceNode.data.image;
                  }
              }
          }
          return { text, image };
      });

      // Collect for API calls (dense arrays for API, but referencing needs index)
      const collectedImages = inputContent.map(c => c.image).filter(Boolean) as string[];
      const allInputTexts = inputContent.map(c => c.text).filter(t => t && t.trim().length > 0) as string[];

      // Add self image if present
      if (node.data.image) {
          collectedImages.push(node.data.image);
      }

      // --- Prompt Construction with Template Support ---
      let finalPrompt = node.data.text || "";
      let usedPlaceholder = false;

      // Replace {{node N}}, {{node_N}}, {{nodeN}} with the N-th connected input's text
      // IMPORTANT: We use inputContent array to ensure index matches the Y-sorted connection list
      finalPrompt = finalPrompt.replace(/\{\{node[_\s]*(\d+)\}\}/gi, (match, indexStr) => {
          usedPlaceholder = true;
          const index = parseInt(indexStr);
          if (!isNaN(index) && inputContent[index] && inputContent[index].text) {
              return inputContent[index].text!;
          }
          // If node exists but has no text (e.g., it's an image), return empty to avoid breaking prompt
          return ""; 
      });

      // Replace {{input}} with all connected text inputs joined
      finalPrompt = finalPrompt.replace(/\{\{input\}\}/gi, (match) => {
          usedPlaceholder = true;
          return allInputTexts.join("\n");
      });

      // Fallback: If no placeholders used, append texts to the end (Legacy behavior)
      if (!usedPlaceholder && allInputTexts.length > 0) {
           finalPrompt = [finalPrompt, ...allInputTexts].join("\n\n");
      }

      if (node.type === NodeType.GEN_TEXT) {
          // --- Text Generation ---
          if (!finalPrompt && collectedImages.length === 0) {
              throw new Error("No prompt or images provided.");
          }
          
          const resultText = await generateTextContent({
              prompt: finalPrompt || "Describe the input images.",
              images: collectedImages,
              model: node.data.params?.model || GeneratorModel.GEMINI_FLASH_TEXT
          });
          
          updateNodeData(id, { result: resultText, error: undefined });
          return resultText;

      } else {
          // --- Image Generation ---
          if (!finalPrompt) {
              throw new Error("No prompt provided. Please add text to the generator or connect a text node.");
          }

          // Strict Model Validation for Image Generation
          let selectedModel = node.data.params?.model as GeneratorModel;
          if (selectedModel === GeneratorModel.GEMINI_FLASH_TEXT || selectedModel === GeneratorModel.GEMINI_PRO_TEXT || !selectedModel) {
              // Default to Flash Image if invalid/text model is set
              selectedModel = GeneratorModel.GEMINI_FLASH_IMAGE;
          }

          const params = {
            prompt: finalPrompt,
            images: collectedImages, 
            model: selectedModel,
            aspectRatio: node.data.params?.aspectRatio as any,
            imageSize: node.data.params?.imageSize as any,
            camera: node.data.params?.camera,
            numberOfImages: node.data.params?.numberOfImages || 1
          };

          const resultImages = await generateImageContent(params);
          console.log(">>> [NodeEditor] Final Result Images:", resultImages);

          // Store all results, set first as main result
          updateNodeData(id, { 
              results: resultImages, 
              result: resultImages[0], 
              error: undefined 
          });
          
          if (resultImages.length > 0) {
              const historyPayload = resultImages.map(img => ({
                  prompt: params.prompt,
                  imageData: img,
                  model: params.model,
                  aspectRatio: params.aspectRatio || "16:9",
                  camera: params.camera,
                  referenceImages: collectedImages 
              }));

              await addBatchToHistory(historyPayload);

              if (activeMenu === 'history') {
                 getHistory().then(setHistoryItems);
              }
          }

          return resultImages[0];
      }

    } catch (error: any) {
      console.error("Node Generation Error", error);
      let errorMessage = "Generation failed.";
      if (error instanceof Error) {
        errorMessage = error.message;
        if (errorMessage.includes("400")) errorMessage = "Invalid request or blocked by safety filters.";
        if (errorMessage.includes("503") || errorMessage.includes("500")) errorMessage = "Service unavailable. Please try again.";
        if (errorMessage.includes("429")) errorMessage = "Rate limit exceeded. Please wait a moment.";
        if (errorMessage.includes("DEMO_KEY_RESTRICTION")) {
            errorMessage = "Generation disabled (Demo Key). Please enter your own key in Settings.";
        }
      }
      updateNodeData(id, { result: undefined, results: undefined, error: errorMessage }); 
      return undefined;
    } finally {
      updateNodeData(id, { isLoading: false });
    }
  };

  const handleNodeRun = useCallback(async (id: string) => {
      await executeNode(id);
  }, [updateNodeData]);

  // --- Grouping Actions ---

  const handleGroupNodes = useCallback(() => {
    const currentlySelected = nodesRef.current.filter(n => n.selected);
    if (currentlySelected.length < 2) return;

    const roots = currentlySelected.filter(node => {
        if (!node.parentNode) return true; 
        return !currentlySelected.some(p => p.id === node.parentNode);
    });
    
    if (roots.length === 0) return;

    const rect = getRectOfNodes(roots);
    const padding = 60; 
    
    const groupId = `group-${Date.now()}`;
    const groupNode: Node<NodeData> = {
      id: groupId,
      type: NodeType.GROUP,
      position: { x: rect.x - padding, y: rect.y - padding },
      style: { 
        width: rect.width + padding * 2, 
        height: rect.height + padding * 2,
        zIndex: -1, 
      },
      data: { label: 'Cluster' },
      selected: true, 
    };

    setNodes((nds) => {
      const rootIds = new Set(roots.map(n => n.id));
      
      const updatedNodes = nds.map(n => {
          if (rootIds.has(n.id)) {
             return {
                 ...n,
                 parentNode: groupId,
                 extent: 'parent' as const,
                 position: { 
                    x: n.position.x - (rect.x - padding), 
                    y: n.position.y - (rect.y - padding) 
                 },
                 selected: false,
                 draggable: true, 
             };
          }
          return n;
      });

      return [groupNode, ...updatedNodes];
    });
    setContextMenu(null);
  }, [setNodes]);

  const handleUngroupNodes = useCallback((groupId?: string) => {
    // If no specific group ID is passed (e.g. from selection menu), try to find from selected nodes
    let targetGroupId = groupId;
    
    if (!targetGroupId) {
       // Check if a group node is explicitly selected
       const selectedGroup = nodesRef.current.find(n => n.selected && n.type === NodeType.GROUP);
       if (selectedGroup) {
           targetGroupId = selectedGroup.id;
       } else {
           // Check if any selected node has a parent
           const childNode = nodesRef.current.find(n => n.selected && n.parentNode);
           if (childNode) targetGroupId = childNode.parentNode;
       }
    }

    if (!targetGroupId) return;

    setNodes((nds) => {
      const groupNode = nds.find(n => n.id === targetGroupId);
      if (!groupNode) return nds;

      const children = nds.filter(n => n.parentNode === targetGroupId);
      const others = nds.filter(n => n.id !== targetGroupId && n.parentNode !== targetGroupId);
      
      const updatedChildren = children.map(n => {
         const absX = groupNode.position.x + n.position.x;
         const absY = groupNode.position.y + n.position.y;
         
         const { parentNode, extent, ...rest } = n;
         return {
            ...rest,
            position: { x: absX, y: absY },
            selected: true 
         };
      });

      return [...others, ...updatedChildren];
    });
  }, [setNodes]);

  const runNodeSequence = useCallback(async (nodesToRun: Node<NodeData>[]) => {
      const currentNodes = nodesRef.current;
      const currentEdges = edgesRef.current;
      
      if (nodesToRun.length === 0) return;
      const runNodeIds = new Set(nodesToRun.map(n => n.id));

      // Calculate dependencies strictly within the selection
      const adjacency = new Map<string, string[]>();
      const inDegree = new Map<string, number>();

      nodesToRun.forEach(n => {
          adjacency.set(n.id, []);
          inDegree.set(n.id, 0);
      });

      currentEdges.forEach(e => {
          if (runNodeIds.has(e.source) && runNodeIds.has(e.target)) {
              adjacency.get(e.source)?.push(e.target);
              inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
          }
      });

      // Topological Sort
      const queue = nodesToRun.filter(n => (inDegree.get(n.id) || 0) === 0);
      
      // Sort initial queue by Y position (top-down execution preference for independent nodes)
      queue.sort((a, b) => a.position.y - b.position.y);

      const executionOrder: string[] = [];
      const tempInDegree = new Map(inDegree);
      const processQueue = [...queue];

      while(processQueue.length > 0) {
          const node = processQueue.shift()!;
          executionOrder.push(node.id);

          const neighbors = adjacency.get(node.id) || [];
          for (const neighborId of neighbors) {
              tempInDegree.set(neighborId, (tempInDegree.get(neighborId)! - 1));
              if (tempInDegree.get(neighborId) === 0) {
                  const neighborNode = nodesToRun.find(n => n.id === neighborId);
                  if (neighborNode) processQueue.push(neighborNode);
              }
          }
      }
      
      if (executionOrder.length !== nodesToRun.length) {
          console.warn("Cycle detected or disconnected graph in sequence run. Running reachable nodes.");
      }

      // Execute
      for (const nodeId of executionOrder) {
          const node = currentNodes.find(n => n.id === nodeId);
          if (node && (node.type === NodeType.GEN_IMAGE || node.type === NodeType.GEN_TEXT)) {
             await executeNode(nodeId);
             await new Promise(r => setTimeout(r, 200));
          }
      }
  }, [executeNode]);

  const handleRunGroup = useCallback(async (groupId: string) => {
      const groupNodes = nodesRef.current.filter(n => n.parentNode === groupId);
      if (groupNodes.length === 0) return;
      await runNodeSequence(groupNodes);
  }, [runNodeSequence]);

  const handleRunSelectedSequence = useCallback(() => {
     // If a group is selected, run its children
     const selectedGroups = selectedNodes.filter(n => n.type === NodeType.GROUP);
     if (selectedGroups.length > 0) {
         selectedGroups.forEach(g => handleRunGroup(g.id));
         return;
     }
     // Otherwise run selected nodes in sequence
     runNodeSequence(selectedNodes);
  }, [selectedNodes, runNodeSequence, handleRunGroup]);

  const handleCreateWorkflow = useCallback((groupId?: string) => {
     setIsWorkflowModalOpen(true);
     setContextMenu(null);
  }, []);

  const handleSaveModalConfirm = async (data: { name: string; description: string; tags: string[] }) => {
     const nodesToSaveSet = new Set<Node<NodeData>>(selectedNodes.length > 0 ? selectedNodes : (nodes as Node<NodeData>[]));
     
     if (nodesToSaveSet.size === 0) {
         alert("No nodes to save!");
         return;
     }

     const currentNodes = nodesRef.current;
     let changed = true;
     while(changed) {
         changed = false;
         currentNodes.forEach(node => {
             if (!nodesToSaveSet.has(node as Node<NodeData>) && node.parentNode && Array.from(nodesToSaveSet).some(p => p.id === node.parentNode)) {
                 nodesToSaveSet.add(node as Node<NodeData>);
                 changed = true;
             }
         });
     }

     const nodesToSave = Array.from(nodesToSaveSet);
     const nodeIds = new Set(nodesToSave.map(n => n.id));
     const edgesToSave = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));

     const template = {
         name: data.name,
         description: data.description,
         tags: data.tags,
         nodes: nodesToSave as any,
         edges: edgesToSave
     };

     await saveWorkflowTemplate(template);
     setIsWorkflowModalOpen(false);
     alert(`Workflow "${data.name}" saved to library!`);
  };

  const handleClear = useCallback(() => {
      setNodes([]);
      setEdges([]);
  }, [setNodes, setEdges]);
  
  const handleAddFromHistory = useCallback((item: HistoryItem) => {
      const centerX = window.innerWidth / 2 - 150; 
      const centerY = window.innerHeight / 2 - 150;
      const offset = Math.random() * 50;

      const newNode: Node<NodeData> = {
        id: `hist-img-${Date.now()}`,
        type: NodeType.INPUT_IMAGE, 
        position: { x: centerX + offset, y: centerY + offset },
        data: {
            title: "Asset from History",
            image: item.imageData.includes(',') ? item.imageData.split(',')[1] : item.imageData, 
            preview: item.imageData 
        }
      };
      setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  const handleLoadWorkflow = useCallback((template: WorkflowTemplate) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      const templateNodes = template.nodes as unknown as Node<NodeData>[];
      const rootNodes = templateNodes.filter(n => !n.parentNode || !templateNodes.find(p => p.id === n.parentNode));
      const rect = getRectOfNodes(rootNodes.length > 0 ? rootNodes : templateNodes);
      
      const offsetX = centerX - (rect.x + rect.width/2);
      const offsetY = centerY - (rect.y + rect.height/2);

      const idMap = new Map<string, string>();
      templateNodes.forEach(n => {
          const newId = `${n.type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          idMap.set(n.id, newId);
      });

      const newNodes: Node<NodeData>[] = templateNodes.map(n => {
          const newId = idMap.get(n.id)!;
          let newParentNode = n.parentNode;
          let isChildOfImportedGroup = false;

          if (newParentNode && idMap.has(newParentNode)) {
              newParentNode = idMap.get(newParentNode);
              isChildOfImportedGroup = true;
          } else {
              newParentNode = undefined;
          }

          const position = isChildOfImportedGroup ? n.position : { 
              x: n.position.x + offsetX, 
              y: n.position.y + offsetY 
          };

          return {
              ...n,
              id: newId,
              parentNode: newParentNode,
              extent: (newParentNode ? 'parent' : undefined) as 'parent' | undefined,
              position: position,
              selected: true,
              data: { ...n.data } 
          };
      });
      
      const newEdges = template.edges.map(e => ({
          ...e,
          id: `e-${idMap.get(e.source)}-${idMap.get(e.target)}`,
          source: idMap.get(e.source),
          target: idMap.get(e.target)
      }));

      setNodes((nds) => [...nds.map(n => ({...n, selected: false})), ...newNodes]);
      setEdges((eds) => [...eds, ...newEdges]);
      setActiveMenu(null);
  }, [setNodes, setEdges]);
  
  const handleDeleteTemplate = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(confirm("Delete this workflow template?")) {
          await deleteWorkflowTemplate(id);
          getWorkflowTemplates().then(setWorkflowTemplates);
      }
  };

  const handleCopilotAddNodes = useCallback((newNodesData: any[], newConnections: any[]) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      // Calculate positions simply by placing them in a row for now
      const createdNodes: Node<NodeData>[] = newNodesData.map((n, i) => {
          const type = n.type || NodeType.GEN_TEXT;
          let params: any = { model: GeneratorModel.GEMINI_FLASH_TEXT };
          
          if (type === NodeType.GEN_IMAGE) {
              params = { 
                  model: GeneratorModel.GEMINI_FLASH_IMAGE, 
                  aspectRatio: "16:9", 
                  imageSize: "1K", 
                  numberOfImages: 1 
              };
          }

          return {
              id: `copilot-${Date.now()}-${i}`,
              type: type,
              position: { x: centerX + (i * 400), y: centerY },
              data: {
                  title: n.label || "AI Node",
                  text: n.prompt || "",
                  params: params
              }
          };
      });

      const createdEdges: Edge[] = [];
      newConnections.forEach(conn => {
          if (createdNodes[conn.fromIndex] && createdNodes[conn.toIndex]) {
              createdEdges.push({
                  id: `e-${createdNodes[conn.fromIndex].id}-${createdNodes[conn.toIndex].id}`,
                  source: createdNodes[conn.fromIndex].id,
                  target: createdNodes[conn.toIndex].id,
                  type: 'deletable',
                  animated: true,
                  style: { stroke: '#3b82f6', strokeWidth: 2 }
              });
          }
      });

      setNodes(nds => [...nds, ...createdNodes]);
      setEdges(eds => [...eds, ...createdEdges]);
  }, [setNodes, setEdges]);

  const nodesWithHandlers = nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      onChange: updateNodeData,
      onDelete: deleteNode,
      onRun: handleNodeRun,
      onAddNext: addNextNode,
      onEdit: (id: string, url: string) => { setEditingSourceNodeId(id); setEditingImage(url); setIsEditorOpen(true); },
      onRunGroup: handleRunGroup,
      onUngroup: handleUngroupNodes,
      onCreateWorkflow: handleCreateWorkflow
    }
  }));

  const addNode = (type: NodeType) => {
    const centerX = window.innerWidth / 2 - 150;
    const centerY = window.innerHeight / 2 - 100;
    
    let defaultParams: any = {};
    if (type === NodeType.GEN_IMAGE) {
        defaultParams = { model: GeneratorModel.GEMINI_FLASH_IMAGE, aspectRatio: "16:9", imageSize: "1K", numberOfImages: 1 };
    } else if (type === NodeType.GEN_TEXT) {
        defaultParams = { model: GeneratorModel.GEMINI_FLASH_TEXT };
    } else {
        // Fallback for generic calls
        defaultParams = { model: GeneratorModel.GEMINI_FLASH_IMAGE, aspectRatio: "16:9", imageSize: "1K", numberOfImages: 1 };
    }

    const id = `${type}-${Date.now()}`;
    const newNode: Node<NodeData> = {
      id,
      type,
      position: { x: centerX + Math.random() * 50, y: centerY + Math.random() * 50 },
      data: { 
        params: defaultParams
      }
    };
    setNodes((nds) => nds.concat(newNode));
    setActiveMenu(null); 
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
        <CopilotSidebar 
            isOpen={isCopilotOpen} 
            onClose={() => setIsCopilotOpen(false)}
            onAddNodes={handleCopilotAddNodes}
        />

        {/* Top Right Controls */}
        <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
           <button 
             onClick={() => setIsCopilotOpen(!isCopilotOpen)}
             className={`flex items-center gap-2 px-4 py-2 rounded-full border shadow-xl transition-all ${isCopilotOpen ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'}`}
           >
              <Sparkles size={16} />
              <span className="text-xs font-bold uppercase tracking-wide">Copilot</span>
           </button>
           
           <button 
              onClick={() => setIsLocked(!isLocked)}
              className={`w-10 h-10 flex items-center justify-center rounded-full border shadow-xl transition-all ${isLocked ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'}`}
              title={isLocked ? "Unlock Canvas" : "Lock Canvas"}
           >
              {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
           </button>
        </div>

        {/* Top Left Controls */}
        <div className="absolute top-6 left-6 z-50 flex items-center gap-4">
            <button 
                onClick={onBack}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all shadow-xl"
            >
                <ArrowLeft size={20} />
            </button>
            
            <div className="flex flex-col">
                <div className="flex items-center gap-2 group">
                    {isRenaming ? (
                        <input 
                            autoFocus
                            className="bg-zinc-900 text-white font-bold text-lg px-2 rounded border border-blue-500 outline-none w-64"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            onBlur={handleRenameProject}
                            onKeyDown={(e) => e.key === 'Enter' && handleRenameProject()}
                        />
                    ) : (
                        <h1 
                            className="text-lg font-bold text-white cursor-pointer hover:text-blue-400 transition-colors flex items-center gap-2"
                            onClick={() => setIsRenaming(true)}
                        >
                            {projectName}
                            <Pencil size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500" />
                        </h1>
                    )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                    {lastSaved ? (
                        <span className="flex items-center gap-1.5">
                            <Check size={10} className="text-green-500" />
                            Saved {lastSaved.toLocaleTimeString()}
                        </span>
                    ) : (
                        <span>Unsaved</span>
                    )}
                </div>
            </div>
        </div>

        <ReactFlow
            nodes={nodesWithHandlers}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setRfInstance}
            onSelectionChange={onSelectionChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={{ type: 'deletable', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } }}
            connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 2 }}
            minZoom={0.1}
            maxZoom={2}
            className="bg-black"
            proOptions={{ hideAttribution: true }}
            panOnDrag={isLocked ? false : [2]}
            selectionOnDrag={!isLocked}
            panOnScroll={!isLocked}
            zoomOnScroll={false}
            zoomOnPinch={!isLocked}
            selectionMode={SelectionMode.Partial}
            onPaneClick={onPaneClick}
            onNodeContextMenu={onNodeContextMenu}
        >
            <Background color="#27272a" gap={20} size={1} variant={BackgroundVariant.Dots} />
            <MiniMap 
                nodeStrokeColor="#3f3f46" 
                nodeColor="#18181b" 
                maskColor="rgba(0, 0, 0, 0.7)"
                className="!bg-zinc-900 !border !border-zinc-800 !rounded-xl !bottom-6 !left-6 !w-40 !h-40"
            />
            {/* New Floating Selection Menu */}
            <SelectionOverlay 
                selectedNodes={selectedNodes} 
                onCluster={handleGroupNodes}
                onRunSeq={handleRunSelectedSequence}
                onSave={() => handleCreateWorkflow()}
                onUngroup={() => handleUngroupNodes()}
            />
        </ReactFlow>

        {/* Right Click Context Menu (Simplified, now mostly replaced by Floating Menu but kept for backup/direct delete) */}
        {contextMenu && (
           <div 
             style={{ top: contextMenu.y, left: contextMenu.x }} 
             className="fixed z-[100] bg-zinc-950/95 border border-zinc-700 rounded-lg shadow-2xl p-1.5 w-48 flex flex-col gap-1 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
           >
               <button onClick={handleDeleteSelected} className="flex items-center gap-2 px-3 py-2 hover:bg-red-500/20 rounded-md text-xs font-medium text-red-400 hover:text-red-300 transition-colors">
                  <Trash2 size={14}/> 
                  Delete Selection
               </button>
           </div>
        )}

        {/* Bottom Dock Menu */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-4">
             {/* Sub Menus */}
             {activeMenu === 'add' && (
                 <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-700 p-2 rounded-2xl shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-2 mb-2">
                     <button onClick={() => addNode(NodeType.GEN_IMAGE)} className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-white/10 transition-all w-20 group">
                         <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform"><Sparkles size={16} /></div>
                         <span className="text-[10px] font-bold text-zinc-400 group-hover:text-white">Generator</span>
                     </button>
                     <button onClick={() => addNode(NodeType.GEN_TEXT)} className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-white/10 transition-all w-20 group">
                         <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform"><MessageSquareText size={16} /></div>
                         <span className="text-[10px] font-bold text-zinc-400 group-hover:text-white">Text Gen</span>
                     </button>
                     <div className="w-px h-8 bg-white/10" />
                     <button onClick={() => addNode(NodeType.INPUT_TEXT)} className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-white/10 transition-all w-20 group">
                         <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:scale-110 transition-transform"><Type size={16} /></div>
                         <span className="text-[10px] font-bold text-zinc-400 group-hover:text-white">Text</span>
                     </button>
                     <button onClick={() => addNode(NodeType.INPUT_IMAGE)} className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-white/10 transition-all w-20 group">
                         <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:scale-110 transition-transform"><ImageIcon size={16} /></div>
                         <span className="text-[10px] font-bold text-zinc-400 group-hover:text-white">Image</span>
                     </button>
                 </div>
             )}

             {/* ... existing menus for history and workflows ... */}
             {activeMenu === 'history' && (
                 <div className="bg-zinc-900/90 border border-zinc-700 p-3 rounded-2xl shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-2 mb-2 w-[400px]">
                      <div className="flex items-center justify-between mb-2 px-1">
                          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">History</span>
                          <button onClick={() => setActiveMenu(null)}><X size={14} className="text-zinc-500" /></button>
                      </div>
                      <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                          {historyItems.map(item => (
                              <button key={item.id} onClick={() => handleAddFromHistory(item)} className="aspect-square rounded-lg overflow-hidden border border-white/5 hover:border-blue-500 relative group bg-black/20">
                                  <img src={item.imageData.startsWith('data:') ? item.imageData : `data:image/png;base64,${item.imageData}`} className="w-full h-full object-contain" />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <Plus size={16} className="text-white" />
                                  </div>
                              </button>
                          ))}
                      </div>
                 </div>
             )}

            {activeMenu === 'workflows' && (
                 <div className="bg-zinc-900/90 border border-zinc-700 p-3 rounded-2xl shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-2 mb-2 w-[300px]">
                      <div className="flex items-center justify-between mb-2 px-1">
                          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Workflows</span>
                          <button onClick={() => setActiveMenu(null)}><X size={14} className="text-zinc-500" /></button>
                      </div>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                          {workflowTemplates.length === 0 && <div className="text-center py-4 text-xs text-zinc-500">No saved templates</div>}
                          {workflowTemplates.map(wf => (
                              <div key={wf.id} className="flex items-center justify-between p-2 rounded-lg bg-black/20 hover:bg-white/5 group">
                                  <button onClick={() => handleLoadWorkflow(wf)} className="flex-1 text-left">
                                      <div className="text-xs font-bold text-zinc-300 group-hover:text-white">{wf.name}</div>
                                      <div className="text-[9px] text-zinc-500">{wf.nodes.length} nodes</div>
                                  </button>
                                  <button onClick={(e) => handleDeleteTemplate(e, wf.id)} className="text-zinc-600 hover:text-red-400 p-1"><Trash2 size={12}/></button>
                              </div>
                          ))}
                      </div>
                 </div>
             )}

             {/* Main Bar */}
             <div className="flex items-center gap-2 bg-zinc-950/80 border border-zinc-800 p-1.5 rounded-full shadow-2xl backdrop-blur-xl">
                 <button 
                    onClick={() => setActiveMenu(activeMenu === 'add' ? null : 'add')}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${activeMenu === 'add' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
                    title="Add Node"
                 >
                    <Plus size={24} />
                 </button>
                 
                 <div className="w-px h-8 bg-zinc-800 mx-1" />
                 
                 <button 
                    onClick={() => {
                        setActiveMenu(activeMenu === 'history' ? null : 'history');
                        if(activeMenu !== 'history') getHistory().then(setHistoryItems);
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${activeMenu === 'history' ? 'bg-purple-600 text-white' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'}`}
                    title="History"
                 >
                    <Clock size={18} />
                 </button>

                 <button 
                    onClick={() => {
                        setActiveMenu(activeMenu === 'workflows' ? null : 'workflows');
                        if(activeMenu !== 'workflows') getWorkflowTemplates().then(setWorkflowTemplates);
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${activeMenu === 'workflows' ? 'bg-green-600 text-white' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'}`}
                    title="Workflows"
                 >
                    <Workflow size={18} />
                 </button>
                 
                 <div className="w-px h-8 bg-zinc-800 mx-1" />

                 <button 
                    onClick={handleClear}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-all"
                    title="Clear Canvas"
                 >
                    <Trash2 size={18} />
                 </button>
             </div>
        </div>

        <ImageEditor 
            isOpen={isEditorOpen}
            imageUrl={editingImage}
            onClose={() => setIsEditorOpen(false)}
            onSave={(newImage) => {
                if (editingSourceNodeId) {
                    updateNodeData(editingSourceNodeId, { result: newImage });
                }
                setIsEditorOpen(false);
            }}
        />

        <WorkflowModal 
            isOpen={isWorkflowModalOpen}
            onClose={() => setIsWorkflowModalOpen(false)}
            onSave={handleSaveModalConfirm}
        />

    </div>
  );
};
