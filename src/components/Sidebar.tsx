import React from 'react';
import { Terminal, Database, LineChart, Code2, Settings, History, MessageSquare, ChevronRight, User, Info, Key } from 'lucide-react';
import { cn } from '../lib/utils';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem = ({ icon: Icon, label, active, onClick }: NavItemProps) => (
  <div onClick={onClick} className={cn(
    "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group",
    active ? "bg-accent/10 text-accent font-semibold" : "text-zinc-400 hover:bg-surface hover:text-white"
  )}>
    <Icon size={18} className={cn("transition-colors", active ? "text-accent" : "text-zinc-400 group-hover:text-accent")} />
    <span className="text-sm">{label}</span>
    {active && <ChevronRight size={14} className="ml-auto text-accent" />}
  </div>
);

export interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  return (
    <aside className="w-64 h-full bg-bg border-r border-edge flex flex-col">
      <div className="p-4 border-b border-edge">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shadow-lg shadow-accent/20 overflow-hidden">
            <img src="/console.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white tracking-tight">CodeX AI</span>
            <span className="text-[10px] text-accent font-mono uppercase tracking-widest">v1.0-stable</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-8 scrollbar-thin">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-2 mb-2">Main Menu</label>
          <NavItem icon={MessageSquare} label="Console Chat" active={activeTab === 'Console Chat'} onClick={() => onTabChange('Console Chat')} />
          <NavItem icon={Database} label="Data Explorer" active={activeTab === 'Data Explorer'} onClick={() => onTabChange('Data Explorer')} />
          <NavItem icon={LineChart} label="Analytics" active={activeTab === 'Analytics'} onClick={() => onTabChange('Analytics')} />
          <NavItem icon={Code2} label="Code Weaver" active={activeTab === 'Code Weaver'} onClick={() => onTabChange('Code Weaver')} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-2 mb-2">System</label>
          <NavItem icon={Key} label="Get API Key" active={activeTab === 'Get API Key'} onClick={() => onTabChange('Get API Key')} />
          <NavItem icon={History} label="Prompt History" active={activeTab === 'Prompt History'} onClick={() => onTabChange('Prompt History')} />
          <NavItem icon={Settings} label="Config" active={activeTab === 'Config'} onClick={() => onTabChange('Config')} />
          <NavItem icon={Info} label="AI Information" active={activeTab === 'AI Information'} onClick={() => onTabChange('AI Information')} />
        </div>
      </div>

      <div className="p-4 border-t border-edge flex flex-col gap-4">
        <div className="p-3 rounded-xl bg-surface/50 border border-edge">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-zinc-400 font-mono">SERVER: OK</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">75%</span>
            </div>
            <div className="w-full bg-bg h-1.5 rounded-full overflow-hidden">
              <div className="w-3/4 h-full bg-accent" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
