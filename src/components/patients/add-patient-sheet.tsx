"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Save, UserPlus, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"

import { patientStore } from "@/services/patient.service"

const patientSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    age: z.coerce.number().min(1, { message: "Age is required." }).max(120, { message: "Invalid age." }),
    gender: z.enum(["male", "female", "other"], { message: "Please select a gender." }),
    phone: z.string().optional(),
    email: z.string().email({ message: "Invalid email" }).optional().or(z.literal('')),
    familyHistory: z.enum(["yes", "no"], { message: "Please select family history." }),
});

type PatientFormValues = z.infer<typeof patientSchema>;

interface AddPatientSheetProps {
    children: React.ReactNode;
    onPatientAdded?: () => void;
    initialData?: {
        id: string;
        name: string;
        age: number;
        gender: "male" | "female" | "other";
        phone?: string;
        email?: string;
        familyHistory: boolean;
    };
}

export function AddPatientSheet({ children, onPatientAdded, initialData }: AddPatientSheetProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const isEditMode = !!initialData;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const form = useForm<any>({
        resolver: zodResolver(patientSchema),
        defaultValues: {
            name: initialData?.name || "",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            age: initialData?.age || ("" as any),
            gender: initialData?.gender || undefined,
            phone: initialData?.phone || "",
            email: initialData?.email || "",
            familyHistory: initialData ? (initialData.familyHistory ? "yes" : "no") : undefined,
        }
    })

    async function onSubmit(data: PatientFormValues) {
        setIsSubmitting(true)

        const processedData = {
            ...data,
            familyHistory: data.familyHistory === "yes"
        }

        try {
            await new Promise(resolve => setTimeout(resolve, 600))

            if (isEditMode && initialData) {
                await patientStore.updatePatient(initialData.id, processedData)
                toast.success("Patient updated", {
                    description: "The patient's demographic information has been saved successfully."
                });
            } else {
                const newPatient = await patientStore.addPatient(processedData)
                toast.success("Patient registered", {
                    description: "The new patient profile has been created successfully."
                });
                router.push(`/patients/${newPatient.id}`)
            }

            setOpen(false)
            if (!isEditMode) {
                form.reset()
            }

            if (onPatientAdded) {
                onPatientAdded()
            }
        } catch (error) {
            console.error("Failed to add patient:", error)
            toast.error("Action Failed", {
                description: "There was a problem saving this patient's details. Please try again."
            });
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {children}
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="flex items-center gap-2 text-xl">
                        {isEditMode ? <UserPlus className="h-5 w-5 text-primary" /> : <UserPlus className="h-5 w-5 text-primary" />}
                        {isEditMode ? "Edit Patient Details" : "Add New Patient"}
                    </SheetTitle>
                    <SheetDescription>
                        {isEditMode ? "Update the patient's existing demographic information." : "Register a new patient into the system. Enter demography below."}
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="patient@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="age"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Age</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="e.g. 65" min={1} max={120} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone (Optional)</FormLabel>
                                        <FormControl>
                                            <Input type="tel" placeholder="555-0000" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-6 pt-4 border-t">
                            <FormField
                                control={form.control}
                                name="gender"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>Biological Gender</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                value={field.value}
                                                className="flex gap-4"
                                            >
                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                    <FormControl><RadioGroupItem value="male" /></FormControl>
                                                    <FormLabel className="font-normal cursor-pointer">Male</FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                    <FormControl><RadioGroupItem value="female" /></FormControl>
                                                    <FormLabel className="font-normal cursor-pointer">Female</FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                    <FormControl><RadioGroupItem value="other" /></FormControl>
                                                    <FormLabel className="font-normal cursor-pointer">Other</FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="familyHistory"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>Family History of Alzheimer&apos;s</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                value={field.value}
                                                className="flex gap-4"
                                            >
                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                    <FormControl><RadioGroupItem value="yes" /></FormControl>
                                                    <FormLabel className="font-normal cursor-pointer">Yes</FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                    <FormControl><RadioGroupItem value="no" /></FormControl>
                                                    <FormLabel className="font-normal cursor-pointer">No</FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="pt-6 border-t flex justify-end gap-3 mt-8">
                            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {isEditMode ? "Saving..." : "Creating..."}
                                    </>
                                ) : (
                                    <>
                                        {isEditMode ? <Save className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                        {isEditMode ? "Save Changes" : "Create Patient"}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
}
