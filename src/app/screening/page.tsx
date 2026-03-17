"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Activity, BrainCircuit, FileSignature, Loader2, UploadCloud } from "lucide-react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUploader } from "@/components/shared/file-uploader"
import { screeningFormSchema, type ScreeningFormValues } from "@/lib/validations"
import { analyzeMRI } from "@/services/ai.service"
import { patientStore } from "@/services/patient.service"
import { useSearchParams } from "next/navigation"


export default function ScreeningPage() {
    return (
        <React.Suspense fallback={<div className="flex justify-center items-center h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <ScreeningFormContent />
        </React.Suspense>
    )
}

function ScreeningFormContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const patientId = searchParams.get("patientId")

    const [isSubmitting, setIsSubmitting] = React.useState(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [linkedPatient, setLinkedPatient] = React.useState<any>(null)

    React.useEffect(() => {
        const fetchLinkedPatient = async () => {
            if (patientId) {
                const pt = await patientStore.getPatientById(patientId)
                if (pt) {
                    setLinkedPatient(pt)
                }
            }
        }
        fetchLinkedPatient()
    }, [patientId])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const form = useForm<any>({
        resolver: zodResolver(screeningFormSchema),
        defaultValues: {
            fullName: "",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            age: "" as any,
            gender: undefined,
            familyHistory: undefined,
            scanFile: null,
        },
    })

    React.useEffect(() => {
        if (linkedPatient) {
            form.reset({
                fullName: linkedPatient.name,
                age: linkedPatient.age,
                gender: linkedPatient.gender,
                familyHistory: linkedPatient.familyHistory ? "yes" : "no",
                scanFile: null, // Keep file upload empty
            })
        }
    }, [linkedPatient, form])

    async function onSubmit(data: ScreeningFormValues) {
        setIsSubmitting(true)

        try {
            const result = await analyzeMRI(data.scanFile);

            // If we have a linked patient, save the scan to their history
            if (linkedPatient) {
                await patientStore.addScanToPatient(linkedPatient.id, {
                    date: new Date().toISOString(),
                    predictedClass: result.predictedClass as "Alzheimer's" | "MCI" | "Normal",
                    probability: result.probability,
                    riskLevel: result.riskLevel as "Low" | "Medium" | "High",
                });
            }

            if (typeof window !== "undefined") {
                sessionStorage.setItem("currentPrediction", JSON.stringify({
                    ...result,
                    patientName: data.fullName,
                    age: data.age,
                    gender: data.gender,
                    // Pass the patientId to the result page so it can link back
                    patientId: linkedPatient ? linkedPatient.id : undefined
                }));
            }

            toast.success("Analysis Complete", {
                description: "AI MRI screening finished successfully."
            })
            router.push("/result")
        } catch (error) {
            console.error("AI Analysis Failed", error);
            toast.error("Analysis Failed", {
                description: "There was a problem analyzing the MRI. Please ensure the AI service is running."
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="mx-auto max-w-4xl space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Patient Screening</h1>
                <p className="text-muted-foreground mt-2">
                    Enter patient demography and upload an MRI scan for AI analysis.
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid gap-8 md:grid-cols-2">

                        {/* Left Column: Patient Info */}
                        <Card className="shadow-sm border-muted/60">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileSignature className="h-5 w-5 text-primary" />
                                    Clinical Information
                                </CardTitle>
                                <CardDescription>Basic patient demographic details.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Full Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John Doe" {...field} className="bg-muted/30" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="age"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Age</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="65"
                                                    {...field}
                                                    value={field.value ?? ""}
                                                    className="bg-muted/30"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="gender"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel>Gender</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                    className="flex space-x-4"
                                                >
                                                    <FormItem className="flex items-center space-x-2 space-y-0 text-sm">
                                                        <FormControl>
                                                            <RadioGroupItem value="male" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal cursor-pointer">Male</FormLabel>
                                                    </FormItem>
                                                    <FormItem className="flex items-center space-x-2 space-y-0 text-sm">
                                                        <FormControl>
                                                            <RadioGroupItem value="female" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal cursor-pointer">Female</FormLabel>
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
                                                    className="flex space-x-4"
                                                >
                                                    <FormItem className="flex items-center space-x-2 space-y-0 text-sm">
                                                        <FormControl>
                                                            <RadioGroupItem value="yes" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal cursor-pointer">Yes</FormLabel>
                                                    </FormItem>
                                                    <FormItem className="flex items-center space-x-2 space-y-0 text-sm">
                                                        <FormControl>
                                                            <RadioGroupItem value="no" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal cursor-pointer">No</FormLabel>
                                                    </FormItem>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                            </CardContent>
                        </Card>

                        {/* Right Column: Scan Upload */}
                        <Card className="shadow-sm border-muted/60 bg-gradient-to-b from-card to-primary/5">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <UploadCloud className="h-5 w-5 text-primary" />
                                    MRI Scan Upload
                                </CardTitle>
                                <CardDescription>Upload a T1-weighted structural MRI.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <FormField
                                    control={form.control}
                                    name="scanFile"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <FileUploader
                                                    onFileSelect={field.onChange}
                                                    className="bg-background/80"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="mt-8 p-4 rounded-lg bg-primary/10 border border-primary/20 text-sm text-primary/90 flex gap-3">
                                    <Activity className="h-5 w-5 shrink-0 mt-0.5" />
                                    <p>Ensure the scan is correctly oriented and free from significant artifacts for optimal AI prediction accuracy.</p>
                                </div>
                            </CardContent>
                        </Card>

                    </div>

                    <div className="flex justify-end pt-4 border-t">
                        <Button
                            type="submit"
                            size="lg"
                            className="min-w-48 h-12 text-base rounded-full shadow-md hover:shadow-primary/25 transition-all"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Analyzing Scan...
                                </>
                            ) : (
                                <>
                                    <BrainCircuit className="mr-2 h-5 w-5" />
                                    Generate AI Report
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
