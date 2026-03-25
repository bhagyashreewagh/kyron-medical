interface AppointmentDetails {
    patientFirstName: string;
    patientPhone: string;
    doctorName: string;
    date: string;
    time: string;
}
export declare function sendAppointmentSMS(appt: AppointmentDetails): Promise<void>;
export {};
//# sourceMappingURL=sms.d.ts.map