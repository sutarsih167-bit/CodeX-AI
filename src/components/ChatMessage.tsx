import React from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Terminal, Copy, Check, BarChart3 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { DataVisualization } from './DataVisualization';

import { AI_MODELS } from './ChatInput';

const CodeBlock = ({ children, ...props }: any) => {
  const [copied, setCopied] = React.useState(false);
  const preRef = React.useRef<HTMLPreElement>(null);

  const handleCopy = () => {
    if (preRef.current) {
      const text = preRef.current.innerText;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative group/code overflow-hidden rounded-xl border border-edge bg-[#111113] my-4 shadow-lg shadow-black/50">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#1a1a1e] border-b border-edge/50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
        </div>
        <button 
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors uppercase tracking-wider"
        >
          {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="p-3 sm:p-4 overflow-x-auto text-sm scrollbar-thin">
        <pre ref={preRef} {...props} className="m-0 bg-transparent p-0 border-none rounded-none select-text text-zinc-300 font-mono inline-block min-w-full">
          {children}
        </pre>
      </div>
    </div>
  );
};

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  image?: {
    base64: string;
    mimeType: string;
    url: string;
  };
}

export const ChatMessage = ({ role, content, image, model }: ChatMessageProps) => {
  // Extract visualization data if present
  const vizData = React.useMemo(() => {
    if (role !== 'assistant') return null;
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) return null;
    try {
      const data = JSON.parse(jsonMatch[1]);
      if (data.viz_type && data.viz_data) {
        return data;
      }
    } catch (e) {
      return null;
    }
  }, [content, role]);

  // Clean content from the JSON block for display
  const displayContent = React.useMemo(() => {
    if (!vizData) return content;
    return content.replace(/```json\n([\s\S]*?)\n```/, '').trim();
  }, [content, vizData]);

  const modelInfo = role === 'assistant' 
    ? (AI_MODELS.find(m => m.id === model) || AI_MODELS[0])
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-3 sm:gap-4 p-4 sm:p-6 transition-all duration-300 group w-full max-w-full min-w-0 overflow-hidden bg-transparent border-b border-edge/30"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border overflow-hidden",
        role === 'assistant' 
          ? "bg-accent/10 border-accent/20 text-accent p-0" 
          : "bg-zinc-800 border-zinc-700 text-zinc-400"
      )}>
        {role === 'assistant' ? <img src={modelInfo?.image} alt="AI" className="w-full h-full object-cover" /> : <User size={18} />}
      </div>

      <div className="flex-1 min-w-0 overflow-hidden break-words">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-xs font-bold font-mono tracking-wider uppercase",
              role === 'assistant' ? "text-accent" : "text-zinc-500"
            )}>
              {role === 'assistant' ? modelInfo?.id.toUpperCase() : "USER_CMD"}
            </span>
            {role === 'assistant' && (
              <span className="px-1.5 py-0.5 rounded-sm bg-accent/10 border border-accent/20 text-[9px] text-accent font-mono tracking-widest hidden sm:inline-block">AUTHORIZED</span>
            )}
          </div>
        </div>

        {image && (
          <div className="mb-4">
            <img src={image.url} alt="Attachment" className="max-w-xs w-full sm:w-auto sm:max-w-md rounded-xl border border-edge shadow-lg object-contain bg-[#111113]" />
          </div>
        )}
        
        <div className={cn(
          "markdown-body",
          role === 'user' ? "bg-transparent border border-zinc-700/50 p-4 rounded-xl shadow-sm w-fit max-w-full sm:max-w-[90%]" : "w-full"
        )}>
          <ReactMarkdown
             components={{
               pre: CodeBlock
             }}
          >
            {displayContent}
          </ReactMarkdown>
        </div>

        {vizData && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={16} className="text-accent" />
              <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest">Generating Visual Report...</span>
            </div>
            <DataVisualization data={vizData.viz_data} type={vizData.viz_type} />
          </div>
        )}
      </div>
    </motion.div>
  );
};
