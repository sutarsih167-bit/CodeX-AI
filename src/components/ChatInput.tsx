import React, { useRef, useState } from 'react';
import { Send, Sparkles, Camera, X, ChevronDown, Terminal, MessageSquare, Zap, Brain } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string, image?: { base64: string; mimeType: string; url: string }, model?: string) => void;
  isLoading: boolean;
}

export const AI_MODELS = [
  { id: "CodeX AI", image: "/console.jpg" },
  { id: "ChatGPT", image: "/ChatGPT.jpg" },
  { id: "Gemini", image: "/gemini.jpg" },
  { id: "Grok", image: "/grok.jpg" },
  { id: "DeepSeek", image: "/deepseek.jpg" }
];

export const ChatInput = ({ onSend, isLoading }: ChatInputProps) => {
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ file: File; preview: string } | null>(null);
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Ukuran gambar maksimal 5MB");
        return;
      }
      setSelectedImage({
        file,
        preview: URL.createObjectURL(file)
      });
    }
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || selectedImage) && !isLoading) {
      let imageData;
      if (selectedImage) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
        });
        reader.readAsDataURL(selectedImage.file);
        const base64 = await base64Promise;
        imageData = {
          base64,
          mimeType: selectedImage.file.type,
          url: selectedImage.preview
        };
      }
      onSend(input.trim(), imageData, selectedModel.id);
      setInput('');
      setSelectedImage(null);
    }
  };

  return (
    <div className="p-4 bg-transparent border-t-0">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto group">
        
        {/* Preview Image */}
        {selectedImage && (
          <div className="mb-3 relative inline-block">
            <div className="relative rounded-xl overflow-hidden border border-edge shadow-lg bg-surface flex items-center justify-center p-1 group/preview">
              <img src={selectedImage.preview} alt="Preview" className="max-h-32 object-contain rounded-lg" />
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-red-500 transition-colors opacity-0 group-hover/preview:opacity-100"
                title="Hapus gambar"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <div className="relative flex flex-col gap-2">
          {/* AI Model Selector */}
          <div className="flex items-center gap-2 relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 bg-surface hover:bg-edge border border-edge text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm"
            >
              <img src={selectedModel.image} alt={selectedModel.id} className="w-3.5 h-3.5 object-cover rounded-sm" />
              {selectedModel.id}
              <ChevronDown size={14} className={`transition-transform border-l border-edge pl-1 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-40 bg-surface border border-edge rounded-lg shadow-xl overflow-hidden z-20">
                {AI_MODELS.map(model => {
                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => {
                        setSelectedModel(model);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 text-left px-3 py-2 text-xs hover:bg-edge transition-colors ${selectedModel.id === model.id ? 'text-accent font-bold bg-accent/10' : 'text-zinc-300'}`}
                    >
                      <img src={model.image} alt={model.id} className="w-3.5 h-3.5 object-cover rounded-sm" />
                      {model.id}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
              <input 
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-zinc-500 hover:text-accent transition-colors p-2.5 rounded-xl hover:bg-surface border border-transparent hover:border-edge"
                title="Kirim Foto / Buka Kamera"
              >
                <Camera size={18} />
              </button>
            </div>
            
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedImage ? "Tambahkan pesan opsional..." : "Ketik pesan perintah, deskripsi gambar, atau payload..."}
              className="w-full bg-surface/80 backdrop-blur-md border border-edge rounded-xl pl-[54px] pr-[100px] py-4 text-white focus:outline-hidden focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all placeholder:text-zinc-600 font-mono text-sm sm:text-sm text-[13px] shadow-2xl relative"
              disabled={isLoading}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center z-10">
              <button
                type="submit"
                disabled={(!input.trim() && !selectedImage) || isLoading}
                className="flex items-center gap-2 bg-accent hover:bg-blue-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white px-3 sm:px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-lg shadow-accent/20"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                ) : (
                  <>
                    <span className="hidden sm:inline">EXECUTE</span>
                    <Send size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-2 flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 hidden sm:flex">
              <Sparkles size={12} className="text-accent" />
              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Vision + Syntax Enabled</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">v1.2 AI Engine</span>
            </div>
          </div>
          <span className="text-[10px] text-zinc-600 font-mono">Press Enter to send</span>
        </div>
      </form>
    </div>
  );
};

