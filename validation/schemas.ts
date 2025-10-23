// validation/schemas.ts
import { z } from 'zod';

// Login validation
export const loginSchema = z.object({
    email: z.string()
        .min(1, 'Email is required')
        .email('Invalid email address'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password is too long')
});

export type LoginInput = z.infer<typeof loginSchema>;

// Appointment booking validation
export const appointmentSchema = z.object({
    date: z.string()
        .min(1, 'Date is required')
        .refine((date) => {
            const selectedDate = new Date(date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return selectedDate >= today;
        }, 'Date must be today or in the future'),
    time: z.string()
        .min(1, 'Time is required')
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    providerId: z.number().positive('Provider is required')
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;

// Session note validation
export const sessionNoteSchema = z.object({
    type: z.enum([
        'Initial Assessment',
        'Follow-up',
        'Check-in',
        'Crisis Intervention',
        'Medication Review',
        'Treatment Plan Update',
        'Progress Note',
        'Discharge Planning',
        'Other'
    ]),
    summary: z.string()
        .min(10, 'Note must be at least 10 characters')
        .max(5000, 'Note is too long (max 5000 characters)')
});

export type SessionNoteInput = z.infer<typeof sessionNoteSchema>;

// Patient medication validation
export const medicationSchema = z.object({
    name: z.string()
        .min(1, 'Medication name is required')
        .max(200, 'Medication name is too long'),
    dosage: z.string()
        .min(1, 'Dosage is required')
        .max(100, 'Dosage is too long'),
    frequency: z.string()
        .min(1, 'Frequency is required')
        .max(100, 'Frequency is too long'),
    isCurrent: z.boolean()
});

export type MedicationInput = z.infer<typeof medicationSchema>;

// Patient allergy validation
export const allergySchema = z.object({
    name: z.string()
        .min(1, 'Allergy name is required')
        .max(200, 'Allergy name is too long'),
    severity: z.enum(['mild', 'moderate', 'severe']),
    reaction: z.string()
        .max(500, 'Reaction description is too long')
        .optional()
});

export type AllergyInput = z.infer<typeof allergySchema>;

// Message validation
export const messageSchema = z.object({
    text: z.string()
        .min(1, 'Message cannot be empty')
        .max(2000, 'Message is too long (max 2000 characters)')
});

export type MessageInput = z.infer<typeof messageSchema>;

// Patient profile update validation
export const patientProfileSchema = z.object({
    dateOfBirth: z.string()
        .optional()
        .refine((dob) => {
            if (!dob) return true;
            const birthDate = new Date(dob);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            return age >= 0 && age <= 120;
        }, 'Invalid date of birth'),
    phoneNumber: z.string()
        .optional()
        .refine((phone) => {
            if (!phone) return true;
            return /^\+?[\d\s\-\(\)]+$/.test(phone);
        }, 'Invalid phone number format'),
    email: z.string()
        .email('Invalid email address')
        .optional(),
    address: z.string()
        .max(500, 'Address is too long')
        .optional(),
    pharmacy: z.string()
        .max(200, 'Pharmacy name is too long')
        .optional()
});

export type PatientProfileInput = z.infer<typeof patientProfileSchema>;

// Helper function to validate data and return errors
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean;
    data?: T;
    errors?: Record<string, string>;
} {
    const result = schema.safeParse(data);

    if (result.success) {
        return {
            success: true,
            data: result.data
        };
    }

    const errors: Record<string, string> = {};
    result.error.errors.forEach(err => {
        const path = err.path.join('.');
        errors[path] = err.message;
    });

    return {
        success: false,
        errors
    };
}
