import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, PatientInfo } from '../types';

const API_BASE = '/api';

function extractPatientInfo(messages: ChatMessage[]): PatientInfo {
  // Light heuristic extraction from messages for voice handoff context
  const allText = messages.map((m) => m.content).join('\n');
  const info: PatientInfo = {};

  const nameMatch = allText.match(/(?:name is|I'm|I am|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  if (nameMatch) {
    const parts = nameMatch[1].split(' ');
    info.firstName = parts[0];
    info.lastName = parts[1] || '';
  }

  const phoneMatch = allText.match(/\b(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\b/);
  if (phoneMatch) info.phone = phoneMatch[1];

  const emailMatch = allText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) info.email = emailMatch[0];

  return info;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>(uuidv4());
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBooked, setIsBooked] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isTyping) return;

      setError(null);

      const userMsg: ChatMessage = {
        id: uuidv4(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      // Create placeholder for streaming assistant message
      const assistantMsgId = uuidv4();
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      abortRef.current = new AbortController();

      try {
        const response = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: content.trim(), sessionId }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let accumulatedText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(line.slice(6));

              if (data.sessionId && data.sessionId !== sessionId) {
                setSessionId(data.sessionId);
              }

              if (data.text) {
                accumulatedText += data.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: accumulatedText }
                      : m
                  )
                );
              }

              if (data.done) {
                if (data.booked) setIsBooked(true);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, isStreaming: false } : m
                  )
                );
              }

              if (data.error) {
                setError(data.error);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: data.error, isStreaming: false }
                      : m
                  )
                );
              }
            } catch {
              // ignore malformed SSE line
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        const msg = 'Connection error. Please try again.';
        setError(msg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: msg, isStreaming: false }
              : m
          )
        );
      } finally {
        setIsTyping(false);
      }
    },
    [sessionId, isTyping]
  );

  const getPatientPhone = useCallback((): string => {
    for (const msg of messages) {
      const match = msg.content.match(/\b(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\b/);
      if (match) return match[1];
    }
    return '';
  }, [messages]);

  const initiateVoiceCall = useCallback(
    async (overridePhone?: string): Promise<{ success: boolean; message: string }> => {
      const phone = overridePhone || getPatientPhone();
      try {
        const response = await fetch(`${API_BASE}/voice/initiate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, patientPhone: phone }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to initiate call');
        return { success: true, message: data.message };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Call failed';
        return { success: false, message: msg };
      }
    },
    [sessionId, getPatientPhone]
  );

  const getContextForVoice = useCallback((): PatientInfo => {
    return extractPatientInfo(messages);
  }, [messages]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setSessionId(uuidv4());
    setIsTyping(false);
    setError(null);
    setIsBooked(false);
  }, []);

  return {
    messages,
    sessionId,
    isTyping,
    error,
    isBooked,
    sendMessage,
    initiateVoiceCall,
    getPatientPhone,
    getContextForVoice,
    reset,
  };
}
