interface AppointmentDetails {
    patientFirstName: string;
    patientLastName: string;
    email: string;
    doctorName: string;
    specialty: string;
    date: string;
    time: string;
    reason: string;
}
export declare function sendAppointmentConfirmation(appt: AppointmentDetails): Promise<void>;
export {};
//# sourceMappingURL=email.d.ts.map