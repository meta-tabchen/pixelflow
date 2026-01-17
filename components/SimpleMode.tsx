
import React, { useState } from 'react';
import { Sparkles, Image as ImageIcon, Type, Wand2, Upload, Loader2, Download } from 'lucide-react';
import { generateImageContent, imageToText, fileToBase64, optimizePrompt } from '../services/geminiService';
import { GeneratorModel } from '../types';

export const SimpleMode: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'txt2img' | 'img2txt' | 'upscale'>('txt2img');
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleTextToImage = async () => {
    if (!prompt) return;
    setIsLoading(true);
    setGeneratedImage(null);
    try {
      // Auto-optimize prompt slightly for better results in simple mode
      const results = await generateImageContent({
        prompt,
        model: GeneratorModel.GEMINI_PRO_IMAGE,
        aspectRatio: "16:9",
        numberOfImages: 1
      });
      if (results && results.length > 0) {
          setGeneratedImage(results[0]);
      }
    } catch (e) {
      alert("Generation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageToText = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setGeneratedText(null);
    try {
      const base64 = await fileToBase64(selectedFile);
      const text = await imageToText(base64);
      setGeneratedText(text);
    } catch (e) {
      alert("Analysis failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (!prompt) return;
    setIsLoading(true);
    try {
      const optimized = await optimizePrompt(prompt);
      setPrompt(optimized);
    } catch(e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-8 max-w-5xl mx-auto w-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
          Studio Express
        </h1>
        <p className="text-slate-400">Quick professional tools for instant results.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="space-y-2 lg:col-span-1">
          <button
            onClick={() => setActiveTab('txt2img')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'txt2img' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Wand2 className="w-5 h-5" />
            <span className="font-medium">Text to Image</span>
          </button>
          <button
            onClick={() => setActiveTab('img2txt')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'img2txt' 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' 
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Type className="w-5 h-5" />
            <span className="font-medium">Image to Text</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 min-h-[500px]">
          {activeTab === 'txt2img' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Prompt</label>
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your imagination..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none h-32"
                  />
                  <button 
                    onClick={handleOptimize}
                    disabled={isLoading || !prompt}
                    className="absolute bottom-3 right-3 p-2 bg-slate-800 rounded-md hover:bg-blue-600/20 hover:text-blue-400 transition-colors text-xs flex items-center gap-1 text-slate-400"
                    title="Optimize Prompt with AI"
                  >
                    <Sparkles className="w-3 h-3" /> Optimize
                  </button>
                </div>
              </div>
              
              <button
                onClick={handleTextToImage}
                disabled={isLoading || !prompt}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg font-bold text-white shadow-lg shadow-blue-900/20 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                Generate Artwork
              </button>

              {generatedImage && (
                <div className="mt-8 animate-in fade-in zoom-in duration-300">
                  <div className="relative group rounded-xl overflow-hidden border border-slate-700 shadow-2xl bg-black/40">
                    <div className="w-full flex items-center justify-center min-h-[300px]">
                        <img src={generatedImage} alt="Generated" className="max-w-full max-h-[600px] object-contain shadow-2xl" />
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <a href={generatedImage} download="aether-creation.png" className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform">
                        <Download className="w-6 h-6" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'img2txt' && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:bg-slate-800/50 transition-colors relative">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-lg" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Upload className="w-10 h-10 mb-2" />
                    <span className="font-medium">Drop an image here or click to upload</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleImageToText}
                disabled={isLoading || !selectedFile}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold text-white shadow-lg shadow-purple-900/20 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Type className="w-5 h-5" />}
                Analyze Image
              </button>

              {generatedText && (
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Analysis Result</h3>
                  <p className="text-slate-200 leading-relaxed">{generatedText}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
