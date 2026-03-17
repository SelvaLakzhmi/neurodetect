import { z } from "zod";

export const screeningFormSchema = z.object({
    fullName: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    age: z.coerce.number({
        message: "Please enter a valid age",
    }).min(18, {
        message: "Patient must be at least 18 years old.",
    }).max(120, {
        message: "Invalid age."
    }),
    gender: z.enum(["male", "female", "other"], {
        message: "Please select a gender."
    }),
    email: z.string().email("Invalid email address").optional().or(z.literal('')),
    familyHistory: z.enum(["yes", "no"], {
        message: "Please indicate family history."
    }),
    scanFile: z.any().refine((val) => val !== null && val !== undefined, "MRI scan is required"),
});

// Use a separate type for the form values to avoid strict TS overlap issues during editing
export type OmitStrict<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type ScreeningFormValues = z.infer<typeof screeningFormSchema>;
