export interface TimeSlot {
    id: string;
    date: string;
    time: string;
    displayDate: string;
    available: boolean;
}
export interface OfficeHours {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
}
export interface Doctor {
    id: string;
    name: string;
    title: string;
    specialty: string;
    keywords: string[];
    bio: string;
    slots: TimeSlot[];
    officeHours: OfficeHours;
}
export declare const DOCTORS: Doctor[];
export declare function getDoctorById(id: string): Doctor | undefined;
export declare function getAvailableSlots(doctorId: string, options?: {
    dayOfWeek?: string;
    timeOfDay?: string;
    limit?: number;
}): TimeSlot[];
export declare function bookSlot(slotId: string): boolean;
export declare function buildOfficeHoursSummary(): string;
export declare function buildAvailabilitySummary(): string;
//# sourceMappingURL=doctors.d.ts.map