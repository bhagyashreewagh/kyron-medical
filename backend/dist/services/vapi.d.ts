import { ConversationMessage } from './claude.js';
export interface VapiCallResult {
    callId: string;
    status: string;
}
export declare function initiateVoiceCall(params: {
    patientPhone: string;
    messages: ConversationMessage[];
    patientInfo: Record<string, string>;
}): Promise<VapiCallResult>;
export interface CallRecord {
    callId: string;
    patientPhone: string;
    transcript: string;
    summary: string;
    createdAt: Date;
}
export declare const callRecords: Map<string, CallRecord[]>;
export declare function storeCallRecord(record: CallRecord): void;
export declare function getCallHistory(phone: string): CallRecord[];
//# sourceMappingURL=vapi.d.ts.map