
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
  ReactFlowInstance
} from 'reactflow';
// Added NodeData to the imported types to fix property access errors on node.data
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
  Workflow
} from 'lucide-react';
import { generateImageContent, isKeyRequired } from '../../services/geminiService';
import { ImageEditor } from './ImageEditor';
import { WorkflowModal } from './WorkflowModal';
import { saveProjectData, loadProjectData, addToHistory, addBatchToHistory, getHistory, getProjects, updateProjectName, saveWorkflowTemplate, getWorkflowTemplates, deleteWorkflowTemplate } from '../../services/storageService';

const edgeTypes = {
  deletable: DeletableEdge,
};

interface NodeEditorProps {
    projectId: string;
    onBack: () => void;
    onOpenSettings?: () => void;
}

export const NodeEditor: React.FC<NodeEditorProps> = ({ projectId, onBack, onOpenSettings }) => {
  // React Flow State - Added NodeData generic to useNodesState to fix type errors when accessing data
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Selection State - Explicitly typed to Node<NodeData>[]
  const [selectedNodes, setSelectedNodes] = useState<Node<NodeData>[]>([]);
  
  // Instance State for Custom Controls
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [isLocked, setIsLocked] = useState(false);

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

  // Fixed updateNodeData to handle newData as Partial<NodeData> correctly
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

        const inheritedParams = sourceNode.data.params ? { ...sourceNode.data.params } : { model: GeneratorModel.GEMINI_FLASH_IMAGE, aspectRatio: "16:9", imageSize: "1K", numberOfImages: 1 };

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
    // Allow empty generator text if we have connected input text nodes
    if (!node) return;

    updateNodeData(id, { isLoading: true, result: undefined, results: undefined, error: undefined });

    try {
      const inputEdges = currentEdges.filter(e => e.target === id);
      const collectedImages: string[] = [];
      const collectedTexts: string[] = [];

      if (node.data.image) {
          collectedImages.push(node.data.image);
      }

      inputEdges.forEach(edge => {
          if (overrides && overrides.has(edge.source)) {
               const overrideData = overrides.get(edge.source);
               if (overrideData?.result) {
                   collectedImages.push(overrideData.result);
                   return;
               }
          }

          const sourceNode = currentNodes.find(n => n.id === edge.source);
          if (sourceNode) {
              // Image Collection
              if (sourceNode.data.result && sourceNode.data.result.startsWith('data:image')) {
                  collectedImages.push(sourceNode.data.result);
              } else if (sourceNode.data.preview) {
                  collectedImages.push(sourceNode.data.preview);
              } else if (sourceNode.data.image) {
                   collectedImages.push(sourceNode.data.image);
              }

              // Text Collection
              if (sourceNode.type === NodeType.INPUT_TEXT && sourceNode.data.text) {
                  collectedTexts.push(sourceNode.data.text);
              }
          }
      });

      // Combine prompts: Generator Text + Input Text Nodes
      const promptParts = [node.data.text, ...collectedTexts].filter(t => t && t.trim().length > 0);
      
      if (promptParts.length === 0) {
          throw new Error("No prompt provided. Please add text to the generator or connect a text node.");
      }

      const finalPrompt = promptParts.join(", ");

      const params = {
        prompt: finalPrompt,
        images: collectedImages, 
        model: node.data.params?.model as GeneratorModel || GeneratorModel.GEMINI_FLASH_IMAGE,
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
          // Add ALL images to history
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

    } catch (error: any) {
      console.error("Node Generation Error", error);
      let errorMessage = "Generation failed.";
      if (error instanceof Error) {
        errorMessage = error.message;
        if (errorMessage.includes("400")) errorMessage = "Invalid request or blocked by safety filters.";
        if (errorMessage.includes("503") || errorMessage.includes("500")) errorMessage = "Service unavailable. Please try again.";
        if (errorMessage.includes("429")) errorMessage = "Rate limit exceeded. Please wait a moment.";
        if (errorMessage.includes("DEMO_KEY_RESTRICTION")) {
            errorMessage = "Image generation disabled (Demo Key). Please enter your own key in Settings.";
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
  }, [setNodes]);

  const handleUngroupNodes = useCallback((groupId: string) => {
    setNodes((nds) => {
      const groupNode = nds.find(n => n.id === groupId);
      if (!groupNode) return nds;

      const children = nds.filter(n => n.parentNode === groupId);
      const others = nds.filter(n => n.id !== groupId && n.parentNode !== groupId);
      
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

  const handleRunGroup = useCallback(async (groupId: string) => {
      const currentNodes = nodesRef.current;
      const currentEdges = edgesRef.current;
      
      const groupNodes = currentNodes.filter(n => n.parentNode === groupId);
      const groupNodeIds = new Set(groupNodes.map(n => n.id));

      if (groupNodes.length === 0) return;

      const internalEdges = currentEdges.filter(e => 
          groupNodeIds.has(e.source) && groupNodeIds.has(e.target)
      );

      const adjacency = new Map<string, string[]>();
      const inDegree = new Map<string, number>();

      groupNodes.forEach(n => {
          adjacency.set(n.id, []);
          inDegree.set(n.id, 0);
      });

      internalEdges.forEach(e => {
          adjacency.get(e.source)?.push(e.target);
          inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
      });

      const queue = groupNodes.filter(n => (inDegree.get(n.id) || 0) === 0);
      
      queue.sort((a, b) => {
          if (Math.abs(a.position.y - b.position.y) > 50) return a.position.y - b.position.y;
          return a.position.x - b.position.x;
      });

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
                  const neighborNode = groupNodes.find(n => n.id === neighborId);
                  if (neighborNode) processQueue.push(neighborNode);
              }
          }
      }

      const groupRunResults = new Map<string, any>();

      for (const nodeId of executionOrder) {
          const node = currentNodes.find(n => n.id === nodeId);
          if (node && (node.type === NodeType.GEN_IMAGE || node.type === NodeType.PROCESS_GENERATOR)) {
             const result = await executeNode(nodeId, groupRunResults);
             if (result) {
                 groupRunResults.set(nodeId, { result });
             }
             // Increased delay to ensure state updates propagate if needed and visually separate steps
             await new Promise(r => setTimeout(r, 500));
          }
      }

  }, [handleNodeRun]);

  const handleCreateWorkflow = useCallback((groupId?: string) => {
     setIsWorkflowModalOpen(true);
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

      // Fixed type casting for newNodes to prevent ConcatArray error
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
              // Fixed type casting for 'extent'
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

      // Use spread syntax instead of concat to avoid strict type mismatch with optional properties
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

    const id = `${type}-${Date.now()}`;
    const newNode: Node<NodeData> = {
      id,
      type,
      position: { x: centerX + Math.random() * 50, y: centerY + Math.random() * 50 },
      data: { 
        params: { model: GeneratorModel.GEMINI_FLASH_IMAGE, aspectRatio: "16:9", imageSize: "1K", numberOfImages: 1 }
      }
    };
    setNodes((nds) => nds.concat(newNode));
    setActiveMenu(null); 
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
        <ImageEditor 
            isOpen={isEditorOpen} 
            imageUrl={editingImage} 
            onClose={() => setIsEditorOpen(false)}
            onSave={(img) => {
                if (!editingSourceNodeId) return;
                setNodes((nds) => {
                    const sourceNode = nds.find(n => n.id === editingSourceNodeId);
                    if (!sourceNode) return nds;
                    const newId = `${NodeType.GEN_IMAGE}-${Date.now()}`;
                    const newNode: Node<NodeData> = {
                        id: newId,
                        type: NodeType.GEN_IMAGE,
                        position: { x: sourceNode.position.x + 420, y: sourceNode.position.y },
                        data: { 
                            title: "Edited Asset", 
                            result: img, // Show as result
                            image: img.split(',')[1], // Store as input for regeneration
                            text: sourceNode.data.text || "Variation of edited image...", 
                            params: sourceNode.data.params || { model: GeneratorModel.GEMINI_FLASH_IMAGE, aspectRatio: "16:9", imageSize: "1K", numberOfImages: 1 }
                        }
                    };
                    setEdges((eds) => addEdge({ id: `e-${editingSourceNodeId}-${newId}`, source: editingSourceNodeId!, target: newId, type: 'deletable', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } }, eds));
                    return [...nds, newNode];
                });
                setIsEditorOpen(false);
            }}
        />

        <WorkflowModal 
            isOpen={isWorkflowModalOpen}
            onClose={() => setIsWorkflowModalOpen(false)}
            onSave={handleSaveModalConfirm}
        />

        {selectedNodes.length > 1 && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
               <div className="glass-panel bg-black/80 rounded-full shadow-2xl px-3 py-2 flex items-center gap-3 pointer-events-auto">
                  <div className="flex items-center gap-2 pl-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-bold text-white tracking-wide">{selectedNodes.length} SELECTED</span>
                  </div>
                  <div className="h-4 w-px bg-white/10"></div>
                  <button onClick={handleGroupNodes} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-full text-white shadow-lg shadow-blue-900/20 transition-all text-[10px] font-bold uppercase tracking-wider">
                     <BoxSelect size={12} />
                     Group
                  </button>
                  <button onClick={() => setIsWorkflowModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-full text-white shadow-lg transition-all text-[10px] font-bold uppercase tracking-wider">
                     <Save size={12} />
                     Save Workflow
                  </button>
               </div>
            </div>
        )}

        {/* --- Floating Sidebar --- */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4 pointer-events-none">
            <div className="pointer-events-auto bg-zinc-950/90 backdrop-blur-xl rounded-2xl p-3 flex flex-col items-center gap-6 shadow-2xl py-6 w-18 border border-zinc-800">
                {/* Back Button */}
                <div className="relative group/menu">
                    <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover/menu:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10 z-[60]">
                        Back to Dashboard
                    </div>
                    <button onClick={onBack} className="w-10 h-10 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center transition-all border border-zinc-800" title="Back to Dashboard">
                        <ArrowLeft size={20} />
                    </button>
                </div>

                <div className="w-8 h-px bg-white/5"></div>
                
                {/* Add Node Button */}
                <div 
                    className="relative group/menu"
                    onMouseEnter={() => setActiveMenu('add')}
                    onMouseLeave={() => setActiveMenu(null)}
                >
                    <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover/menu:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10 z-[60]">
                        Add Nodes
                    </div>
                    <button className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${activeMenu === 'add' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'}`}>
                        {activeMenu === 'add' ? <X size={24} /> : <Sparkles size={24} strokeWidth={2.5} />}
                    </button>
                    {activeMenu === 'add' && (
                        // Changed ml-6 to pl-6 on absolute container to bridge the hover gap
                        <div className="absolute left-full pl-6 top-1/2 -translate-y-1/2 w-[280px] animate-in fade-in slide-in-from-left-4 z-[70]">
                            <div className="bg-zinc-950 rounded-2xl shadow-2xl p-2 flex flex-col gap-1 border border-zinc-800 ring-1 ring-white/5">
                                <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 mb-1">
                                    Node Library
                                </div>
                                <button onClick={() => addNode(NodeType.INPUT_TEXT)} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group text-left">
                                    <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:text-blue-400 group-hover:bg-blue-500/10 border border-white/5"><Type size={18} /></div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-zinc-200">Text Prompt</span>
                                        <span className="text-[10px] text-zinc-500">Raw text input source</span>
                                    </div>
                                </button>
                                <button onClick={() => addNode(NodeType.GEN_IMAGE)} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group text-left">
                                    <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:text-purple-400 group-hover:bg-purple-500/10 border border-white/5"><Cpu size={18} /></div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-zinc-200">Generator</span>
                                        <span className="text-[10px] text-zinc-500">AI Image synthesis</span>
                                    </div>
                                </button>
                                <button onClick={() => addNode(NodeType.UPLOAD_IMAGE)} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group text-left">
                                    <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:text-green-400 group-hover:bg-green-500/10 border border-white/5"><Upload size={18} /></div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-zinc-200">Upload Asset</span>
                                        <span className="text-[10px] text-zinc-500">Import local media</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Workflow Library */}
                <div 
                    className="relative group/menu"
                    onMouseEnter={() => { setActiveMenu('workflows'); getWorkflowTemplates().then(setWorkflowTemplates); }}
                    onMouseLeave={() => setActiveMenu(null)}
                >
                    <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover/menu:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10 z-[60]">
                        Workflows
                    </div>
                    <button className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeMenu === 'workflows' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'}`} title="Workflow Library">
                        <Workflow size={20} strokeWidth={1.5} />
                    </button>
                    {activeMenu === 'workflows' && (
                        // Changed ml-6 to pl-6 on absolute container
                        <div className="absolute left-full pl-6 top-[-200px] w-[300px] h-[500px] animate-in fade-in slide-in-from-left-4 z-[70]">
                             <div className="w-full h-full bg-zinc-950 rounded-2xl shadow-2xl flex flex-col border border-zinc-800 ring-1 ring-white/5 overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Workflows</h3>
                                    <button onClick={() => setActiveMenu(null)}><X size={14} className="text-zinc-500 hover:text-white" /></button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                                    {workflowTemplates.length === 0 ? <div className="text-center p-4 text-zinc-600 text-xs">No templates saved.</div> : null}
                                    {workflowTemplates.map((item) => (
                                        <div key={item.id} className="group relative bg-zinc-900/50 rounded-lg p-3 border border-zinc-800 hover:border-blue-500/50 cursor-pointer transition-all" onClick={() => handleLoadWorkflow(item)}>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-zinc-300 group-hover:text-white">{item.name}</span>
                                                <button onClick={(e) => handleDeleteTemplate(e, item.id)} className="text-zinc-600 hover:text-red-500"><Trash2 size={12} /></button>
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {item.tags.slice(0, 3).map((tag, i) => (
                                                    <span key={i} className="text-[9px] bg-black/40 text-zinc-500 px-1.5 py-0.5 rounded border border-white/5">{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        </div>
                    )}
                </div>

                {/* History */}
                <div 
                    className="relative group/menu"
                    onMouseEnter={() => { setActiveMenu('history'); getHistory().then(setHistoryItems); }}
                    onMouseLeave={() => setActiveMenu(null)}
                >
                    <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover/menu:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10 z-[60]">
                        History
                    </div>
                    <button className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeMenu === 'history' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'}`} title="History">
                        <Clock size={20} strokeWidth={1.5} />
                    </button>
                    {activeMenu === 'history' && (
                        // Changed ml-6 to pl-6 on absolute container
                        <div className="absolute left-full pl-6 top-[-150px] w-[300px] h-[500px] animate-in fade-in slide-in-from-left-4 z-[70]">
                             <div className="w-full h-full bg-zinc-950 rounded-2xl shadow-2xl flex flex-col border border-zinc-800 ring-1 ring-white/5 overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">History</h3>
                                    <button onClick={() => setActiveMenu(null)}><X size={14} className="text-zinc-500 hover:text-white" /></button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                                    {historyItems.map((item) => (
                                        <div key={item.id} className="group relative rounded-lg overflow-hidden border border-zinc-800 hover:border-blue-500/50 cursor-pointer transition-all" onClick={() => handleAddFromHistory(item)}>
                                            <img src={item.imageData} className="w-full h-auto object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100">
                                                <p className="text-[9px] text-white line-clamp-1">{item.prompt}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Project Name & Status */}
        <div className="absolute top-6 left-6 z-40 flex items-center gap-4 bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl border border-white/5 shadow-xl">
             <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center border border-blue-500/30 text-blue-400"><Cpu size={20} /></div>
             <div className="flex flex-col justify-center min-h-[40px]">
                {isRenaming ? (
                    <div className="flex items-center gap-2 animate-in fade-in duration-200">
                        <input 
                            autoFocus
                            className="bg-zinc-900/50 border border-blue-500/50 text-white font-bold text-sm rounded px-2 py-0.5 outline-none w-40 placeholder-white/20"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            onKeyDown={(e) => {
                                e.stopPropagation(); 
                                if (e.key === 'Enter') handleRenameProject();
                                if (e.key === 'Escape') setIsRenaming(false);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                        />
                        <button 
                            onClick={handleRenameProject} 
                            className="w-6 h-6 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 flex items-center justify-center transition-colors"
                            title="Save Name"
                        >
                            <Check size={12} strokeWidth={3} />
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={() => setIsRenaming(true)} 
                        className="text-white font-bold leading-none text-left flex items-center gap-2 group text-sm hover:text-blue-200 transition-colors"
                        title="Click to Rename"
                    >
                       {projectName} 
                       <Pencil size={12} className="opacity-0 group-hover:opacity-100 text-zinc-500 transition-opacity" />
                    </button>
                )}
                
                {!isRenaming && lastSaved && <span className="text-[10px] text-zinc-500 mt-1 font-mono">AUTOSAVE: {lastSaved.toLocaleTimeString()}</span>}
             </div>
        </div>
        
        <div className="w-full h-full">
          {!isLoaded ? (
              <div className="w-full h-full flex items-center justify-center bg-black">
                  <div className="flex flex-col items-center gap-4">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-zinc-500 text-xs font-mono animate-pulse">INITIALIZING WORKSPACE...</span>
                  </div>
              </div>
          ) : (
            <>
            <ReactFlow
                nodes={nodesWithHandlers}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onSelectionChange={onSelectionChange}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                proOptions={{ hideAttribution: true }}
                selectionOnDrag={true} 
                panOnDrag={[1, 2]}
                selectionMode={SelectionMode.Partial}
                minZoom={0.1}
                nodesDraggable={!isLocked}
                elementsSelectable={!isLocked}
                zoomOnScroll={!isLocked}
                panOnScroll={!isLocked}
                onInit={setRfInstance}
            >
                <Background color="#18181b" gap={40} size={1} variant={BackgroundVariant.Dots} className="bg-black" />
                
                {/* Repositioned MiniMap and Controls to Bottom Right, stacked */}
                <MiniMap 
                    className="!absolute !left-auto !bottom-[90px] !right-6 !m-0 !w-[200px] !h-[120px] !bg-[#18181b] !border !border-white/10 !rounded-2xl overflow-hidden !shadow-2xl !z-50" 
                    maskColor="rgba(0, 0, 0, 0.7)" 
                    nodeColor={() => '#3b82f6'} 
                />
            </ReactFlow>

             {/* Custom Controls Bar */}
             <div className="absolute bottom-6 right-6 z-50 flex items-center gap-2">
                <div className="h-14 w-[200px] bg-zinc-950/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl flex items-center justify-between px-3 p-2">
                   <button 
                     onClick={() => rfInstance?.zoomOut()}
                     className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all active:scale-90"
                     title="Zoom Out"
                   >
                     <Minus size={16} />
                   </button>
                   
                   <button 
                     onClick={() => rfInstance?.zoomIn()}
                     className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all active:scale-90"
                     title="Zoom In"
                   >
                     <Plus size={16} />
                   </button>

                   <div className="w-px h-6 bg-white/5"></div>

                   <button 
                     onClick={() => rfInstance?.fitView()}
                     className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all active:scale-90"
                     title="Fit View"
                   >
                     <Maximize size={16} />
                   </button>

                   <button 
                     onClick={() => setIsLocked(!isLocked)}
                     className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90 ${isLocked ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'hover:bg-white/10 text-zinc-400 hover:text-white'}`}
                     title={isLocked ? "Unlock Canvas" : "Lock Canvas"}
                   >
                     {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                   </button>
                </div>
             </div>
             </>
          )}
        </div>
    </div>
  );
};
