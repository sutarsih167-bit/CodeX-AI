import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { Cpu, Terminal, ShieldAlert, Brain, Network, Zap, ShieldCheck, Database, Key, Copy, Plus, Check, Edit2, Trash2, MoreVertical, BarChart2, DollarSign, ChevronDown, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  image?: {
    base64: string;
    mimeType: string;
    url: string;
  };
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  projectName?: string;
  projectId?: string;
  createdAt: number;
}

export default function App() {
  const [isAppLoading, setIsAppLoading] = React.useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('Console Chat');
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [apiKeys, setApiKeys] = React.useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = React.useState('');
  const [newProjectName, setNewProjectName] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = React.useState(false);
  const [editingKeyId, setEditingKeyId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const [newlyGeneratedKey, setNewlyGeneratedKey] = React.useState<ApiKey | null>(null);
  const [activeBrainKeyId, setActiveBrainKeyId] = React.useState<string | null>(null);

  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: 'assistant',
      content: "System initialized. Selamat datang di **CodeX AI Console**. Saya siap membantu Anda menganalisis data, debugging kode, atau optimasi algoritma. \n\nSilakan masukkan perintah atau data Anda di bawah."
    }
  ]);
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsAppLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (activeTab === 'Get API Key') {
      fetchKeys();
    }
  }, [activeTab]);

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/keys');
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data);
      }
    } catch (e) {
      console.error("Failed to fetch keys", e);
    }
  };

  const generateKey = async () => {
    if (!newKeyName.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName, projectName: newProjectName || 'Default CodeX Project' })
      });
      if (res.ok) {
        const key = await res.json();
        setApiKeys([...apiKeys, key]);
        setNewKeyName('');
        setNewProjectName('');
        setNewlyGeneratedKey(key);
        setActiveBrainKeyId(key.id);
      }
    } catch (e) {
      console.error("Failed to generate key", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteKey = async (id: string) => {
    try {
      const res = await fetch(`/api/keys/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setApiKeys(apiKeys.filter(k => k.id !== id));
        if (newlyGeneratedKey?.id === id) {
          setNewlyGeneratedKey(null);
        }
      }
    } catch (e) {
      console.error("Failed to delete key", e);
    }
  };

  const updateKeyName = async (id: string) => {
    try {
      const res = await fetch(`/api/keys/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName })
      });
      if (res.ok) {
        setApiKeys(apiKeys.map(k => k.id === id ? { ...k, name: editName } : k));
        setEditingKeyId(null);
        setIsRenameModalOpen(false);
      }
    } catch (e) {
      console.error("Failed to update key", e);
    }
  };
  
  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSend = async (content: string, image?: { base64: string; mimeType: string; url: string }, modelName?: string) => {
    const userMessage: Message = { role: 'user', content, image };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const formattedHistory = messages.map(m => {
        const parts: any[] = [];
        if (m.image) {
          parts.push({
            inlineData: {
              data: m.image.base64,
              mimeType: m.image.mimeType
            }
          });
        }
        if (m.content) {
          parts.push({ text: m.content });
        }
        if (parts.length === 0) {
           parts.push({ text: " " });
        }
        return {
          role: m.role === 'user' ? 'user' : 'model',
          parts
        };
      });

      const customApiKey = localStorage.getItem('customGeminiApiKey');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: content,
          history: formattedHistory,
          modelName: modelName || 'CodeX AI',
          customApiKey: customApiKey || undefined,
          image: image ? { base64: image.base64, mimeType: image.mimeType } : undefined
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Network response was not ok');
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: '', model: modelName }]);
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      
      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
              if (dataStr === '[DONE]') {
                 break;
              } else {
                 try {
                   const { text } = JSON.parse(dataStr);
                   setMessages(prev => {
                     const newMsgs = [...prev];
                     const lastMsg = newMsgs[newMsgs.length - 1];
                     newMsgs[newMsgs.length - 1] = { 
                        ...lastMsg, 
                        content: lastMsg.content + text 
                     };
                     return newMsgs;
                   });
                 } catch (e) {}
              }
            }
          }
        }
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${error.message || "Gagal terhubung ke modul AI Core. Coba lagi dalam beberapa saat."}`,
        model: modelName
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAppLoading) {
    return (
      <div className="flex h-[100dvh] w-full bg-[#111111] items-center justify-center flex-col font-sans">
        <motion.div
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           transition={{ duration: 0.5, ease: "easeOut" }}
           className="relative flex items-center justify-center p-2 mb-6 shadow-[0_0_40px_rgba(59,130,246,0.2)] rounded-full border border-zinc-800 bg-sidebar"
        >
          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
          <img src="/console.jpg" alt="Logo" className="w-24 h-24 object-cover rounded-full z-10" />
        </motion.div>
        
        <motion.h1 
          className="text-2xl font-semibold text-white tracking-tight flex"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { 
              opacity: 1,
              transition: { staggerChildren: 0.08, delayChildren: 0.2 } 
            },
          }}
        >
          {"Welcome To CodeX AI".split("").map((char, i) => (
            <motion.span
              key={i}
              variants={{
                hidden: { opacity: 0, y: 5 },
                visible: { opacity: 1, y: 0 }
              }}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </motion.h1>
        
        <motion.p
          initial={{ y: 10, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-zinc-500 mt-2 text-sm flex gap-1 items-center"
        >
          <span className="flex gap-0.5">
             <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
             <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
             <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
          <span className="ml-2">Initializing environment...</span>
        </motion.p>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full bg-bg overflow-hidden font-sans">
      <div className={cn(
        "fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-300",
        isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )} onClick={() => setIsSidebarOpen(false)} />
      
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 md:relative md:translate-x-0 transition-transform duration-300 transform w-64 shrink-0 h-full",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar activeTab={activeTab} onTabChange={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false);
        }} />
      </div>
      
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <header className="h-14 shrink-0 border-b border-edge flex items-center justify-between px-4 sm:px-6 bg-bg/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden w-8 h-8 shrink-0 bg-surface border border-edge rounded-lg flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            >
              <Terminal size={18} />
            </button>
            <div className="flex flex-col min-w-0">
              <h1 className="text-sm font-bold text-white flex items-center gap-2 truncate">
                CHAT BOT
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 font-mono shrink-0">STABLE</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 shrink-0 ml-2">
            <div className="hidden sm:flex items-center gap-2">
              <Cpu size={14} className="text-accent" />
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 font-mono leading-none">CORE LOAD</span>
                <span className="text-[10px] text-white font-mono leading-none">0.2%</span>
              </div>
            </div>
            <div className="flex items-center gap-2 h-8 px-2 sm:px-3 rounded-md bg-zinc-900 border border-edge">
              <ShieldAlert size={14} className="text-zinc-500" />
              <span className="text-[10px] text-zinc-300 font-mono hidden sm:inline-block">SECURE_TUNNEL: ON</span>
              <span className="text-[10px] text-green-500 font-mono sm:hidden">ON</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        {activeTab === 'Console Chat' ? (
          <>
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="max-w-4xl mx-auto py-8">
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => (
                    <ChatMessage key={i} role={msg.role} content={msg.content} image={msg.image} model={msg.model} />
                  ))}
                </AnimatePresence>
                {isLoading && (
                  <div className="p-8 flex items-center gap-3 text-zinc-500 animate-pulse">
                    <Terminal size={18} className="animate-bounce" />
                    <span className="text-xs font-mono">System is processing request...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <ChatInput onSend={handleSend} isLoading={isLoading} />
          </>
        ) : activeTab === 'AI Information' ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-bg">
            <div className="max-w-4xl mx-auto space-y-8 pb-12">
              <div className="relative overflow-hidden rounded-3xl bg-surface/30 border border-edge p-8 sm:p-12 text-center shadow-2xl">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-40 bg-accent/20 blur-[120px] pointer-events-none" />
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-bg to-surface border border-edge rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-black/50 relative group cursor-default overflow-hidden">
                  <div className="absolute inset-0 bg-accent/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl z-20" />
                  <img src="/console.jpg" alt="AI Engine" className="w-full h-full object-cover relative z-10" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">CodeX AI Engine</h2>
                <p className="text-zinc-400 max-w-2xl mx-auto text-lg leading-relaxed">
                  Sistem analitik cerdas generasi berikutnya yang dirancang khusus untuk analis data dan programmer. 
                  Memiliki kapabilitas pemrosesan bahasa alami mendalam, pembuatan visualisasi data instan, dan analisis struktur data kompleks.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <span className="px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-mono text-xs font-semibold tracking-wider">VERSION 1.2 STABLE</span>
                  <span className="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 font-mono text-xs font-semibold tracking-wider flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> OPERATIONAL
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { icon: Zap, title: "Ultra Low Latency", desc: "Arsitektur yang dioptimalkan untuk respon cepat pada setiap pemrosesan data." },
                  { icon: ShieldCheck, title: "Secure Data Tunnel", desc: "Perlindungan data end-to-end, memastikan privasi dataset Anda terjaga." },
                  { icon: Database, title: "Deep Data Explorer", desc: "Mampu melakukan parsing dan mengekstraksi insight dari file data berukuran besar." },
                  { icon: Network, title: "Neural Logic Net", desc: "Dilatih khusus untuk mengenali pola data, bug dalam kode, dan algoritma kompleks." },
                  { icon: Cpu, title: "Dynamic Processing", desc: "Alokasi performa adaptif untuk menangani visualisasi data secara real-time." },
                  { icon: Terminal, title: "Programmer's CLI", desc: "Merespon dengan gaya presisi, informatif, dan tidak bertele-tele (no-nonsense)." }
                ].map((feat, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-surface/40 border border-edge hover:bg-surface hover:border-accent/40 transition-all duration-300 group shadow-lg cursor-default">
                    <div className="w-12 h-12 rounded-xl bg-bg border border-edge flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                      <feat.icon size={24} className="text-zinc-400 group-hover:text-accent transition-colors" />
                    </div>
                    <h3 className="text-white font-semibold mb-2 text-lg">{feat.title}</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{feat.desc}</p>
                  </div>
                ))}
              </div>
              
              <div className="p-8 rounded-3xl bg-gradient-to-br from-[#1c1c1f] to-bg border border-edge shadow-2xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px]" />
                <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3 relative z-10">
                  <Terminal size={20} className="text-accent" /> System Properties Matrix
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12 relative z-10">
                  <div className="flex border-b border-edge/50 pb-3 justify-between items-center group">
                    <span className="text-zinc-500 font-mono text-sm uppercase tracking-wider">Model ID</span>
                    <span className="text-white font-mono text-sm bg-surface px-2 py-1 rounded select-text hover:bg-accent/10 transition-colors">CodeX-V1.2</span>
                  </div>
                  <div className="flex border-b border-edge/50 pb-3 justify-between items-center group">
                    <span className="text-zinc-500 font-mono text-sm uppercase tracking-wider">Core Engine</span>
                    <span className="text-white font-mono text-sm bg-surface px-2 py-1 rounded select-text hover:bg-accent/10 transition-colors">Gemini 2.5 Flash</span>
                  </div>
                  <div className="flex border-b border-edge/50 pb-3 justify-between items-center group">
                    <span className="text-zinc-500 font-mono text-sm uppercase tracking-wider">Context Window</span>
                    <span className="text-white font-mono text-sm bg-surface px-2 py-1 rounded select-text hover:bg-accent/10 transition-colors">128k Tokens Limit</span>
                  </div>
                  <div className="flex border-b border-edge/50 pb-3 justify-between items-center group">
                    <span className="text-zinc-500 font-mono text-sm uppercase tracking-wider">Render Engine</span>
                    <span className="text-white font-mono text-sm bg-surface px-2 py-1 rounded select-text hover:bg-accent/10 transition-colors">React + Component UI</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'Config' ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-bg">
            <div className="max-w-3xl mx-auto py-8">
              <h2 className="text-[28px] tracking-tight text-white mb-6 flex items-center gap-3">
                <Settings className="text-zinc-400" />
                Configuration
              </h2>

              <div className="bg-surface border border-edge rounded-3xl p-6 sm:p-8 shadow-sm mb-6">
                <div className="flex items-center gap-3 mb-6 border-b border-edge pb-4">
                  <div className="p-2.5 bg-accent/10 rounded-xl">
                    <Key className="text-accent" size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-lg">Custom Gemini API Key</h3>
                    <p className="text-zinc-400 text-sm mt-0.5">Bypass rate limits by using your own Gemini API key</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-zinc-300 text-sm font-medium mb-2">API Key</label>
                    <input
                      type="password"
                      value={localStorage.getItem('customGeminiApiKey') || ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          localStorage.setItem('customGeminiApiKey', e.target.value);
                        } else {
                          localStorage.removeItem('customGeminiApiKey');
                        }
                        // Force a re-render to reflect changes
                        setMessages([...messages]); 
                      }}
                      className="w-full bg-bg border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-accent focus:ring-1 focus:ring-accent focus:outline-hidden transition-all shadow-inner"
                      placeholder="AIzaSy..."
                    />
                    <p className="text-xs text-zinc-500 mt-2">
                      Your key is securely stored in your browser's local storage and only sent to the server for requests. If left empty, the default server API key will be used (which may have limits).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'Get API Key' ? (
          <div className="flex-1 overflow-y-auto w-full bg-[#0a0a0a]">
            <AnimatePresence>
              {isCreateModalOpen && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                >
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="bg-surface w-full max-w-sm rounded-[1.25rem] shadow-2xl flex flex-col border border-edge"
                  >
                     <div className="pt-5 pb-3 px-6 flex justify-between items-center">
                       <h3 className="text-[17px] font-medium text-white tracking-tight">Create a new key</h3>
                       <button onClick={() => setIsCreateModalOpen(false)} className="text-zinc-400 hover:text-white p-1 rounded-full transition-colors"><X size={20} /></button>
                     </div>
                     <div className="px-6 space-y-5 pb-6">
                       <div>
                         <label className="block text-zinc-300 text-[13px] mb-2 font-medium">Name your key</label>
                         <input 
                           autoFocus
                           value={newKeyName}
                           onChange={e => setNewKeyName(e.target.value)}
                           className="w-full bg-transparent border border-zinc-600 rounded-[10px] px-3.5 py-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-sm transition-shadow"
                           placeholder="CodeX API Key"
                           onKeyDown={(e) => {
                             if (e.key === 'Enter' && newKeyName.trim() && !isGenerating) {
                               generateKey();
                               setIsCreateModalOpen(false);
                             }
                           }}
                         />
                       </div>
                       <div>
                         <label className="block text-zinc-300 text-[13px] mb-2 font-medium">Project</label>
                         <input 
                           value={newProjectName}
                           onChange={e => setNewProjectName(e.target.value)}
                           className="w-full bg-transparent border border-zinc-600 rounded-[10px] px-3.5 py-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-sm transition-shadow"
                           placeholder="Default CodeX Project"
                           onKeyDown={(e) => {
                             if (e.key === 'Enter' && newKeyName.trim() && !isGenerating) {
                               generateKey();
                               setIsCreateModalOpen(false);
                             }
                           }}
                         />
                       </div>
                     </div>
                     <div className="px-6 py-4 flex justify-end gap-2 items-center">
                       <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 bg-transparent text-sm font-medium text-blue-400 hover:bg-blue-400/10 rounded-full transition-colors">Cancel</button>
                       <button 
                         onClick={() => { generateKey(); setIsCreateModalOpen(false); }}
                         className="px-5 py-2 bg-[#d3e3fd] hover:bg-white text-blue-900 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
                         disabled={!newKeyName.trim() || isGenerating}
                       >
                         Create key
                       </button>
                     </div>
                  </motion.div>
                </motion.div>
              )}
              {isRenameModalOpen && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                >
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="bg-surface w-full max-w-sm rounded-[1.25rem] shadow-2xl flex flex-col border border-edge"
                  >
                     <div className="pt-5 pb-3 px-6 flex justify-between items-center">
                       <h3 className="text-[17px] font-medium text-white tracking-tight">Rename API key</h3>
                       <button onClick={() => { setIsRenameModalOpen(false); setEditingKeyId(null); }} className="text-zinc-400 hover:text-white p-1 rounded-full transition-colors"><X size={20} /></button>
                     </div>
                     <div className="px-6 space-y-5 pb-6">
                       <div>
                         <label className="block text-zinc-300 text-[13px] mb-2 font-medium">New name</label>
                         <input 
                           autoFocus
                           value={editName}
                           onChange={e => setEditName(e.target.value)}
                           className="w-full bg-transparent border border-zinc-600 rounded-[10px] px-3.5 py-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-sm transition-shadow"
                           placeholder="API Key Name"
                           onKeyDown={(e) => {
                             if (e.key === 'Enter' && editName.trim() && editingKeyId) {
                               updateKeyName(editingKeyId);
                             }
                           }}
                         />
                       </div>
                     </div>
                     <div className="px-6 py-4 flex justify-end gap-2 items-center">
                       <button onClick={() => { setIsRenameModalOpen(false); setEditingKeyId(null); }} className="px-4 py-2 bg-transparent text-sm font-medium text-blue-400 hover:bg-blue-400/10 rounded-full transition-colors">Cancel</button>
                       <button 
                         onClick={() => editingKeyId && updateKeyName(editingKeyId)}
                         className="px-5 py-2 bg-[#d3e3fd] hover:bg-white text-blue-900 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
                         disabled={!editName.trim()}
                       >
                         Save
                       </button>
                     </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {newlyGeneratedKey && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-surface border border-edge p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
                  <h3 className="text-lg font-semibold text-white mb-2">API Key Generated</h3>
                  <p className="text-zinc-400 text-sm mb-4">Please copy this key now. For your security, it won't be shown again.</p>
                  
                  <div className="flex items-center gap-2 mb-6">
                    <input
                      readOnly
                      value={newlyGeneratedKey.key}
                      className="flex-1 bg-bg border border-edge rounded-lg px-3 py-2.5 text-white focus:outline-hidden font-mono text-sm"
                    />
                    <button
                      onClick={() => handleCopy(newlyGeneratedKey.key)}
                      className="flex items-center justify-center w-11 h-11 shrink-0 bg-[#d3e3fd] text-blue-900 hover:bg-white rounded-lg transition-colors font-medium"
                      title="Copy Key"
                    >
                      {copiedKey === newlyGeneratedKey.key ? <Check size={18} /> : <Copy size={18} />}
                   </button>
                  </div>
                  
                  <div className="flex justify-end">
                    <button onClick={() => setNewlyGeneratedKey(null)} className="px-5 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-full text-sm font-medium transition-colors">Done</button>
                  </div>
                </div>
              </div>
            )}

            <div className="max-w-[700px] w-full mx-auto p-4 sm:p-8 shrink-0">
              <div className="flex flex-col gap-4 mb-4 pt-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-[28px] tracking-tight text-white mb-2">API Keys</h2>
                  <FileText size={20} className="text-zinc-400 mb-2" />
                </div>
                <button onClick={() => setIsCreateModalOpen(true)} className="px-5 py-2 w-fit rounded-full border border-zinc-700 bg-transparent text-[#e3e3e3] hover:bg-surface font-medium text-sm transition-colors whitespace-nowrap self-start">
                  Create API key
                </button>
              </div>
              <div className="space-y-4">
                {apiKeys.length === 0 ? (
                  <div className="py-12 text-center mt-6 bg-surface/30 border border-edge rounded-3xl">
                    <p className="text-zinc-400 text-sm mb-2">Can't find your API keys here?</p>
                    <p className="text-zinc-500 text-xs">You have no API keys. Click Create API key to generate a new one.</p>
                  </div>
                ) : (
                  <>
                    {apiKeys.map(k => (
                      <div key={k.id} className="bg-surface border border-edge rounded-3xl p-5 sm:p-6 transition-all shadow-sm">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h3 className="text-blue-400 font-medium text-base sm:text-lg mb-0.5 tracking-tight flex items-center gap-3">
                              ...{k.key.substring(k.key.length - 4)}
                              {activeBrainKeyId === k.id && (
                                <span className="px-2 py-0.5 rounded text-[10px] bg-accent/20 text-accent font-bold uppercase tracking-wider border border-accent/30">Active Brain</span>
                              )}
                            </h3>
                                  <p className="text-zinc-400 text-[13px] flex items-center gap-2 group/edit cursor-pointer" onClick={() => { setEditingKeyId(k.id); setEditName(k.name); setIsRenameModalOpen(true); }}>
                                    {k.name}
                                    <Edit2 size={12} className="opacity-0 group-hover/edit:opacity-100 transition-opacity text-zinc-500" />
                                  </p>
                          </div>
                          <div className="flex items-center gap-4 text-zinc-400 pt-1">
                            <button onClick={() => handleCopy(k.key)} className="hover:text-blue-400 transition-colors tooltip-trigger" title="Copy key">
                              {copiedKey === k.key ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                            </button>
                            <div className="relative group/menu">
                              <button className="hover:text-white transition-colors"><MoreVertical size={20} /></button>
                              <div className="absolute right-0 top-full mt-2 w-48 bg-[#2a2b2f] border border-[#3b3c40] rounded-[10px] shadow-2xl py-2 opacity-0 pointer-events-none group-hover/menu:opacity-100 group-hover/menu:pointer-events-auto transition-opacity z-10">
                                <button onClick={() => setActiveBrainKeyId(k.id)} className="w-full text-left px-4 py-2 text-sm text-accent hover:bg-[#3b3c40] transition-colors flex justify-between items-center">
                                  Set as AI Brain <Brain size={14} />
                                </button>
                                <button onClick={() => { setEditingKeyId(k.id); setEditName(k.name); setIsRenameModalOpen(true); }} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-[#3b3c40] transition-colors flex justify-between items-center">
                                  Rename
                                </button>
                                <button onClick={() => deleteKey(k.id)} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#3b3c40] transition-colors flex justify-between items-center">
                                  Delete <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-[18px]">
                          <div className="flex justify-between items-start text-[13px]">
                            <span className="text-[#a8c7fa]">Project</span>
                            <span className="text-[#a8c7fa] text-right">{k.projectName || 'Default CodeX Project'}</span>
                          </div>
                          <div className="flex justify-between items-start text-[13px]">
                            <span className="text-zinc-400">Project ID</span>
                            <span className="text-zinc-200 text-right">{k.projectId || `gen-lang-client-${k.id}`}</span>
                          </div>
                          <div className="flex justify-between items-start text-[13px]">
                            <span className="text-zinc-400">Created</span>
                            <span className="text-zinc-200 text-right">{new Date(k.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="py-10 text-center flex flex-col items-center">
                      <p className="text-zinc-200 text-base mb-3 font-medium">Can't find your API keys here?</p>
                      <p className="text-zinc-400 text-sm max-w-[500px] leading-relaxed">
                        This list only shows API keys for projects imported into Google AI Studio. Import other projects to manage their associated API Keys. You can also create a new API Key above. <a href="#" className="text-blue-400 hover:underline">Learn more</a>
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8 text-center">
            <Terminal size={48} className="mb-4 text-zinc-700" />
            <h2 className="text-xl font-semibold text-white mb-2">{activeTab} Module</h2>
            <p className="max-w-md mx-auto text-sm font-mono opacity-60">
              Module [ {activeTab.toUpperCase()} ] sedang dalam pemeliharaan (Under Maintenance).
              Silakan kembali ke Console Chat untuk interaksi default.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
