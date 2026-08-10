import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Cpu, Zap, Activity, Users, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export const MetricsOverview: React.FC = () => {
  const metrics = [
    {
      title: 'Total AI Inferences',
      value: '2,845,120',
      change: '+18.4%',
      isPositive: true,
      icon: Cpu,
      description: 'API calls across GPT-4o & Claude 3.5',
    },
    {
      title: 'Monthly Token Expenditure',
      value: formatCurrency(1420.5),
      change: '-4.2%',
      isPositive: true,
      icon: Zap,
      description: 'Optimized via prompt caching',
    },
    {
      title: 'Avg Latency (Streaming)',
      value: '184 ms',
      change: '-12 ms',
      isPositive: true,
      icon: Activity,
      description: 'TTFT (Time To First Token)',
    },
    {
      title: 'Active Workspace Seats',
      value: '48 / 50',
      change: '+6 seats',
      isPositive: true,
      icon: Users,
      description: 'Enterprise SSO enabled',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.title} hoverable className="relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium">{metric.title}</span>
                <div className="text-2xl font-bold text-white font-heading tracking-tight">
                  {metric.value}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/60">
              <Badge variant={metric.isPositive ? 'success' : 'danger'} className="gap-1">
                <TrendingUp className="w-3 h-3" />
                {metric.change}
              </Badge>
              <span className="text-[11px] text-slate-500 truncate max-w-[140px]">
                {metric.description}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
