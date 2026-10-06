import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Store
} from 'lucide-react';
import { AiChatMessage, AiProposedAction } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useShop } from '../../context/ShopContext.tsx';

export const AiCopilotView: React.FC = () => {
  const { business, user } = useAuth();
  const { setActiveTab } = useShop();
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExecutingAction, setIsExecutingAction] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currency = business?.currency || '₹';

  const loadMessages = async () => {
    try {
      const msgs = await api.getAiMessages();
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to load AI chat messages:', err);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [business?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (msgText: string) => {
    const textToSend = msgText.trim();
    if (!textToSend || isLoading) return;

    // Optimistically append user message
    const tempUserMsg: AiChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: textToSend,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const resMsg = await api.sendAiMessage(textToSend);
      setMessages(prev => [...prev.filter(m => m.id !== tempUserMsg.id), tempUserMsg, resMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Failed to query AI copilot: ${err.message}. Please try again.`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAction = async (msgId: string, action: AiProposedAction) => {
    setIsExecutingAction(true);
    try {
      const res = await api.executeAiAction({
        messageId: msgId,
        actionId: action.id,
        actionType: action.type,
        payload: action.payload,
      });

      // Update message state
      setMessages(prev =>
        prev.map(m => {
          if (m.id === msgId && m.proposedAction) {
            return {
              ...m,
              proposedAction: { ...m.proposedAction, status: 'EXECUTED' },
            };
          }
          return m;
        })
      );

      alert(`Success: ${res.message}`);
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setIsExecutingAction(false);
    }
  };

  const handleClearChat = async () => {
    if (!confirm('Clear AI conversation history?')) return;
    try {
      await api.clearAiChat();
      setMessages([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const suggestedQuestions = [
    'How is my shop doing today?',
    'What should I restock tomorrow?',
    'Who owes me money on Khata?',
    'Show me slow-moving products',
    'How much do I owe suppliers?',
    'What are my highest expenses?',
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50 overflow-hidden">
      {/* Top Banner */}
      <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              MyShoply AI — Business Copilot
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded">
                Live Data Connected
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Private business assistant for {business?.name} · Verified real shop queries
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Clear chat history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto py-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Welcome to MyShoply AI</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                I am your private shop assistant with direct, secure access to your inventory, sales, customer khata, and supplier accounts. Ask me anything about your business.
              </p>
            </div>

            {/* Suggested prompts */}
            <div className="pt-4 max-w-lg mx-auto">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Ask a business question:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition-colors shadow-2xs text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed space-y-2 shadow-2xs ${
                    msg.role === 'user'
                      ? 'bg-slate-900 text-white font-medium rounded-tr-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                  }`}
                >
                  {/* Tools Badge */}
                  {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold mb-1 pb-1.5 border-b border-slate-100">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Verified with live store data ({msg.toolsUsed.join(', ')})</span>
                    </div>
                  )}

                  {/* Content (Render formatted Markdown / plain text lines) */}
                  <div className="whitespace-pre-wrap leading-relaxed space-y-1">
                    {msg.content}
                  </div>

                  {/* Proposed Action Card if AI drafted a Purchase Order */}
                  {msg.proposedAction && (
                    <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                          AI Action Proposal
                        </span>
                        <span className={`text-[10px] font-bold ${
                          msg.proposedAction.status === 'EXECUTED' ? 'text-emerald-700' : 'text-amber-700'
                        }`}>
                          {msg.proposedAction.status === 'EXECUTED' ? '✓ Executed & Inward PO Created' : 'Pending Confirmation'}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-900">
                        {msg.proposedAction.summary}
                      </p>

                      {msg.proposedAction.status === 'PENDING' ? (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleExecuteAction(msg.id, msg.proposedAction!)}
                            disabled={isExecutingAction}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-2xs transition-colors"
                          >
                            {isExecutingAction ? 'Creating PO...' : 'Approve & Create Purchase Order'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setActiveTab('purchases')}
                          className="text-[11px] text-emerald-700 hover:underline font-semibold flex items-center gap-1"
                        >
                          <span>View Purchase Orders</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Message footer */}
                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="hover:text-slate-600 transition-colors ml-2"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start items-center text-xs text-slate-500 py-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl shadow-2xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                  <span>Querying real shop database & calculating metrics...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Suggested Quick Questions above input if chat has started */}
      {messages.length > 0 && (
        <div className="px-4 py-1.5 bg-slate-100 border-t border-slate-200 overflow-x-auto flex items-center gap-2 text-[11px] shrink-0">
          <span className="text-slate-400 whitespace-nowrap">Suggested:</span>
          {suggestedQuestions.slice(0, 4).map((q, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(q)}
              className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-700 whitespace-nowrap"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage(inputMessage);
          }}
          className="max-w-3xl mx-auto flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask MyShoply AI (e.g. 'What should I restock?' or 'Show slow-moving products')..."
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
