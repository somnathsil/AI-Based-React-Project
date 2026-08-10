import React from "react";
import { NavLink } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { LoginForm } from "@/features/auth/LoginForm";
import { ROUTES } from "@/routes/routes.config";

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-linear-to-tr from-sky-500/10 via-indigo-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none animate-float-glow" />

      <div className="w-full max-w-md z-10 space-y-6">
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl animate-fade-down">
          <div className="text-center space-y-2">
            <NavLink
              to={ROUTES.HOME}
              className="inline-flex items-center gap-3 group mb-2"
            >
              <span className="font-heading text-4xl font-bold tracking-tight text-white animate-fade-down-delay-1">
                Pixel<span className="text-gradient">Coders</span>
              </span>
            </NavLink>
            <h2 className="text-[26px] font-semibold text-white font-heading mt-5 mb-7 animate-fade-down-delay-2">
              Welcome Back
            </h2>
          </div>
          <div className="animate-fade-down-delay-3">
            <LoginForm />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-slate-500 animate-fade-down-delay-3">
          <span>© 2026 PixelCoders. All Right Reserved.</span>
        </div>
      </div>
    </div>
  );
};
