import React from "react";
import { NavLink } from "react-router-dom";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/routes/routes.config";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
      <div className="glass-card max-w-md w-full p-8 rounded-3xl space-y-6 border border-slate-800 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-4xl font-extrabold text-white font-heading tracking-tight">
            404
          </span>
          <h2 className="text-xl font-bold text-white font-heading">
            Page Not Found
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The route you are looking for does not exist or has been relocated
            to another AI workspace partition.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <NavLink to={ROUTES.HOME} className="inline-flex">
            <Button
              as="span"
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Go Home
            </Button>
          </NavLink>
          <NavLink to={ROUTES.DASHBOARD} className="inline-flex">
            <Button
              as="span"
              variant="primary"
              size="sm"
              leftIcon={<Home className="w-4 h-4" />}
            >
              Dashboard
            </Button>
          </NavLink>
        </div>
      </div>
    </div>
  );
};
