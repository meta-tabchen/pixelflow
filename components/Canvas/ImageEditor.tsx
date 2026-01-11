import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { X, Save, Undo, Redo, Pen, Eraser } from 'lucide-react';

interface ImageEditorProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
  onSave: (editedImage: string) => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ isOpen, imageUrl, onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [brushColor, setBrushColor] = useState('#ef4444'); // Default red
  const [brushSize, setBrushSize] = useState(5);
  const [isEraser, setIsEraser] = useState(false);

  useEffect(() => {
    if (isOpen && imageUrl && canvasRef.current) {
      // Initialize Canvas
      const canvas = new fabric.Canvas(canvasRef.current, {
        isDrawingMode: true,
        selection: false,
      });
      fabricCanvasRef.current = canvas;

      // Load Image
      fabric.Image.fromURL(imageUrl, (img) => {
        if (!img) return;

        // Calculate scale to fit within a reasonable max size (e.g., 800x600 or window size)
        const maxWidth = window.innerWidth * 0.8;
        const maxHeight = window.innerHeight * 0.7;
        const scale = Math.min(maxWidth / (img.width || 1), maxHeight / (img.height || 1));

        canvas.setWidth((img.width || 0) * scale);
        canvas.setHeight((img.height || 0) * scale);
        
        img.scale(scale);
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
      }, { crossOrigin: 'anonymous' });

      // Setup Brush
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushSize;

      return () => {
        canvas.dispose();
        fabricCanvasRef.current = null;
      };
    }
  }, [isOpen, imageUrl]);

  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.freeDrawingBrush.color = isEraser ? 'transparent' : brushColor;
      // Eraser in fabric.js simple implementation typically just draws destination-out or white, 
      // but simpler to just stick to color drawing for annotations. 
      // A true eraser needs more composite operation logic in Fabric < 6.
      // We will stick to simple "Annotate" functionality (Drawing).
      fabricCanvasRef.current.freeDrawingBrush.width = brushSize;
    }
  }, [brushColor, brushSize, isEraser]);

  const handleSave = () => {
    if (fabricCanvasRef.current) {
      // Export to base64
      const dataUrl = fabricCanvasRef.current.toDataURL({
        format: 'png',
        quality: 1,
      });
      onSave(dataUrl);
    }
  };

  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#18181b] border border-zinc-700 rounded-2xl shadow-2xl flex flex-col max-w-[95vw] max-h-[95vh] overflow-hidden">
        
        {/* Header */}
        <div className="h-14 border-b border-zinc-700 flex items-center justify-between px-6 bg-zinc-900/50">
           <span className="font-bold text-zinc-200">Editor</span>
           <div className="flex items-center gap-2">
             <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
               <X size={20} />
             </button>
           </div>
        </div>

        {/* Toolbar */}
        <div className="h-12 border-b border-zinc-700 bg-zinc-900/30 flex items-center px-4 gap-4">
           <div className="flex items-center gap-2 bg-zinc-800 rounded-lg p-1">
             <button 
                onClick={() => setIsEraser(false)}
                className={`p-1.5 rounded ${!isEraser ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'}`}
             >
                <Pen size={16} />
             </button>
             {/* Simple eraser placeholder, though we are focusing on annotation */}
             {/* <button className="p-1.5 rounded text-zinc-400 hover:text-white"><Eraser size={16} /></button> */}
           </div>

           <div className="h-6 w-px bg-zinc-700" />

           <div className="flex items-center gap-2">
              <input 
                type="color" 
                value={brushColor} 
                onChange={(e) => setBrushColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
              />
              <input 
                type="range" 
                min="1" 
                max="50" 
                value={brushSize} 
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-24 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
              />
           </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-zinc-900 flex items-center justify-center p-8">
           <canvas ref={canvasRef} />
        </div>

        {/* Footer */}
        <div className="h-16 border-t border-zinc-700 flex items-center justify-end px-6 bg-zinc-900/50 gap-3">
           <button 
             onClick={onClose}
             className="px-4 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors font-medium text-sm"
           >
             Cancel
           </button>
           <button 
             onClick={handleSave}
             className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 font-medium text-sm flex items-center gap-2"
           >
             <Save size={16} />
             Save to Node
           </button>
        </div>

      </div>
    </div>
  );
};