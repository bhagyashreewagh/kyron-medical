import axios from 'axios';
import { buildAvailabilitySummary, DOCTORS } from '../data/doctors.js';
import { ConversationMessage, buildVoiceHandoffContext } from './claude.js';

const VAPI_API_URL = 'https://api.vapi.ai';

function buildVoiceSystemPrompt(context: string): string {
  const availabilitySummary = buildAvailabilitySummary();
  const doctorList = DOCTORS.map(
    (d) => `- ${d.name} (${d.title}): ${d.specialty}`
  ).join('\n');

  return `You are Kyra, the voice AI assistant for Kyron Medical Group. You are warm, calm, and professional — like a trusted healthcare concierge.

${context}

PRACTICE INFO:
- Address: 2847 Madison Avenue, Suite 700, New York, NY 10028
- Phone: (212) 555-0100
- Hours: Mon–Fri 8AM–6PM, Sat 9AM–1PM

SPECIALISTS:
${doctorList}

AVAILABLE SLOTS (next 30 days):
${availabilitySummary}

RULES:
- NEVER provide medical advice or diagnoses.
- If asked about medical symptoms, say: "I'm not able to provide medical advice. Please speak with your doctor or call 911 in an emergency."
- Be concise for voice — speak naturally, avoid long lists.
- When presenting time slots over the phone, offer 2-3 options at a time and ask for preference.
- Today's date is March 25, 2026.
- If the caller's phone matches a previous patient, greet them by name and reference the previous context provided above.`;
}

export interface VapiCallResult {
  callId: string;
  status: string;
}

export async function initiateVoiceCall(params: {
  patientPhone: string;
  messages: ConversationMessage[];
  patientInfo: Record<string, string>;
}): Promise<VapiCallResult> {
  const apiKey = process.env.VAPI_API_KEY;
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;

  if (!apiKey || !phoneNumberId) {
    console.log('📞 VAPI (not configured) — Would call:', params.patientPhone);
    return { callId: 'demo-' + Date.now(), status: 'simulated' };
  }

  const context = buildVoiceHandoffContext(params.messages, params.patientInfo);
  const systemPrompt = buildVoiceSystemPrompt(context);

  // Normalize phone to E.164
  let toNumber = params.patientPhone.replace(/\D/g, '');
  if (!toNumber.startsWith('1') && toNumber.length === 10) {
    toNumber = '1' + toNumber;
  }
  toNumber = '+' + toNumber;

  const patientName = params.patientInfo.firstName
    ? `${params.patientInfo.firstName}${params.patientInfo.lastName ? ' ' + params.patientInfo.lastName : ''}`
    : 'there';

  const response = await axios.post(
    `${VAPI_API_URL}/call/phone`,
    {
      phoneNumberId,
      customer: { number: toNumber },
      assistant: {
        name: 'Kyra',
        model: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-6',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
          ],
          temperature: 0.7,
        },
        voice: {
          provider: '11labs',
          voiceId: process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL', // Sarah voice
        },
        firstMessage: `Hi ${patientName}! This is Kyra from Kyron Medical. I'm continuing our conversation from the chat — I have your information on file. ${getHandoffGreeting(params.messages, params.patientInfo)}`,
        firstMessageMode: 'assistant-speaks-first',
        endCallPhrases: ['goodbye', 'bye', 'thank you goodbye', 'that\'s all'],
      },
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return {
    callId: response.data.id,
    status: response.data.status,
  };
}

function getHandoffGreeting(
  messages: ConversationMessage[],
  patientInfo: Record<string, string>
): string {
  if (patientInfo.bookedAppointment) {
    return `I see you already have an appointment scheduled. How can I help you further?`;
  }
  if (patientInfo.doctorId) {
    return `It looks like we were in the process of scheduling you with ${patientInfo.doctorName}. Would you like to continue with that?`;
  }
  if (patientInfo.reason) {
    return `I see you mentioned you're coming in for ${patientInfo.reason}. Let's continue from there.`;
  }
  if (messages.length > 2) {
    return `We were chatting on our website. How can I assist you today?`;
  }
  return `How can I help you today?`;
}

// Build assistant config for inbound calls (call-back continuity)
export function buildInboundAssistantConfig(callerPhone: string): object {
  const apiKey = process.env.VAPI_API_KEY;
  const callHistory = getCallHistory(callerPhone);

  let context = '';
  if (callHistory.length > 0) {
    const lastCall = callHistory[callHistory.length - 1];
    context = `PREVIOUS CALL CONTEXT:\nThis patient has called before. Here is a summary of their last call:\n${lastCall.summary}\n\nIMPORTANT: Greet them warmly by name if known, acknowledge the previous interaction, and pick up where you left off. Do NOT ask for information already collected.`;
  } else {
    context = 'This is a new patient calling in. Greet them warmly and offer to help schedule an appointment or answer questions.';
  }

  const systemPrompt = buildVoiceSystemPrompt(context);

  const greeting = callHistory.length > 0
    ? `Hi! This is Kyra from Kyron Medical. Welcome back — I have your previous call on file. How can I help you today?`
    : `Thank you for calling Kyron Medical. This is Kyra, your virtual health assistant. How can I help you today?`;

  return {
    name: 'Kyra',
    model: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-6',
      messages: [{ role: 'system', content: systemPrompt }],
      temperature: 0.7,
    },
    voice: {
      provider: '11labs',
      voiceId: process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL',
    },
    firstMessage: greeting,
    firstMessageMode: 'assistant-speaks-first',
    endCallPhrases: ['goodbye', 'bye', 'thank you goodbye', "that's all"],
  };
}

// Store call transcripts for call-back continuity
export interface CallRecord {
  callId: string;
  patientPhone: string;
  transcript: string;
  summary: string;
  createdAt: Date;
}

export const callRecords = new Map<string, CallRecord[]>(); // keyed by normalized phone

export function storeCallRecord(record: CallRecord): void {
  const phone = normalizePhone(record.patientPhone);
  const existing = callRecords.get(phone) || [];
  existing.push(record);
  // Keep last 5 calls per patient
  if (existing.length > 5) existing.shift();
  callRecords.set(phone, existing);
  console.log(`📞 Stored call record for ${phone} (total: ${existing.length})`);
}

export function getCallHistory(phone: string): CallRecord[] {
  return callRecords.get(normalizePhone(phone)) || [];
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return '1' + digits;
  return digits;
}
