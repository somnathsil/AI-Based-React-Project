import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  BookOpen,
  History,
  Settings,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/routes/routes.config';

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const navItems = [
    { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { label: 'AI Chat Studio', path: '/ai-chat', icon: Bot, badge: 'New' },
    { label: 'Prompt Library', path: '/prompts', icon: BookOpen },
    { label: 'Execution History', path: '/history', icon: History },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed lg:static top-0 left-0 z-40 h-screen w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/80">
          <NavLink to={ROUTES.HOME} className="flex items-center gap-3 group">
            <img
              src="/pixel_coders_logo.jpg"
              alt="PixelCoders Logo"
              className="w-9 h-9 rounded-xl object-cover ring-1 ring-sky-500/30 group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="font-heading text-base font-bold text-white tracking-tight flex items-center gap-1">
                Pixel<span className="text-gradient">Coders</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Enterprise AI</span>
            </div>
          </NavLink>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 mb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Main Platform
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group',
                    isActive
                      ? 'bg-gradient-to-r from-sky-500/15 to-indigo-500/10 text-sky-400 border border-sky-500/20 shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0 transition-colors" />
                  <span>{item.label}</span>
                </div>

                {item.badge ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Upgrade Pro Plan Footer Banner */}
        <div className="p-4 m-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <Zap className="w-4 h-4 fill-amber-400" />
            <span>Enterprise Pro Tier</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Unlock GPT-4o, Claude 3.5 Sonnet & high-speed streaming APIs.
          </p>
          <button className="w-full py-2 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700">
            Upgrade Workspace
          </button>
        </div>
      </aside>
    </>
  );
};
