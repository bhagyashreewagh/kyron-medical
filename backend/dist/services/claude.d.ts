export interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
}
export declare function streamChatResponse(messages: ConversationMessage[], onChunk: (text: string) => void): Promise<string>;
export declare function buildVoiceHandoffContext(messages: ConversationMessage[], patientInfo: Record<string, string>): string;
//# sourceMappingURL=claude.d.ts.map