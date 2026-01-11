import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface WorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; tags: string[]; description: string }) => void;
}

export const WorkflowModal: React.FC<WorkflowModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('My Workflow');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-[500px] bg-[#18181b] border border-zinc-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
           <div className="flex gap-4">
              <button className="text-zinc-200 font-bold border-b-2 border-zinc-200 pb-0.5">Create New Workflow</button>
              <button className="text-zinc-500 font-medium hover:text-zinc-300 transition-colors">Update Existing</button>
           </div>
           <button onClick={onClose} className="text-zinc-500 hover:text-white">
              <X size={20} />
           </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-6">
           {/* Thumbnail Placeholder */}
           <div className="flex gap-4">
              <div className="w-24 h-24 rounded-xl border border-dashed border-zinc-700 bg-zinc-900 flex items-center justify-center text-zinc-600">
                 No Preview
              </div>
              <div className="flex-1 space-y-4">
                 <div className="space-y-1">
                    <label className="text-xs text-zinc-400 font-medium">Name</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                 </div>
                 
                 <div className="space-y-1">
                    <div className="flex justify-between">
                       <label className="text-xs text-zinc-400 font-medium">Tags</label>
                       <span className="text-[10px] text-zinc-600">{tags.length}/5</span>
                    </div>
                    <button 
                       onClick={() => setTags([...tags, `Tag ${tags.length + 1}`])}
                       className="bg-blue-400/20 text-blue-400 hover:bg-blue-400/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    >
                       + Add Tag
                    </button>
                    {/* Render Tags */}
                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {tags.map((t, i) => (
                                <span key={i} className="bg-zinc-800 text-zinc-300 text-[10px] px-2 py-0.5 rounded-full border border-zinc-700">{t}</span>
                            ))}
                        </div>
                    )}
                 </div>
              </div>
           </div>

           <div className="space-y-1">
              <label className="text-xs text-zinc-400 font-medium">Description</label>
              <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe your workflow logic, steps, and use cases..."
                  className="w-full h-24 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-600 focus:outline-none resize-none"
              />
           </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex justify-end">
           <button 
              onClick={() => onSave({ name, tags, description })}
              className="bg-blue-500 hover:bg-blue-400 text-white px-6 py-2 rounded-full font-medium shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all"
           >
              <Check size={16} />
              Confirm
           </button>
        </div>

      </div>
    </div>
  );
};