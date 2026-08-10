import React, { useState } from 'react';
import { Send, Bot, User, Sparkles, CornerDownLeft, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const AiChatDemo: React.FC = () => {
  const [messages, setMessages] = useState([
    {
      id: 'msg-1',
      role: 'assistant',
      content:
        'Hello Alex! I am your AI Enterprise Assistant. How can I assist with your code architecture, LLM fine-tuning, or prompt optimization today?',
      timestamp: '10:42 AM',
    },
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSend = () => {
    if (!input.trim() || isGenerating) return;

    const userMsg = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsGenerating(true);

    setTimeout(() => {
      const aiMsg = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `I analyzed your request: "${input}". The architectural foundation is configured with React 19, TypeScript strict mode, Redux Toolkit, and Axios interceptors. Ready for production deployment!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsGenerating(false);
    }, 1200);
  };

  return (
    <Card className="flex flex-col h-[520px] p-0 overflow-hidden border-slate-800">
      <CardHeader className="p-4 border-b border-slate-800/80 bg-slate-900/60 flex flex-row items-center justify-between mb-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              AI Copilot Studio
            </CardTitle>
            <CardDescription className="text-[11px]">GPT-4o • Streaming SSE Enabled</CardDescription>
          </div>
        </div>
        <Badge variant="success" className="gap-1">
          <Sparkles className="w-3 h-3" /> Ready
        </Badge>
      </CardHeader>

      {/* Chat Messages viewport */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/40">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-tr-none shadow-md'
                  : 'glass-card border-slate-800 text-slate-200 rounded-tl-none'
              }`}
            >
              <p>{msg.content}</p>
              <span className="block mt-1 text-[9px] opacity-60 text-right">{msg.timestamp}</span>
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isGenerating && (
          <div className="flex items-center gap-2 text-xs text-sky-400 font-mono animate-pulse">
            <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
            <span>AI Copilot is thinking...</span>
          </div>
        )}
      </div>

      {/* Input controls */}
      <div className="p-3 bg-slate-900/80 border-t border-slate-800/80">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask AI Copilot anything about your project..."
            className="w-full bg-slate-950 text-xs text-slate-100 pl-4 pr-12 py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-sky-500/50"
          />
          <Button
            onClick={handleSend}
            variant="primary"
            size="sm"
            className="absolute right-1.5 p-2 h-8 w-8 rounded-lg"
            isLoading={isGenerating}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500 px-1">
          <span>Press Enter to send message</span>
          <span className="flex items-center gap-1 font-mono">
            <CornerDownLeft className="w-3 h-3" /> Shift + Enter for new line
          </span>
        </div>
      </div>
    </Card>
  );
};
