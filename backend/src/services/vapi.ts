import axios from 'axios';
import { buildAvailabilitySummary, DOCTORS } from '../data/doctors.js';
import { ConversationMessage, buildVoiceHandoffContext } from './claude.js';
import { findPatient } from './patients.js';

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
  const callHistory = getCallHistory(callerPhone);

  // Also check persistent patient store (survives server restarts)
  const persistedPatient = findPatient(callerPhone);

  let context = '';
  let greeting = `Thank you for calling Kyron Medical. This is Kyra, your virtual health assistant. How can I help you today?`;

  if (callHistory.length > 0) {
    // Best case: in-memory call transcript available
    const lastCall = callHistory[callHistory.length - 1];
    const patientName = persistedPatient ? `${persistedPatient.firstName}` : 'there';
    context = `PREVIOUS CALL CONTEXT:
This patient has called before. Summary of their last call:
${lastCall.summary}

${persistedPatient ? `PATIENT ON FILE:
- Name: ${persistedPatient.firstName} ${persistedPatient.lastName}
- DOB: ${persistedPatient.dob}
- Phone: ${persistedPatient.phone}
- Email: ${persistedPatient.email}
- Last Visit: ${persistedPatient.lastVisit || 'N/A'} with ${persistedPatient.lastDoctor || 'our practice'}
` : ''}
IMPORTANT: Greet them by name, acknowledge the previous call, pick up where you left off. Do NOT re-ask for information already collected.`;
    greeting = `Hi ${patientName}! This is Kyra from Kyron Medical. Welcome back — I have your previous conversation on file. How can I help you today?`;

  } else if (persistedPatient) {
    // Server restarted — no call transcript but patient exists in DB
    context = `RETURNING PATIENT FROM DATABASE:
This patient has visited Kyron Medical before. Their details are on file:
- Name: ${persistedPatient.firstName} ${persistedPatient.lastName}
- DOB: ${persistedPatient.dob}
- Phone: ${persistedPatient.phone}
- Email: ${persistedPatient.email}
- Last Visit: ${persistedPatient.lastVisit || 'N/A'} with ${persistedPatient.lastDoctor || 'our practice'}
- Last Reason: ${persistedPatient.lastReason || 'N/A'}

IMPORTANT: Greet them warmly by name. Tell them you have their details on file. Do NOT ask for name, DOB, phone, or email again. Ask how you can help them today.`;
    greeting = `Hi ${persistedPatient.firstName}! This is Kyra from Kyron Medical. Great to hear from you again — I have your details on file. How can I help you today?`;

  } else {
    // Brand new caller
    context = 'This is a new patient calling in. Greet them warmly and offer to help schedule an appointment or answer questions.';
  }

  const systemPrompt = buildVoiceSystemPrompt(context);

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
