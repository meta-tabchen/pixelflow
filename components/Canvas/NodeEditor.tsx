
import React, { useCallback, useState, useEffect, useRef } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
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
  OnSelectionChangeParams
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
  Share2
} from 'lucide-react';
import { generateImageContent, isKeyRequired } from '../../services/geminiService';
import { ImageEditor } from './ImageEditor';
import { WorkflowModal } from './WorkflowModal';
import { saveProjectData, loadProjectData, addToHistory, getHistory, getProjects, updateProjectName, saveWorkflowTemplate, getWorkflowTemplates, deleteWorkflowTemplate } from '../../services/storageService';

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
            position: { x: window.innerWidth / 2 - 190, y: window.innerHeight / 2 - 150 }, 
            data: { 
              text: "A futuristic cyberpunk city with neon lights, realistic, 8k",
              params: { model: GeneratorModel.GEMINI_FLASH_IMAGE, aspectRatio: "16:9", imageSize: "1K" }
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
    setEdges((eds) => addEdge({ ...params, type: 'deletable' }, eds));
  }, [setEdges]);

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
  }, [setNodes, setEdges]);

  const addNextNode = useCallback((sourceId: string) => {
    setNodes((nds) => {
        const sourceNode = nds.find(n => n.id === sourceId);
        if (!sourceNode) return nds;

        const newId = `${NodeType.GEN_IMAGE}-${Date.now()}`;
        const isSmallSource = sourceNode.type === NodeType.INPUT_IMAGE || sourceNode.type === NodeType.UPLOAD_IMAGE;
        const sourceWidth = isSmallSource ? 280 : 380;
        const gap = 80; 
        
        let newPos = { 
            x: sourceNode.position.x + sourceWidth + gap, 
            y: sourceNode.position.y 
        };

        const inheritedParams = sourceNode.data.params ? { ...sourceNode.data.params } : { model: GeneratorModel.GEMINI_FLASH_IMAGE, aspectRatio: "16:9", imageSize: "1K" };

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
  }, [setNodes, setEdges]);

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
    if (!node || !node.data.text) return;

    updateNodeData(id, { isLoading: true, result: undefined, error: undefined });

    try {
      const inputEdges = currentEdges.filter(e => e.target === id);
      const collectedImages: string[] = [];

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
              if (sourceNode.data.result && sourceNode.data.result.startsWith('data:image')) {
                  collectedImages.push(sourceNode.data.result);
              } else if (sourceNode.data.preview) {
                  collectedImages.push(sourceNode.data.preview);
              } else if (sourceNode.data.image) {
                   collectedImages.push(sourceNode.data.image);
              }
          }
      });

      const params = {
        prompt: node.data.text,
        images: collectedImages, 
        model: node.data.params?.model as GeneratorModel || GeneratorModel.GEMINI_FLASH_IMAGE,
        aspectRatio: node.data.params?.aspectRatio as any,
        imageSize: node.data.params?.imageSize as any,
        camera: node.data.params?.camera
      };

      const resultImage = await generateImageContent(params);
      
      updateNodeData(id, { result: resultImage, error: undefined });
      
      if (resultImage) {
          addToHistory({
              prompt: params.prompt,
              imageData: resultImage,
              model: params.model,
              aspectRatio: params.aspectRatio || "16:9",
              camera: params.camera,
              referenceImages: collectedImages 
          });
          if (activeMenu === 'history') {
             getHistory().then(setHistoryItems);
          }
      }

      return resultImage;

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
      updateNodeData(id, { result: undefined, error: errorMessage }); 
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
    const padding = 40; 
    
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
      data: { label: 'Node Group' },
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
             await new Promise(r => setTimeout(r, 200));
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

      setNodes((nds) => nds.map(n => ({...n, selected: false})).concat(newNodes));
      setEdges((eds) => eds.concat(newEdges));
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
        params: { model: GeneratorModel.GEMINI_FLASH_IMAGE, aspectRatio: "16:9", imageSize: "1K" }
      }
    };
    setNodes((nds) => nds.concat(newNode));
    setActiveMenu(null); 
  };

  return (
    <div className="relative w-full h-full bg-black">
        <ImageEditor 
            isOpen={isEditorOpen} 
            imageUrl={editingImage} 
            onClose={() => setIsEditorOpen(false)}
            onSave={(img) => {
                if (!editingSourceNodeId) return;
                setNodes((nds) => {
                    const sourceNode = nds.find(n => n.id === editingSourceNodeId);
                    if (!sourceNode) return nds;
                    const newId = `${NodeType.INPUT_IMAGE}-${Date.now()}`;
                    const newNode: Node<NodeData> = {
                        id: newId,
                        type: NodeType.INPUT_IMAGE,
                        position: { x: sourceNode.position.x + 400, y: sourceNode.position.y },
                        data: { title: "Annotated Image", image: img.split(',')[1], preview: img }
                    };
                    // Fixed addEdge call by providing a unique id to the new edge object
                    setEdges((eds) => addEdge({ id: `e-${editingSourceNodeId}-${newId}`, source: editingSourceNodeId!, target: newId, type: 'deletable', animated: true }, eds));
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
            <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
               <div className="bg-[#18181b] border border-zinc-700 rounded-full shadow-2xl px-2 py-1.5 flex items-center gap-2 pointer-events-auto">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse ml-2"></div>
                  <span className="text-xs font-bold text-zinc-300 mr-2">{selectedNodes.length} items</span>
                  <div className="h-4 w-px bg-zinc-700"></div>
                  <button onClick={handleGroupNodes} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-full text-white shadow-lg shadow-blue-900/20 transition-all text-xs font-bold">
                     <BoxSelect size={14} />
                     打组 (Group)
                  </button>
               </div>
            </div>
        )}

        {/* --- Floating Sidebar --- */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4 pointer-events-none">
            <div className="pointer-events-auto bg-[#18181b]/95 backdrop-blur-md border border-white/5 rounded-full p-2 flex flex-col items-center gap-4 shadow-2xl py-4 w-14">
                <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all mb-2" title="Back to Dashboard">
                    <Grid size={18} />
                </button>
                <div className="w-6 h-px bg-white/5"></div>
                
                <div className="relative">
                    <button onClick={() => setActiveMenu(activeMenu === 'add' ? null : 'add')} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${activeMenu === 'add' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
                        <Shapes size={20} strokeWidth={1.5} />
                    </button>
                    {activeMenu === 'add' && (
                        <div className="absolute left-14 top-0 ml-4 w-60 bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl p-2 flex flex-col gap-1 animate-in fade-in slide-in-from-left-4 z-50">
                            <button onClick={() => addNode(NodeType.INPUT_TEXT)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group text-left">
                                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-zinc-200"><Type size={16} /></div>
                                <span className="text-sm font-medium text-zinc-200">Text Prompt</span>
                            </button>
                            <button onClick={() => addNode(NodeType.GEN_IMAGE)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group text-left">
                                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-zinc-200"><ImageIcon size={16} /></div>
                                <span className="text-sm font-medium text-zinc-200">Image Generation</span>
                            </button>
                            <button onClick={() => addNode(NodeType.UPLOAD_IMAGE)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group text-left">
                                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-zinc-200"><Upload size={16} /></div>
                                <span className="text-sm font-medium text-zinc-200">Upload Asset</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <button onClick={() => { setActiveMenu(activeMenu === 'workflows' ? null : 'workflows'); getWorkflowTemplates().then(setWorkflowTemplates); }} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${activeMenu === 'workflows' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`} title="Workflow Library">
                        <Network size={20} strokeWidth={1.5} />
                    </button>
                    {activeMenu === 'workflows' && (
                        <div className="absolute left-14 top-[-250px] ml-4 w-72 h-[500px] bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl flex flex-col animate-in fade-in slide-in-from-left-4 z-50 overflow-hidden">
                             <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                                <h3 className="text-sm font-bold text-zinc-300">Workflows</h3>
                                <button onClick={() => setActiveMenu(null)}><X size={14} className="text-zinc-500 hover:text-white" /></button>
                             </div>
                             <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                                 {workflowTemplates.map((item) => (
                                     <div key={item.id} className="group relative bg-zinc-900 rounded-lg p-3 border border-zinc-800 hover:border-blue-500/50 cursor-pointer" onClick={() => handleLoadWorkflow(item)}>
                                         <span className="text-sm font-medium text-zinc-200 line-clamp-1">{item.name}</span>
                                     </div>
                                 ))}
                             </div>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <button onClick={() => { setActiveMenu(activeMenu === 'history' ? null : 'history'); getHistory().then(setHistoryItems); }} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${activeMenu === 'history' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`} title="History">
                        <Clock size={20} strokeWidth={1.5} />
                    </button>
                    {activeMenu === 'history' && (
                        <div className="absolute left-14 top-[-200px] ml-4 w-72 h-[500px] bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl flex flex-col animate-in fade-in slide-in-from-left-4 z-50 overflow-hidden">
                             <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                                <h3 className="text-sm font-bold text-zinc-300">History</h3>
                                <button onClick={() => setActiveMenu(null)}><X size={14} className="text-zinc-500 hover:text-white" /></button>
                             </div>
                             <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                                 {historyItems.map((item) => (
                                     <div key={item.id} className="group relative rounded-lg overflow-hidden border border-zinc-800 hover:border-blue-500/50 cursor-pointer" onClick={() => handleAddFromHistory(item)}>
                                         <img src={item.imageData} className="w-full h-auto object-cover opacity-80 group-hover:opacity-100" />
                                     </div>
                                 ))}
                             </div>
                        </div>
                    )}
                </div>

                <div className="w-6 h-px bg-white/5 my-1"></div>
                 <div onClick={onOpenSettings} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all cursor-pointer">
                     <MessageSquare size={18} />
                 </div>
            </div>
        </div>

        <div className="absolute top-6 left-8 z-40 flex items-center gap-3">
             <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg"><Scan className="text-white w-5 h-5" /></div>
             <div className="flex flex-col">
                <button onClick={() => setIsRenaming(true)} className="text-zinc-200 font-medium leading-none text-left flex items-center gap-2 group">
                   {projectName} <Pencil size={10} className="opacity-0 group-hover:opacity-50" />
                </button>
                {lastSaved && <span className="text-[10px] text-zinc-500 mt-1">Saved {lastSaved.toLocaleTimeString()}</span>}
             </div>
        </div>
        
        <div className="w-full h-full">
          {!isLoaded ? (
              <div className="w-full h-full flex items-center justify-center">
                  <span className="text-zinc-500 text-sm animate-pulse">Loading Workspace...</span>
              </div>
          ) : (
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
            >
                <Background color="#27272a" gap={24} size={1} variant={BackgroundVariant.Dots} className="bg-black" />
                <Controls className="!bg-[#18181b] !border-white/5 !fill-zinc-400 !text-zinc-400 !rounded-xl overflow-hidden shadow-xl !left-auto !right-6 !bottom-6 !m-0" />
                <MiniMap className="!bg-[#18181b] !border-white/5 !rounded-xl overflow-hidden shadow-xl !bottom-6 !right-24 !m-0" maskColor="rgba(0, 0, 0, 0.6)" />
            </ReactFlow>
          )}
        </div>
    </div>
  );
};
