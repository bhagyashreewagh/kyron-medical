import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '../types';
import { AppointmentCard } from './AppointmentCard';

interface MessageProps {
  message: ChatMessage;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function Message({ message }: MessageProps) {
  // Appointment card inline message
  if (message.role === 'appointment-card') {
    try {
      const details = JSON.parse(message.content);
      return (
        <AppointmentCard
          doctorName={details.doctorName}
          specialty={details.specialty}
          date={details.date}
          time={details.time}
          reason={details.reason}
        />
      );
    } catch {
      return null;
    }
  }

  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end animate-slide-in-right">
        <div className="max-w-[80%] sm:max-w-[70%]">
          <div
            className="px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed"
            style={{
              background: 'linear-gradient(135deg, #1a3a8f 0%, #1d4ed8 100%)',
              boxShadow: '0 4px 16px rgba(26,58,143,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
              border: '1px solid rgba(59,130,246,0.3)',
              color: '#f0f7ff',
            }}
          >
            {message.content}
          </div>
          <p className="text-right text-xs text-slate-500 mt-1 pr-1">
            {formatTime(message.timestamp)}
          </p>
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex items-start gap-3 animate-slide-in-left">
      {/* Avatar */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
        style={{
          background: 'linear-gradient(135deg, #0f2460 0%, #0ea5e9 100%)',
          boxShadow: '0 0 12px rgba(0,212,255,0.35)',
          border: '1px solid rgba(0,212,255,0.3)',
        }}
      >
        <span className="text-white text-xs font-bold tracking-tight">K</span>
      </div>

      <div className="max-w-[85%] sm:max-w-[75%]">
        {/* Bubble */}
        <div
          className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed"
          style={{
            background: 'rgba(15,36,96,0.4)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(0,212,255,0.12)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
            color: '#e2e8f0',
          }}
        >
          <div className={`message-content ${message.isStreaming ? 'shimmer-cursor' : ''}`}>
            <ReactMarkdown>{message.content || ' '}</ReactMarkdown>
          </div>
        </div>

        <p className="text-xs text-slate-500 mt-1 pl-1">
          Kyra · {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}
