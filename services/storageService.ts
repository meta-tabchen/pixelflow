import { get, set, del } from 'idb-keyval';
import { Node, Edge } from 'reactflow';
import { ProjectMeta, HistoryItem, WorkflowTemplate } from '../types';

const PROJECTS_INDEX_KEY = 'aether_projects_index';
const HISTORY_KEY = 'aether_global_history';
const WORKFLOWS_LIBRARY_KEY = 'aether_workflows_library';

// --- Project Management ---

export const getProjects = async (): Promise<ProjectMeta[]> => {
  return (await get<ProjectMeta[]>(PROJECTS_INDEX_KEY)) || [];
};

export const createProject = async (name: string): Promise<string> => {
  const projects = await getProjects();
  const newId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const newProject: ProjectMeta = {
    id: newId,
    name: name,
    lastModified: Date.now(),
    nodeCount: 0
  };

  await set(PROJECTS_INDEX_KEY, [newProject, ...projects]);
  return newId;
};

export const deleteProject = async (id: string) => {
  const projects = await getProjects();
  const updatedProjects = projects.filter(p => p.id !== id);
  await set(PROJECTS_INDEX_KEY, updatedProjects);
  await del(`project_data_${id}`);
};

export const updateProjectName = async (id: string, newName: string) => {
    const projects = await getProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
        projects[index].name = newName;
        projects[index].lastModified = Date.now();
        await set(PROJECTS_INDEX_KEY, projects);
    }
};

export const saveProjectData = async (id: string, nodes: Node[], edges: Edge[]) => {
  try {
    // 1. Save the actual graph data
    const cleanNodes = nodes.map(n => {
      const { onChange, onDelete, onRun, onAddNext, onEdit, onRunGroup, onUngroup, onCreateWorkflow, ...serializableData } = n.data || {};
      return { ...n, data: serializableData };
    });
    
    await set(`project_data_${id}`, { nodes: cleanNodes, edges });

    // 2. Update Metadata (last modified)
    const projects = await getProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
      projects[index].lastModified = Date.now();
      projects[index].nodeCount = nodes.length;
      await set(PROJECTS_INDEX_KEY, projects);
    }
  } catch (e) {
    console.error('Failed to save project', e);
  }
};

export const loadProjectData = async (id: string) => {
  try {
    const data = await get<{ nodes: Node[], edges: Edge[] }>(`project_data_${id}`);
    return data || { nodes: [], edges: [] };
  } catch (e) {
    console.error('Failed to load project', e);
    return { nodes: [], edges: [] };
  }
};

// --- History Management ---

export const addToHistory = async (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
  try {
    const history = (await get<HistoryItem[]>(HISTORY_KEY)) || [];
    const newItem: HistoryItem = {
      ...item,
      id: `hist_${Date.now()}`,
      timestamp: Date.now(),
    };
    // Keep last 100 images to prevent storage bloat
    const updatedHistory = [newItem, ...history].slice(0, 100);
    await set(HISTORY_KEY, updatedHistory);
  } catch (e) {
    console.error('Failed to save history', e);
  }
};

export const getHistory = async (): Promise<HistoryItem[]> => {
  return (await get<HistoryItem[]>(HISTORY_KEY)) || [];
};

// --- Workflow Library Management ---

export const saveWorkflowTemplate = async (template: Omit<WorkflowTemplate, 'id' | 'createdAt'>) => {
    try {
        const library = (await get<WorkflowTemplate[]>(WORKFLOWS_LIBRARY_KEY)) || [];
        
        // Clean nodes before saving
        const cleanNodes = template.nodes.map(n => {
            const { onChange, onDelete, onRun, onAddNext, onEdit, onRunGroup, onUngroup, onCreateWorkflow, ...serializableData } = n.data || {};
            // Reset IDs to be relative or distinct if needed, but for templates, keeping structure is key.
            // We might handle ID re-generation on import.
            return { ...n, data: serializableData };
        });

        const newTemplate: WorkflowTemplate = {
            ...template,
            nodes: cleanNodes,
            id: `wf_${Date.now()}`,
            createdAt: Date.now()
        };

        await set(WORKFLOWS_LIBRARY_KEY, [newTemplate, ...library]);
        return newTemplate;
    } catch (e) {
        console.error("Failed to save workflow template", e);
    }
};

export const getWorkflowTemplates = async (): Promise<WorkflowTemplate[]> => {
    return (await get<WorkflowTemplate[]>(WORKFLOWS_LIBRARY_KEY)) || [];
};

export const deleteWorkflowTemplate = async (id: string) => {
    const library = await getWorkflowTemplates();
    const updated = library.filter(t => t.id !== id);
    await set(WORKFLOWS_LIBRARY_KEY, updated);
};


// Legacy support (optional helper to migrate old single-file save if needed, skipped for brevity)
export const clearWorkflow = async () => {
    // Clears everything
    await del(PROJECTS_INDEX_KEY);
    await del(HISTORY_KEY);
    await del(WORKFLOWS_LIBRARY_KEY);
};