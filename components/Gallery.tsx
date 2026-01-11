import React, { useEffect, useState } from 'react';
import { Download, Calendar, Search } from 'lucide-react';
import { getHistory } from '../services/storageService';
import { HistoryItem } from '../types';

export const Gallery: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<HistoryItem | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await getHistory();
      setHistory(data);
      setLoading(false);
    };
    load();
  }, []);

  // Helper to ensure base64 prefix
  const getImgSrc = (data: string) => {
      return data.startsWith('data:') ? data : `data:image/png;base64,${data}`;
  };

  return (
    <div className="flex flex-col w-full h-full p-8 max-w-7xl mx-auto overflow-y-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">Image History</h1>
            <p className="text-zinc-400">Your visual creation timeline.</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-700 rounded-full px-4 py-2 flex items-center gap-2 text-zinc-400">
           <Search size={16} />
           <span className="text-sm">Search prompts...</span>
        </div>
      </div>

      {loading ? (
        <div className="text-zinc-500 flex items-center gap-2"><div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div> Loading...</div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <p>No images generated yet.</p>
        </div>
      ) : (
        <div className="columns-1 md:columns-3 lg:columns-4 gap-6 space-y-6">
          {history.map((item) => (
            <div 
              key={item.id} 
              className="break-inside-avoid relative group bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-blue-500/50 transition-all cursor-pointer"
              onClick={() => setSelectedImage(item)}
            >
              <img src={getImgSrc(item.imageData)} loading="lazy" className="w-full h-auto" alt="Generated" />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                 <p className="text-white text-sm font-medium line-clamp-2 mb-2">{item.prompt}</p>
                 <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                    <span className="bg-white/10 px-1.5 py-0.5 rounded">{item.aspectRatio}</span>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-8" onClick={() => setSelectedImage(null)}>
           <div className="max-w-6xl max-h-full flex flex-col md:flex-row gap-8 w-full" onClick={e => e.stopPropagation()}>
              <div className="flex-1 flex items-center justify-center bg-black/50 rounded-lg p-2">
                 <img src={getImgSrc(selectedImage.imageData)} className="max-w-full max-h-[85vh] rounded-lg shadow-2xl border border-white/10 object-contain" />
              </div>
              <div className="w-full md:w-96 bg-zinc-900 p-6 rounded-2xl border border-zinc-800 flex flex-col gap-4 h-full md:h-auto md:max-h-[85vh] overflow-y-auto custom-scrollbar">
                 <div>
                    <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Prompt</h3>
                    <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">{selectedImage.prompt}</p>
                 </div>
                 
                 {/* Camera Info */}
                 {selectedImage.camera && (
                    <>
                        <div className="h-px bg-zinc-800" />
                        <div>
                            <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Camera Controls</h3>
                            <p className="text-blue-300 text-xs bg-blue-500/10 border border-blue-500/20 p-2 rounded-lg">{selectedImage.camera}</p>
                        </div>
                    </>
                 )}

                 {/* Reference Images */}
                 {selectedImage.referenceImages && selectedImage.referenceImages.length > 0 && (
                     <>
                        <div className="h-px bg-zinc-800" />
                        <div>
                            <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">
                                Reference Images ({selectedImage.referenceImages.length})
                            </h3>
                            <div className="grid grid-cols-3 gap-2">
                                {selectedImage.referenceImages.map((refImg, idx) => (
                                    <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-zinc-700 bg-black relative group/ref">
                                        <img 
                                            src={getImgSrc(refImg)} 
                                            className="w-full h-full object-cover opacity-70 group-hover/ref:opacity-100 transition-opacity" 
                                            alt={`Ref ${idx}`} 
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/ref:opacity-100 pointer-events-none">
                                            <span className="text-[10px] bg-black/60 text-white px-1 rounded">Ref {idx+1}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                     </>
                 )}

                 <div className="h-px bg-zinc-800" />
                 
                 <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                        <span className="block text-zinc-500 mb-1">Model</span>
                        <span className="text-zinc-300">{selectedImage.model}</span>
                    </div>
                    <div>
                        <span className="block text-zinc-500 mb-1">Ratio</span>
                        <span className="text-zinc-300">{selectedImage.aspectRatio}</span>
                    </div>
                    <div>
                        <span className="block text-zinc-500 mb-1">Time</span>
                        <span className="text-zinc-300">{new Date(selectedImage.timestamp).toLocaleString()}</span>
                    </div>
                 </div>
                 <div className="mt-auto pt-4">
                    <a 
                       href={getImgSrc(selectedImage.imageData)} 
                       download={`aether-history-${selectedImage.timestamp}.png`}
                       className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                       <Download size={18} />
                       Download Image
                    </a>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};