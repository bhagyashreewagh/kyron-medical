import { useEffect, useRef, useState } from 'react';
import { Send, RotateCcw, Sparkles } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { Message } from './Message';
import { TypingIndicator } from './TypingIndicator';
import { VoiceCallButton } from './VoiceCallButton';

const QUICK_PROMPTS = [
  { label: 'Schedule an appointment', icon: '📅' },
  { label: "What's the next available appointment?", icon: '⚡' },
  { label: 'Request a prescription refill', icon: '💊' },
  { label: 'Office hours & location', icon: '📍' },
  { label: 'What insurance do you accept?', icon: '🛡️' },
];


export function ChatInterface() {
  const {
    messages,
    isTyping,
    error,
    sendMessage,
    initiateVoiceCall,
    getPatientPhone,
    reset,
  } = useChat();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Hide quick prompts after first message
  useEffect(() => {
    if (messages.length > 0) setShowQuickPrompts(false);
  }, [messages.length]);

  const handleSend = () => {
    if (!inputValue.trim() || isTyping) return;
    sendMessage(inputValue.trim());
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
    setShowQuickPrompts(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    reset();
    setInputValue('');
    setShowQuickPrompts(true);
    inputRef.current?.focus();
  };

  const patientPhone = getPatientPhone();

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 py-3"
        style={{
          background: 'rgba(2,11,24,0.6)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo + status */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #1a3a8f, #0ea5e9)',
              boxShadow: '0 0 16px rgba(0,212,255,0.3)',
              border: '1px solid rgba(0,212,255,0.2)',
            }}
          >
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm">Kyra</span>
              <Sparkles size={12} style={{ color: '#00d4ff' }} />
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="status-dot w-1.5 h-1.5 rounded-full"
                style={{ background: '#34d399' }}
              />
              <span className="text-xs" style={{ color: '#64748b' }}>
                Kyron Medical · AI Assistant
              </span>
            </div>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <VoiceCallButton
            onInitiateCall={initiateVoiceCall}
            patientPhone={patientPhone}
          />
          <button
            onClick={handleReset}
            title="Start new conversation"
            className="w-9 h-9 rounded-full flex items-center justify-center btn-glass transition-all"
          >
            <RotateCcw size={15} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* ── Messages ────────────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth-always"
        style={{ minHeight: 0 }}
      >
        {/* Welcome message (always shown) */}
        <div className="flex items-start gap-3 animate-slide-in-left">
          <div
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #0f2460 0%, #0ea5e9 100%)',
              boxShadow: '0 0 12px rgba(0,212,255,0.35)',
              border: '1px solid rgba(0,212,255,0.3)',
            }}
          >
            <span className="text-white text-xs font-bold">K</span>
          </div>
          <div className="max-w-[85%]">
            <div
              className="px-4 py-3 rounded-2xl rounded-tl-sm text-base leading-relaxed"
              style={{
                background: 'rgba(15,36,96,0.4)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0,212,255,0.12)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                color: '#e2e8f0',
              }}
            >
              <div className="message-content">
                <p className="mb-2">Hello! I'm <strong>Kyra</strong>, your virtual health assistant at Kyron Medical Group. 👋</p>
                <p className="mb-1">I can help you with:</p>
                <ul style={{ paddingLeft: '1.25em', margin: '0.25em 0' }}>
                  <li><strong>Scheduling an appointment</strong> with one of our specialists</li>
                  <li><strong>Prescription refill</strong> requests</li>
                  <li><strong>Office information</strong> — hours, location, insurance & more</li>
                </ul>
                <p style={{ marginTop: '0.5em', marginBottom: 0 }}>How can I assist you today?</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1 pl-1">
              Kyra · {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Quick prompts */}
        {showQuickPrompts && (
          <div
            className="flex flex-col gap-2 pl-11 pr-2 animate-fade-in"
            style={{ transition: 'opacity 0.3s ease, transform 0.3s ease' }}
          >
            <p className="text-xs font-medium" style={{ color: '#475569' }}>
              Quick actions
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt.label}
                  onClick={() => handleQuickPrompt(prompt.label)}
                  className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl transition-all duration-200 hover:scale-105 hover:-translate-y-0.5"
                  style={{
                    background: 'rgba(0,212,255,0.07)',
                    border: '1px solid rgba(0,212,255,0.18)',
                    color: '#7dd3fc',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}
                >
                  <span style={{ fontSize: '13px' }}>{prompt.icon}</span>
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversation messages */}
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} />
        ))}

        {/* Typing indicator */}
        {isTyping && messages[messages.length - 1]?.role !== 'assistant' && (
          <TypingIndicator />
        )}

        {/* Error banner */}
        {error && (
          <div
            className="rounded-xl px-4 py-2 text-xs text-red-300 text-center animate-fade-in"
            style={{
              background: 'rgba(220,38,38,0.1)',
              border: '1px solid rgba(220,38,38,0.2)',
            }}
          >
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Bar ───────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-4 pb-4 pt-3"
        style={{
          background: 'rgba(2,11,24,0.4)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div
          className="flex items-end gap-2 rounded-2xl px-4 py-2 transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              // Auto-resize
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder="Message Kyra..."
            rows={1}
            className="flex-1 bg-transparent text-base text-slate-200 placeholder-slate-500 outline-none resize-none py-1.5"
            style={{ maxHeight: '120px', lineHeight: '1.5' }}
            disabled={isTyping}
          />

          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed mb-0.5"
            style={{
              background: inputValue.trim()
                ? 'linear-gradient(135deg, #00d4ff, #0066ff)'
                : 'rgba(255,255,255,0.1)',
              boxShadow: inputValue.trim()
                ? '0 4px 12px rgba(0,212,255,0.4)'
                : 'none',
              transform: inputValue.trim() ? 'scale(1)' : 'scale(0.9)',
            }}
          >
            <Send size={14} className="text-white" style={{ marginLeft: '1px' }} />
          </button>
        </div>

        <p className="text-center text-xs text-slate-600 mt-2">
          Kyron Medical AI · Not a substitute for medical advice
        </p>
      </div>
    </div>
  );
}
