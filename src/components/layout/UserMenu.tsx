import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, ChevronDown } from "lucide-react";
import { ROUTES } from "@/routes/routes.config";

interface UserInfo {
  name: string;
  email: string;
  role: string;
}

export const UserMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Read user info from localStorage or use default
  const getUserInfo = (): UserInfo => {
    try {
      const stored = localStorage.getItem("user_info");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fall back to default
    }
    return {
      name: "Guest User",
      email: "guest@example.com",
      role: "User",
    };
  };

  const user = getUserInfo();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    // Check if Remember Me is enabled
    const rememberMe = localStorage.getItem("remember_me");

    // Clear auth session
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_info");

    // If Remember Me is NOT enabled, clear saved credentials too
    if (rememberMe !== "true") {
      localStorage.removeItem("remember_me");
      localStorage.removeItem("remembered_email");
      localStorage.removeItem("remembered_password");
    }
    setIsOpen(false);
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-900 transition-colors border border-transparent hover:border-slate-800"
      >
        <div className="hidden lg:flex flex-col text-left">
          <span className="text-md font-semibold text-slate-100 leading-tight">
            {user.name}
          </span>
          <span className="text-xs text-slate-400 font-mono">{user.role}</span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-3 border-b border-slate-800/80 mb-1">
            <p className="text-sm font-semibold text-white">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>

          <div className="pt-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center cursor-pointer gap-2.5 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors font-medium"
            >
              <LogOut className="size-4 text-rose-400" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
