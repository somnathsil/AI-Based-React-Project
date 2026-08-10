import React from "react";

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Dashboard Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-linear-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800/80 shadow-xl relative overflow-hidden">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white font-heading tracking-tight">
              AI Command Center
            </h1>
            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 font-mono uppercase">
              Production V1.0
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Overview of live inference metrics, credit balances, and AI copilot
            execution.
          </p>
        </div>

        {/* Ambient background glow */}
        <div className="absolute right-0 top-0 w-80 h-full bg-linear-to-l from-sky-500/10 via-indigo-500/5 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};
