
import React from 'react';

export enum NodeType {
  INPUT_TEXT = 'INPUT_TEXT',
  INPUT_IMAGE = 'INPUT_IMAGE',
  UPLOAD_IMAGE = 'UPLOAD_IMAGE',
  PROCESS_OPTIMIZER = 'PROCESS_OPTIMIZER',
  PROCESS_GENERATOR = 'PROCESS_GENERATOR',
  OUTPUT_RESULT = 'OUTPUT_RESULT',
  GEN_IMAGE = 'GEN_IMAGE',
  GROUP = 'GROUP', // New Group Node
}

export interface NodeData {
  text?: string;
  image?: string; // Base64
  params?: {
    aspectRatio: string;
    model: string;
    imageSize?: string;
    camera?: string; // New Camera/Shot parameter
  };
  result?: string; // Base64 or Text
  error?: string; // New Error Message Field
  isLoading?: boolean;
  preview?: string;
  title?: string;
  label?: string; // For Group Label
  
  // Actions
  onChange?: (id: string, data: any) => void;
  onDelete?: (id: string) => void;
  onRun?: (id: string) => Promise<void>; // Updated to Promise for chaining
  onAddNext?: (id: string) => void;
  onEdit?: (id: string, imageData: string) => void;
  
  // Group Specific Actions
  onRunGroup?: (id: string) => void;
  onUngroup?: (id: string) => void;
  onCreateWorkflow?: (id: string) => void;
}

export interface Node {
  id: string;
  type: NodeType | string; // Fix: Allow string for ReactFlow compatibility
  x?: number;
  y?: number;
  position: { x: number; y: number }; // Fix: Make position required for ReactFlow compatibility
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
}

export interface GenerateImageParams {
  prompt: string;
  image?: string;
  images?: string[];
  model: GeneratorModel;
  aspectRatio?: string; // Updated to string to support all ratios like "21:9", "2:3" etc.
  imageSize?: "1K" | "2K" | "4K";
  camera?: string; // New Camera parameter for API
}

// --- New Types for Multi-Project & History ---

export interface ProjectMeta {
  id: string;
  name: string;
  lastModified: number;
  thumbnail?: string; // Optional preview of the workflow
  nodeCount: number;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  prompt: string;
  imageData: string; // Base64
  model: string;
  aspectRatio: string;
  camera?: string; // Stored camera parameter
  referenceImages?: string[]; // Stored reference images used for this generation
}

export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    tags: string[];
    nodes: Node[];
    edges: any[]; // Using any for Edge to avoid circular deps with ReactFlow type if simple
    createdAt: number;
}
