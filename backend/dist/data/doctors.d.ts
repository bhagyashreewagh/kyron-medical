export interface TimeSlot {
    id: string;
    date: string;
    time: string;
    displayDate: string;
    available: boolean;
}
export interface Doctor {
    id: string;
    name: string;
    title: string;
    specialty: string;
    keywords: string[];
    bio: string;
    slots: TimeSlot[];
}
export declare const DOCTORS: Doctor[];
export declare function getDoctorById(id: string): Doctor | undefined;
export declare function getAvailableSlots(doctorId: string, options?: {
    dayOfWeek?: string;
    timeOfDay?: string;
    limit?: number;
}): TimeSlot[];
export declare function bookSlot(slotId: string): boolean;
export declare function buildAvailabilitySummary(): string;
//# sourceMappingURL=doctors.d.ts.map