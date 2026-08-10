import React from "react";
import { UserMenu } from "./UserMenu";

export interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-9 flex items-center justify-between">
      <span className="font-heading text-2xl font-bold text-white tracking-tight flex items-center gap-1">
        Pixel<span className="text-gradient">Coders</span>
      </span>

      <div className="flex items-center gap-3">
        <UserMenu />
      </div>
    </header>
  );
};
