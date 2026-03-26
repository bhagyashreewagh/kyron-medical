export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'appointment-card';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface PatientInfo {
  firstName?: string;
  lastName?: string;
  dob?: string;
  phone?: string;
  email?: string;
  reason?: string;
  doctorId?: string;
  doctorName?: string;
  bookedAppointment?: string;
}

export interface VoiceCallState {
  status: 'idle' | 'calling' | 'connected' | 'ended' | 'error';
  callId?: string;
  message?: string;
}
