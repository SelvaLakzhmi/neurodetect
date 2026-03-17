"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { patientStore } from "@/services/patient.service"
import { Download, ArrowLeft, Loader2, Mail, Edit } from "lucide-react"
import Link from "next/link"
import { useAppContext } from "@/lib/auth-context"
import { AddPatientSheet } from "@/components/patients/add-patient-sheet"

import html2canvas from "html2canvas"
import jsPDF from "jspdf"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"

// Fallback Mock Data in case session storage is empty
const defaultResult = {
    patientId: "PT-8392",
    date: new Date().toLocaleDateString(),
    riskLevel: "High",
    probability: 87.4,
    confidence: 94.2,
    findings: [
        "Significant medial temporal lobe atrophy observed.",
        "Hippocampal volume reduction detected (-2.4 SD below age mean).",
        "Ventricular enlargement present.",
    ],
    recommendation: "Immediate clinical follow-up recommended. Suggest neuropsychological evaluation and consideration of CSF biomarker testing.",
}

const getDistributionData = (prob: number) => {
    return [
        { name: "Alzheimer's", value: prob, color: "hsl(var(--destructive))" },
        { name: "MCI", value: Math.max(0, 100 - prob - 5), color: "hsl(var(--chart-4))" },
        { name: "Normal", value: 5, color: "hsl(var(--chart-3))" },
    ]
}

const historicalData = [
    { region: "Hippocampus", atrophy: 85 },
    { region: "Entorhinal", atrophy: 78 },
    { region: "Amygdala", atrophy: 62 },
    { region: "Cerebral Cortex", atrophy: 45 },
]

export const getDynamicReportDetails = (prob: number) => {
    if (prob <= 30) {
        return {
            observations: [
                "Patient is oriented to time and place.",
                "No significant memory impairment reported.",
                "Conversational language and comprehension appear intact.",
                "Able to perform routine planning and problem-solving tasks."
            ],
            cognitive: {
                memory: "Normal",
                language: "Intact",
                attention: "Normal",
                executive: "Intact"
            },
            risk: "Based on the cognitive screening and behavioral observations, there is no evidence of significant cognitive impairment. Findings are consistent with healthy aging.",
            recommendation: [
                "Continue routine annual physical checkups.",
                "Maintain a physically active lifestyle and healthy diet.",
                "Stay socially and cognitively engaged.",
                "Monitor for any future anecdotal changes in memory."
            ],
            overall: "No significant cognitive decline detected. The patient's cognitive function appears age-appropriate. Monitor routinely as part of standard preventive care."
        }
    } else if (prob <= 60) {
        return {
            observations: [
                "Mild short-term memory impairment observed.",
                "Patient reports difficulty recalling recent events.",
                "Occasional confusion in time and location.",
                "Reduced ability in problem solving and planning tasks."
            ],
            cognitive: {
                memory: "Moderate decline",
                language: "Mild impairment",
                attention: "Slightly reduced",
                executive: "Moderately affected"
            },
            risk: "Based on the cognitive screening, the patient shows early indicators consistent with Mild Cognitive Impairment (MCI), which may be associated with the early stages of neurodegenerative processes.",
            recommendation: [
                "Detailed neurological evaluation is recommended.",
                "MRI brain imaging and laboratory investigations may be required.",
                "Cognitive therapy and lifestyle modifications suggested.",
                "Regular monitoring every 6 months."
            ],
            overall: "Findings indicate possible early-stage cognitive decline. Further clinical evaluation by a qualified neurologist or geriatric specialist is strongly advised for confirmation."
        }
    } else {
        return {
            observations: [
                "Significant short-term and long-term memory loss reported.",
                "Frequent disorientation in familiar surroundings.",
                "Noticeable difficulty finding words during conversation.",
                "Impaired judgment and severe difficulty with complex tasks."
            ],
            cognitive: {
                memory: "Severe decline",
                language: "Moderate to severe impairment",
                attention: "Poor",
                executive: "Severely impaired"
            },
            risk: "Strong indicators of significant cognitive impairment are present, highly consistent with advanced Mild Cognitive Impairment or Alzheimer's disease.",
            recommendation: [
                "Urgent referral to a neurologist or memory care specialist.",
                "Comprehensive biomarker testing and MRI brain imaging required.",
                "Conduct safety assessment of the patient's living environment.",
                "Initiate discussions regarding caregiver support and long-term planning."
            ],
            overall: "Findings strongly suggest significant neurodegenerative decline. Immediate specialized medical intervention and comprehensive care planning are critical."
        }
    }
}

interface PredictionData {
    patientId?: string; // Optional since it might be a guest scan
    patientName?: string;
    patientAge?: number | string;
    patientGender?: string;
    patientPhone?: string;
    patientEmail?: string;
    date: string;
    riskLevel: string;
    probability: number;
    confidence: number;
    findings: string[];
    recommendation: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chartData?: any[];
}

export default function ResultPage() {
    return (
        <React.Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Report...</div>}>
            <ResultPageContent />
        </React.Suspense>
    )
}

function ResultPageContent() {
    const searchParams = useSearchParams()
    const scanId = searchParams.get("scanId")
    const patientId = searchParams.get("patientId")
    const [predictionResult, setPredictionResult] = React.useState<PredictionData | null>(null)
    const [isGenerating, setIsGenerating] = React.useState(false)

    React.useEffect(() => {
        const fetchPrediction = async () => {
            if (typeof window !== "undefined") {
                if (scanId && patientId) {
                    const patient = await patientStore.getPatientById(patientId);
                    if (patient) {
                        const scan = patient.scans.find(s => s.id === scanId);

                        const chartData = [...patient.scans].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(s => ({
                            date: new Date(s.date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
                            probability: s.probability,
                            riskLevel: s.riskLevel,
                            fullDate: new Date(s.date).toLocaleDateString()
                        }));

                        if (scan) {
                            setPredictionResult({
                                patientId: patientId,
                                patientName: patient.name,
                                patientAge: patient.age,
                                patientGender: patient.gender,
                                patientPhone: patient.phone || "N/A",
                                patientEmail: patient?.email || "",
                                date: new Date(scan.date).toLocaleDateString(),
                                riskLevel: scan.riskLevel,
                                probability: scan.probability,
                                confidence: scan.riskLevel === 'High' ? 94.2 : scan.riskLevel === 'Medium' ? 88.5 : 98.1,
                                findings: scan.riskLevel === 'High'
                                    ? defaultResult.findings
                                    : ["No significant medial temporal atrophy.", "Hippocampal volume within normal limits for age."],
                                recommendation: scan.riskLevel === 'High'
                                    ? defaultResult.recommendation
                                    : "No immediate intervention required based on current MRI findings. Routine age-appropriate screening advised.",
                                chartData: chartData
                            });
                            return;
                        }
                    }
                }

                const stored = sessionStorage.getItem("currentPrediction")
                if (stored) {
                    const parsed = JSON.parse(stored)
                    setPredictionResult({
                        ...parsed,
                        patientName: parsed.patientName || "Guest User",
                        patientAge: parsed.age || "N/A",
                        patientGender: parsed.gender || "N/A",
                        patientPhone: "N/A"
                    })
                } else {
                    setPredictionResult({
                        ...defaultResult,
                        patientName: "Guest User",
                        patientAge: "N/A",
                        patientGender: "N/A",
                        patientPhone: "N/A"
                    })
                }
            }
        }

        fetchPrediction()
    }, [scanId, patientId])

    const { profile, settings } = useAppContext()

    const handleDownloadPdf = async () => {
        setIsGenerating(true);
        const page1 = document.getElementById('report-page-1');

        if (!page1) {
            setIsGenerating(false);
            return;
        }

        // Briefly lock dimensions and style for export
        const originalWidth1 = page1.style.width;
        page1.style.width = '800px';
        page1.classList.add('max-w-none');

        // Small delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        try {
            const canvas1 = await html2canvas(page1, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            const imgData1 = canvas1.toDataURL('image/jpeg', 0.95);

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight1 = (canvas1.height * pdfWidth) / canvas1.width;

            pdf.addImage(imgData1, 'JPEG', 0, 0, pdfWidth, pdfHeight1);

            // strictly sanitize filename to prevent browser fallback rejections
            const rawName = predictionResult?.patientName ? String(predictionResult.patientName) : "Guest";
            const safeName = rawName.replace(/[^a-zA-Z0-9]/g, "_");

            pdf.save(`Alzheimers_Report_${safeName}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error("Action Failed", {
                description: "There was an error generating the PDF. Please try again."
            });
        } finally {
            // Restore original styling
            page1.style.width = originalWidth1;
            page1.classList.remove('max-w-none');
            setIsGenerating(false);
        }
    };

    const handleNotifyPatient = async () => {
        if (!settings?.supportEmail || !settings?.supportEmailPassword) {
            toast.error("Support Email configurations are missing.", {
                description: "Please enter them in Settings > General before sending automated emails."
            });
            return;
        }

        if (!predictionResult || !predictionResult.patientEmail || predictionResult.patientEmail === "N/A") {
            toast.error("No email address found.", {
                description: "Please update the patient's record first."
            });
            return;
        }

        const subject = `Medical Diagnostic Report - ${predictionResult.patientName}`;
        const reportTextDetails = getDynamicReportDetails(predictionResult.probability || 0);

        const bodyLines = [
            `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">`,
            `<h2 style="color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 10px;">Medical Diagnostic Report</h2>`,
            `<p>Dear <strong>${predictionResult.patientName}</strong>,</p>`,
            `<p>Your Alzheimer's Disease Assessment report is ready for your review.</p>`,
            `<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">`,
            `<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color:#64748b;">Assessment Date:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${predictionResult.date}</td></tr>`,
            `<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color:#64748b;">Facility:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${settings?.facilityName || "Neurology Assessment Center"}</td></tr>`,
            `<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color:#64748b;">Consulting Doctor:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${profile?.name || "Dr. Assigned"}</td></tr>`,
            `<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color:#64748b;">AI Diagnostic Probability:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${Math.round(predictionResult.probability || 0)}% Risk</td></tr>`,
            `</table>`,
            `<div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">`,
            `<strong style="color: #0f172a; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Risk Evaluation:</strong><br/>`,
            `<p style="font-size: 14px; margin-top: 5px; margin-bottom: 15px;">${reportTextDetails.risk}</p>`,
            `<strong style="color: #0f172a; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Overall Assessment:</strong><br/>`,
            `<p style="font-size: 14px; margin-top: 5px;">${reportTextDetails.overall}</p>`,
            `</div>`,
            `<p style="font-size: 13px; color: #64748b; margin-top: 30px;">Please consult with your doctor for a detailed explanation of these results and the recommended next steps. This is an AI-assisted diagnostic evaluation and should not replace professional clinical judgment.</p>`,
            `<p style="margin-top: 20px;">Best regards,<br/><strong>${settings?.facilityName || "Neurology Assessment Center"}</strong></p>`,
            `</div>`
        ];

        const htmlBody = bodyLines.join('\n');

        try {
            const success = await patientStore.sendAutomatedEmail(
                predictionResult.patientEmail as string,
                predictionResult.patientName as string,
                subject,
                htmlBody,
                settings.supportEmail,
                settings.supportEmailPassword
            );

            if (success) {
                toast.success("Email sent successfully!");
            } else {
                toast.error("Action Failed", {
                    description: "There was a problem sending the email via NodeMailer. Please verify your App Password."
                });
            }
        } catch (error) {
            console.error("Failed to sequence email:", error);
            toast.error("Action Failed", {
                description: "There was a problem triggering the email sequence. Please try again."
            });
        }
    };

    if (!predictionResult) return <div className="p-8 text-center text-muted-foreground">Loading Report...</div>

    const isHighRisk = predictionResult.riskLevel === "High"
    const reportText = getDynamicReportDetails(predictionResult.probability || 0)

    return (
        <div className="mx-auto max-w-[800px] space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Action Bar (Not printed in PDF) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild className="text-muted-foreground mr-auto sm:mr-0">
                        <Link href={predictionResult.patientId && predictionResult.patientId !== "PT-8392" ? `/patients/${predictionResult.patientId}` : "/screening"}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
                    {predictionResult.patientId && predictionResult.patientId !== "PT-8392" && (
                        <AddPatientSheet
                            initialData={{
                                id: predictionResult.patientId,
                                name: predictionResult.patientName || "",
                                age: parseInt(predictionResult.patientAge as string) || 0,
                                gender: (predictionResult.patientGender as "male" | "female" | "other") || "other",
                                phone: predictionResult.patientPhone,
                                email: predictionResult.patientEmail,
                                familyHistory: false // We don't have this in the scan result payload directly, but it's required for the form.
                            }}
                            onPatientAdded={async () => {
                                // Refresh current prediction specific data
                                const updatedPatient = await patientStore.getPatientById(predictionResult.patientId!);
                                if (updatedPatient) {
                                    setPredictionResult(prev => prev ? {
                                        ...prev,
                                        patientName: updatedPatient.name,
                                        patientAge: updatedPatient.age.toString(),
                                        patientGender: updatedPatient.gender,
                                        patientPhone: updatedPatient.phone,
                                        patientEmail: updatedPatient.email
                                    } : prev);
                                }
                            }}
                        >
                            <Button variant="outline" className="shrink-0">
                                <Edit className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Edit Patient</span>
                                <span className="sm:hidden">Edit</span>
                            </Button>
                        </AddPatientSheet>
                    )}
                    <Button variant="outline" className="shrink-0" onClick={handleNotifyPatient}>
                        <Mail className="mr-2 h-4 w-4" />
                        Notify Patient
                    </Button>
                    <Button className="shrink-0 group" onClick={handleDownloadPdf} disabled={isGenerating}>
                        {isGenerating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="mr-2 h-4 w-4 group-hover:animate-bounce" />
                        )}
                        {isGenerating ? "Exporting..." : "Download PDF"}
                    </Button>
                </div>
            </div>

            {/* Content wrapped for PDF Export */}
            <div className="shadow-2xl border border-muted-foreground/20 rounded-sm overflow-hidden bg-white text-black flex justify-center">
                <div id="report-page-1" className="bg-white text-black p-8 w-[794px] h-[1122px] relative flex flex-col font-sans box-border shrink-0">

                    {/* Header */}
                    <div className="border-b-4 border-primary pb-3 mb-5 flex justify-between items-end shrink-0">
                        <div className="space-y-1">
                            <h1 className="text-2xl font-extrabold text-primary tracking-tight">{settings?.facilityName || "Neurology Assessment Center"}</h1>
                            <p className="text-xs text-primary/80 font-semibold tracking-widest uppercase">Medical Diagnostic Report</p>
                        </div>
                        <div className="text-right text-xs text-primary/90">
                            <p className="font-bold uppercase tracking-wider">Alzheimer’s Disease Assessment</p>
                            <p className="opacity-80">Strictly Confidential</p>
                        </div>
                    </div>

                    {/* Report To Section */}
                    <div className="mb-5 border border-gray-300 p-3 bg-gray-50/50 rounded-sm shrink-0">
                        <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Patient Name</p>
                                <p className="text-sm font-semibold">{predictionResult.patientName}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Consultation Doctor</p>
                                <p className="text-sm font-semibold">{profile?.name || "Dr. Assigned"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Mobile Number</p>
                                <p className="text-xs font-medium">{predictionResult.patientPhone || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Email</p>
                                <p className="text-xs font-medium">{predictionResult.patientEmail || "N/A"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Report Result Details */}
                    <div className="space-y-5 flex-1 flex flex-col min-h-0">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-1 shrink-0">
                            <h2 className="text-base font-bold uppercase tracking-wide text-gray-900">Report Result Details</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50/30 p-3 rounded-sm border border-gray-100 shrink-0">
                            <div><span className="font-bold text-gray-700">Assessment Type:</span> <span className="text-gray-900 font-medium">Cognitive Screening for Alzheimer’s Disease</span></div>
                            <div><span className="font-bold text-gray-700">Assessment Date:</span> <span className="text-gray-900 font-medium">{predictionResult.date}</span></div>
                        </div>

                        {/* AI Output Section */}
                        <div className="flex flex-col items-center justify-center p-4 bg-primary/5 rounded-md border border-primary/20 shrink-0">
                            <p className="text-[10px] uppercase tracking-widest font-bold text-primary mb-1">AI Diagnostic Probability</p>
                            <div className="flex items-end gap-2 text-primary">
                                <span className="text-4xl font-extrabold leading-none">{predictionResult.probability || predictionResult.probability}%</span>
                                <span className="text-xs font-bold leading-relaxed mb-1 uppercase tracking-wider px-2 py-0.5 rounded-sm bg-primary/10">
                                    {isHighRisk ? "High Risk" : predictionResult.riskLevel}
                                </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-2 font-medium">
                                Confidence Score: {predictionResult.confidence || predictionResult.confidence}%
                            </p>
                        </div>

                        <div className="shrink-0">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2 pl-2">Clinical Observations</h3>
                            <div className="pl-2 space-y-1 text-xs text-gray-800">
                                {reportText.observations.map((obs, i) => (
                                    <p key={i}>{obs}</p>
                                ))}
                            </div>
                        </div>

                        <div className="shrink-0">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2 pl-2">Cognitive Test Summary</h3>
                            <div className="grid grid-cols-2 gap-2 pl-2">
                                <div className="text-xs text-gray-800"><span className="font-semibold text-gray-900">Memory Recall Score:</span> {reportText.cognitive.memory}</div>
                                <div className="text-xs text-gray-800"><span className="font-semibold text-gray-900">Language Ability:</span> {reportText.cognitive.language}</div>
                                <div className="text-xs text-gray-800"><span className="font-semibold text-gray-900">Attention & Concentration:</span> {reportText.cognitive.attention}</div>
                                <div className="text-xs text-gray-800"><span className="font-semibold text-gray-900">Executive Function:</span> {reportText.cognitive.executive}</div>
                            </div>
                        </div>

                        <div className="shrink-0">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2 pl-2">Risk Evaluation</h3>
                            <p className="text-xs leading-relaxed text-gray-800 pl-2">
                                {reportText.risk}
                            </p>
                        </div>

                        <div className="shrink-0">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2 pl-2">Recommendation</h3>
                            <div className="pl-2 space-y-1 text-xs text-gray-800">
                                {reportText.recommendation.map((rec, i) => (
                                    <p key={i}>{rec}</p>
                                ))}
                            </div>
                        </div>

                        <div className="bg-primary/5 p-3 rounded-sm mt-auto shrink-0">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-1 pl-2">Overall Assessment</h3>
                            <p className="text-xs leading-relaxed font-semibold text-gray-900 pl-2">
                                {reportText.overall}
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 border-t-2 border-primary pt-3 text-[10px] text-primary/90 flex justify-between items-end shrink-0">
                        <div className="space-y-0.5">
                            <p className="font-bold tracking-wide text-xs">Generated By: AI Cognitive Analysis System</p>
                            <p className="opacity-80">Report ID: AI-ALZ-{new Date().getFullYear()}-{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</p>
                            <p className="opacity-80">Date Generated: {new Date().toLocaleDateString()}</p>
                        </div>
                        <div className="text-right space-y-0.5">
                            <p className="font-bold tracking-wide uppercase">Disclaimer</p>
                            <p className="opacity-80 font-medium max-w-[200px]">AI Generated Report - Please consult a doctor.</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
