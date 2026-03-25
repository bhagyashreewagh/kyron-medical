import { useState } from 'react';
import { Phone, PhoneCall, PhoneOff, X } from 'lucide-react';
import { VoiceCallState } from '../types';

interface VoiceCallButtonProps {
  onInitiateCall: (phone?: string) => Promise<{ success: boolean; message: string }>;
  patientPhone?: string;
}

export function VoiceCallButton({ onInitiateCall, patientPhone }: VoiceCallButtonProps) {
  const [callState, setCallState] = useState<VoiceCallState>({ status: 'idle' });
  const [showModal, setShowModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState(patientPhone || '');

  const handleCallClick = () => {
    if (callState.status === 'calling' || callState.status === 'connected') return;
    setPhoneInput(patientPhone || '');
    setShowModal(true);
  };

  const handleConfirmCall = async () => {
    if (!phoneInput.trim()) return;
    setShowModal(false);
    setCallState({ status: 'calling', message: 'Initiating call...' });

    const result = await onInitiateCall(phoneInput.trim());

    if (result.success) {
      setCallState({ status: 'connected', message: result.message });
      // Auto-reset after 30s
      setTimeout(() => setCallState({ status: 'idle' }), 30000);
    } else {
      setCallState({ status: 'error', message: result.message });
      setTimeout(() => setCallState({ status: 'idle' }), 5000);
    }
  };

  const handleDismiss = () => setCallState({ status: 'idle' });

  const isBusy = callState.status === 'calling';
  const isConnected = callState.status === 'connected';
  const isError = callState.status === 'error';

  return (
    <>
      {/* ── Floating Voice Button ─────────────────────────────────────────── */}
      <div className="relative flex items-center justify-center">
        {/* Pulse rings — visible when idle */}
        {callState.status === 'idle' && (
          <>
            <div
              className="voice-ring absolute w-12 h-12 rounded-full pointer-events-none"
              style={{ border: '1px solid rgba(0,212,255,0.4)' }}
            />
            <div
              className="voice-ring-2 absolute w-12 h-12 rounded-full pointer-events-none"
              style={{ border: '1px solid rgba(0,212,255,0.25)' }}
            />
          </>
        )}

        <button
          onClick={handleCallClick}
          disabled={isBusy}
          title="Switch to voice call"
          className="relative w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: isConnected
              ? 'linear-gradient(135deg, #059669, #10b981)'
              : isError
              ? 'linear-gradient(135deg, #dc2626, #ef4444)'
              : isBusy
              ? 'linear-gradient(135deg, #1a3a8f, #3b82f6)'
              : 'linear-gradient(135deg, #00d4ff, #0066ff)',
            boxShadow: isConnected
              ? '0 0 20px rgba(16,185,129,0.5)'
              : isBusy
              ? '0 0 20px rgba(59,130,246,0.5)'
              : '0 0 20px rgba(0,212,255,0.5), 0 4px 12px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          {isBusy ? (
            <div
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              style={{ animation: 'spin 0.8s linear infinite' }}
            />
          ) : isConnected ? (
            <PhoneCall size={18} className="text-white" />
          ) : isError ? (
            <PhoneOff size={18} className="text-white" />
          ) : (
            <Phone size={18} className="text-white" />
          )}
        </button>
      </div>

      {/* ── Status Toast ──────────────────────────────────────────────────── */}
      {(isConnected || isError || isBusy) && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up"
          style={{ maxWidth: '90vw' }}
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm"
            style={{
              background: isConnected
                ? 'rgba(5,150,105,0.9)'
                : isError
                ? 'rgba(220,38,38,0.9)'
                : 'rgba(26,58,143,0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              color: 'white',
            }}
          >
            {isConnected && <PhoneCall size={16} />}
            {isError && <PhoneOff size={16} />}
            {isBusy && (
              <div
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                style={{ animation: 'spin 0.8s linear infinite' }}
              />
            )}
            <span>{callState.message}</span>
            {(isConnected || isError) && (
              <button onClick={handleDismiss} className="ml-2 opacity-70 hover:opacity-100">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Phone Input Modal ─────────────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(2,11,24,0.8)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 animate-slide-up"
            style={{
              background: 'rgba(10,20,50,0.95)',
              backdropFilter: 'blur(40px)',
              border: '1px solid rgba(0,212,255,0.2)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            }}
          >
            {/* Modal icon */}
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                background: 'linear-gradient(135deg, #00d4ff20, #0066ff20)',
                border: '1px solid rgba(0,212,255,0.3)',
              }}
            >
              <Phone size={24} style={{ color: '#00d4ff' }} />
            </div>

            <h3 className="text-white font-semibold text-lg text-center mb-1">
              Switch to Voice Call
            </h3>
            <p className="text-slate-400 text-sm text-center mb-5">
              Kyra will call you and pick up right where you left off in the chat.
            </p>

            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Your phone number
            </label>
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="(555) 555-5555"
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all input-glow"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmCall()}
              autoFocus
            />

            <p className="text-xs text-slate-500 mt-2 mb-5">
              Standard call rates may apply. By proceeding, you agree to receive a call from Kyron Medical.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 btn-glass"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCall}
                disabled={!phoneInput.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                style={{
                  background: 'linear-gradient(135deg, #00d4ff, #0066ff)',
                  boxShadow: '0 4px 16px rgba(0,212,255,0.3)',
                }}
              >
                Call Me Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
