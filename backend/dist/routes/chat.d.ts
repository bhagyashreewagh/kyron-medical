import { ConversationMessage } from '../services/claude.js';
declare const router: import("express-serve-static-core").Router;
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
export interface Session {
    id: string;
    messages: ConversationMessage[];
    patientInfo: PatientInfo;
    createdAt: Date;
    lastActivity: Date;
}
export declare const sessions: Map<string, Session>;
export interface AppointmentDetails {
    doctorName: string;
    specialty: string;
    date: string;
    time: string;
    reason: string;
}
export default router;
//# sourceMappingURL=chat.d.ts.map