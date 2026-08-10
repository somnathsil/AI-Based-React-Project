import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Terminal, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';

export const RecentActivity: React.FC = () => {
  const logs = [
    {
      id: 'log-101',
      model: 'gpt-4o-mini',
      prompt: 'Summarize quarterly financial report & extract KPIs',
      tokens: 3420,
      latency: '240ms',
      status: 'completed',
      timestamp: '2 mins ago',
    },
    {
      id: 'log-102',
      model: 'claude-3-5-sonnet',
      prompt: 'Generate TypeScript React hook for SSE streaming response',
      tokens: 8900,
      latency: '620ms',
      status: 'completed',
      timestamp: '14 mins ago',
    },
    {
      id: 'log-103',
      model: 'gemini-1.5-pro',
      prompt: 'Analyze multimodal video keyframes for defect detection',
      tokens: 18400,
      latency: '1.2s',
      status: 'completed',
      timestamp: '1 hour ago',
    },
    {
      id: 'log-104',
      model: 'mistral-large',
      prompt: 'Batch generate email response embeddings',
      tokens: 0,
      latency: '500ms',
      status: 'rate_limited',
      timestamp: '3 hours ago',
    },
  ];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-sky-400" />
            Live AI Execution Logs
          </CardTitle>
          <CardDescription>Real-time streaming event stream & token telemetry</CardDescription>
        </div>
        <Badge variant="cyan" className="font-mono">
          WebSocket Active
        </Badge>
      </CardHeader>

      <div className="divide-y divide-slate-800/80 overflow-x-auto">
        {logs.map((log) => (
          <div key={log.id} className="py-3 px-1 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3 min-w-[240px]">
              {log.status === 'completed' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <div className="flex flex-col">
                <span className="font-mono text-slate-200 font-semibold">{log.prompt}</span>
                <span className="text-[11px] text-slate-400 font-mono">ID: {log.id}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-slate-400">
              <Badge variant="purple" className="font-mono text-[10px]">
                {log.model}
              </Badge>
              <span className="font-mono text-slate-300">{log.tokens.toLocaleString()} tokens</span>
              <span className="font-mono text-slate-400 hidden sm:inline">{log.latency}</span>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 min-w-[80px]">
                <Clock className="w-3 h-3" />
                <span>{log.timestamp}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
