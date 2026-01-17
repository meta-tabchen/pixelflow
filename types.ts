
import React from 'react';

export enum NodeType {
  INPUT_TEXT = 'INPUT_TEXT',
  INPUT_IMAGE = 'INPUT_IMAGE',
  UPLOAD_IMAGE = 'UPLOAD_IMAGE',
  PROCESS_OPTIMIZER = 'PROCESS_OPTIMIZER',
  PROCESS_GENERATOR = 'PROCESS_GENERATOR',
  OUTPUT_RESULT = 'OUTPUT_RESULT',
  GEN_IMAGE = 'GEN_IMAGE',
  GEN_TEXT = 'GEN_TEXT', // New Text Gen Node
  GROUP = 'GROUP', 
}

export interface NodeData {
  text?: string;
  image?: string; // Base64 (Input or Main Selected Output)
  params?: {
    aspectRatio?: string;
    model: string;
    imageSize?: string;
    camera?: string; 
    numberOfImages?: number; // New: Batch size
    temperature?: number; // New for text
  };
  result?: string; // The "Main" selected image OR generated text
  results?: string[]; // All generated images in this batch
  error?: string; 
  isLoading?: boolean;
  preview?: string;
  title?: string;
  label?: string; 
  
  // Actions
  onChange?: (id: string, data: any) => void;
  onDelete?: (id: string) => void;
  onRun?: (id: string) => Promise<void>; 
  onAddNext?: (id: string) => void;
  onEdit?: (id: string, imageData: string) => void;
  
  // Group Specific Actions
  onRunGroup?: (id: string) => void;
  onUngroup?: (id: string) => void;
  onCreateWorkflow?: (id: string) => void;
}

export interface Node {
  id: string;
  type: NodeType | string; 
  x?: number;
  y?: number;
  position: { x: number; y: number }; 
  data: NodeData;
  title?: string;
  parentNode?: string;
  extent?: 'parent';
  style?: React.CSSProperties;
  width?: number;
  height?: number;
  selected?: boolean;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
}

export enum GeneratorModel {
  GEMINI_FLASH_IMAGE = 'gemini-2.5-flash-image',
  GEMINI_PRO_IMAGE = 'gemini-3-pro-image-preview',
  GEMINI_FLASH_TEXT = 'gemini-3-flash-preview', // New
  GEMINI_PRO_TEXT = 'gemini-3-pro-preview', // New
}

export interface GenerateImageParams {
  prompt: string;
  image?: string;
  images?: string[];
  model: GeneratorModel;
  aspectRatio?: string; 
  imageSize?: "1K" | "2K" | "4K";
  camera?: string; 
  numberOfImages?: number; // New
}

export interface GenerateTextParams {
  prompt: string;
  images?: string[];
  model: string;
}

// --- New Types for Multi-Project & History ---

export interface ProjectMeta {
  id: string;
  name: string;
  lastModified: number;
  thumbnail?: string; 
  nodeCount: number;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  prompt: string;
  imageData: string; 
  model: string;
  aspectRatio: string;
  camera?: string; 
  referenceImages?: string[]; 
}

export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    tags: string[];
    nodes: Node[];
    edges: any[]; 
    createdAt: number;
}
