"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
    ArrowLeft,
    User,
    Calendar,
    Phone,
    Activity,
    Plus,
    Dna,
    AlertCircle,
    SearchX,
    Mail,
    Edit,
    Send,
    Loader2
} from "lucide-react"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from "recharts"

import { Patient } from "@/types"
import { patientStore } from "@/services/patient.service"
import { useAppContext } from "@/lib/auth-context"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { AddPatientSheet } from "@/components/patients/add-patient-sheet"

export default function PatientDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const { settings, profile } = useAppContext()
    const [patient, setPatient] = useState<Patient | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSendingEmail, setIsSendingEmail] = useState(false)

    useEffect(() => {
        const fetchPatientProfile = async () => {
            if (typeof params.id === "string") {
                const data = await patientStore.getPatientById(params.id)
                if (data) {
                    setPatient(data)
                }
            }
            setIsLoading(false)
        }
        fetchPatientProfile()
    }, [params.id])

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading patient data...</div>
    }

    if (!patient) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh]">
                <div className="rounded-full bg-destructive/10 p-4 mb-4">
                    <SearchX className="h-10 w-10 text-destructive" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight">Patient Not Found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
                    The patient ID you are looking for does not exist or has been removed.
                </p>
                <Button asChild>
                    <Link href="/patients">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patient List
                    </Link>
                </Button>
            </div>
        )
    }

    // Prepare chart data - sort chronological (oldest to newest) for line chart progress
    const chartData = [...patient.scans].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(scan => ({
        date: new Date(scan.date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
        probability: scan.probability,
        riskLevel: scan.riskLevel,
        fullDate: new Date(scan.date).toLocaleDateString()
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-card border border-border p-3 rounded-lg shadow-xl text-sm leading-tight text-card-foreground">
                    <p className="font-semibold mb-1">{data.fullDate}</p>
                    <p>Risk Level: <span className={
                        data.riskLevel === 'High' ? 'text-destructive font-bold' :
                            data.riskLevel === 'Moderate' ? 'text-primary font-bold' : 'text-chart-3 font-bold'
                    }>{data.riskLevel}</span></p>
                    <p>Probability: <span className="font-semibold">{data.probability}%</span></p>
                </div>
            );
        }
        return null;
    };

    const handleNewScan = () => {
        // Here we could pass patient ID via URL query or a mock context
        // For now, redirect strictly to screening. 
        // In a real app we'd attach the context `?patientId=${patient.id}`
        router.push(`/screening?patientId=${patient.id}`)
    }

    const handleSendConsolidatedReport = async () => {
        if (!settings?.supportEmail || !settings?.supportEmailPassword) {
            toast.error("Support Email missing", { description: "Please configure your clinic's Sender Email in Settings." })
            return;
        }

        if (!patient.email) {
            toast.error("Patient Email missing", { description: "Please edit the patient profile to add an email address first." })
            return;
        }

        if (!patient.scans || patient.scans.length === 0) {
            toast.error("No scans available", { description: "This patient has no scan history to report." })
            return;
        }

        setIsSendingEmail(true)

        try {
            const subject = `Consolidated Medical Scan Report - ${patient.name}`;

            // Build the multi-scan HTML table rows
            const scanRows = [...patient.scans]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Newest first
                .map(scan => `
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${new Date(scan.date).toLocaleDateString()}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${scan.predictedClass}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${Math.round(scan.probability*10)}% Risk</td>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: ${scan.riskLevel === 'High' ? '#ef4444' : scan.riskLevel === 'Medium' ? '#3b82f6' : '#10b981'};">${scan.riskLevel}</td>
                    </tr>
                `).join("");

            const htmlBody = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 10px;">Consolidated MRI Scan History</h2>
                    <p>Dear <strong>${patient.name}</strong>,</p>
                    <p>Enclosed is a summary of all Alzheimer's Disease Assessment MRI scans processed by our clinic to date.</p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; text-align: left;">
                        <thead>
                            <tr style="background-color: #f8fafc; color: #64748b; font-size: 13px; text-transform: uppercase;">
                                <th style="padding: 10px 8px;">Date</th>
                                <th style="padding: 10px 8px;">Result</th>
                                <th style="padding: 10px 8px;">Probability</th>
                                <th style="padding: 10px 8px;">Risk</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${scanRows}
                        </tbody>
                    </table>

                    <p style="font-size: 13px; color: #64748b; margin-top: 30px;">This is an AI-assisted longitudinal evaluation and should not replace professional clinical judgment. Please consult with your neurologist for personalized care.</p>
                    <p style="margin-top: 20px;">Best regards,<br/><strong>${profile?.name || "Dr. Assigned"}</strong><br/>${settings?.facilityName || "Neurology Center"}</p>
                </div>
            `;

            const success = await patientStore.sendAutomatedEmail(
                patient.email,
                patient.name,
                subject,
                htmlBody,
                settings.supportEmail,
                settings.supportEmailPassword
            );

            if (success) {
                toast.success("Consolidated Report Sent", { description: "The patient scan history was emailed successfully." });
            } else {
                toast.error("Action Failed", { description: "Nodemailer failed to process the request. Check your credentials." });
            }
        } catch (error) {
            console.error("Error sending consolidated mail:", error);
            toast.error("Action Failed", { description: "An unexpected error occurred building the email." });
        } finally {
            setIsSendingEmail(false)
        }
    }

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8 -ml-2">
                        <Link href="/patients">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{patient.name}</h2>
                        <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                            <Badge variant="outline" className="font-mono text-xs">{patient.id}</Badge>
                            <span className="text-sm">Patient Profile</span>
                        </div>
                    </div>
                </div>
                <Button onClick={handleNewScan} className="shrink-0 w-full sm:w-auto shadow-sm">
                    <Plus className="mr-2 h-4 w-4" /> New MRI Scan
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Demographics Card */}
                <Card className="lg:col-span-1 shadow-sm border-muted-foreground/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Demographics
                        </CardTitle>
                        <AddPatientSheet
                            onPatientAdded={() => {
                                // Refresh logic 
                                patientStore.getPatientById(patient.id).then(data => {
                                    if (data) setPatient(data)
                                })
                            }}
                            initialData={patient}
                        >
                            <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground hover:text-primary">
                                <Edit className="h-4 w-4" />
                                <span className="sr-only sm:not-sr-only">Edit</span>
                            </Button>
                        </AddPatientSheet>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" /> Age
                            </span>
                            <span className="font-medium">{patient.age} years</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <User className="h-4 w-4" /> Gender
                            </span>
                            <span className="font-medium capitalize">{patient.gender}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Mail className="h-4 w-4" /> Email
                            </span>
                            <span className="font-medium">{patient.email || "Not Provided"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Phone className="h-4 w-4" /> Phone
                            </span>
                            <span className="font-medium">{patient.phone || "Not Provided"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Dna className="h-4 w-4" /> Family History
                            </span>
                            <Badge variant={patient.familyHistory ? "destructive" : "secondary"} className={patient.familyHistory ? "bg-destructive/10 text-destructive hover:bg-destructive/20" : ""}>
                                {patient.familyHistory ? "Yes" : "No"}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Activity className="h-4 w-4" /> Total Scans
                            </span>
                            <span className="font-bold text-lg">{patient.scans.length}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Disease Progression Graph Component */}
                <Card className="lg:col-span-2 shadow-sm border-muted-foreground/20">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            Disease Progression Trend
                        </CardTitle>
                        <CardDescription>
                            Longitudinal analysis of MRI risk probabilities over time.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {chartData.length > 1 ? (
                            <div className="h-[280px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            domain={[0, 100]}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                            dx={-10}
                                            tickFormatter={(value) => `${value}%`}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent', stroke: 'hsl(var(--muted))', strokeWidth: 2, strokeDasharray: '4 4' }} />

                                        {/* Reference Lines for Risk Thresholds */}
                                        <ReferenceLine y={25} stroke="hsl(var(--chart-3))" strokeDasharray="3 3" strokeOpacity={0.5} />
                                        <ReferenceLine y={75} stroke="hsl(var(--destructive))" strokeDasharray="3 3" strokeOpacity={0.5} />

                                        {/* Gradient Line Design mapping to risk thresholds isn't native to simple Recharts without custom SVG defs, so we use a dynamic stroke or multiple lines if needed. We'll use a solid gradient. */}
                                        <defs>
                                            <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8} />
                                                <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0.8} />
                                            </linearGradient>
                                        </defs>

                                        <Line
                                            type="monotone"
                                            dataKey="probability"
                                            stroke="url(#colorRisk)"
                                            strokeWidth={4}
                                            dot={{ r: 6, strokeWidth: 2, fill: 'hsl(var(--background))' }}
                                            activeDot={{ r: 8, stroke: 'hsl(var(--primary))', strokeWidth: 3 }}
                                            animationDuration={1500}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[280px] w-full flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-xl bg-muted/20">
                                <AlertCircle className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
                                <p className="text-muted-foreground font-medium text-center px-4">
                                    Insufficient data for trend analysis.<br />
                                    <span className="text-sm font-normal">A minimum of two scans is required to plot progression.</span>
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Scan History Table */}
                <Card className="lg:col-span-3 shadow-sm border-muted-foreground/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle className="text-lg">Scan History</CardTitle>
                            <CardDescription>Comprehensive log of all MRI analyses performed on this patient.</CardDescription>
                        </div>
                        {patient.scans.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 shadow-sm text-primary hover:text-primary hover:bg-primary/5"
                                onClick={handleSendConsolidatedReport}
                                disabled={isSendingEmail}
                            >
                                {isSendingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                Email Consolidated Report
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="p-0 sm:p-6 sm:pt-0">
                        {patient.scans.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-10 text-center border-t border-border/50">
                                <p className="text-muted-foreground mb-4">No MRI scans have been recorded for this patient yet.</p>
                                <Button onClick={handleNewScan} variant="outline" size="sm">
                                    <Plus className="mr-2 h-4 w-4" /> Upload First Scan
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto border-t sm:border-none sm:rounded-md border-border/50">
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow>
                                            <TableHead className="w-[120px] pl-4 sm:pl-6">Scan ID</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Predicted Class</TableHead>
                                            <TableHead>Probability</TableHead>
                                            <TableHead>Risk Level</TableHead>
                                            <TableHead className="text-right pr-4 sm:pr-6">Report</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {patient.scans.map((scan) => (
                                            <TableRow key={scan.id} className="hover:bg-muted/50 transition-colors">
                                                <TableCell className="font-mono text-xs text-muted-foreground pl-4 sm:pl-6">
                                                    {scan.id}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {new Date(scan.date).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    {scan.predictedClass}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full ${scan.riskLevel === 'High' ? 'bg-destructive' : scan.riskLevel === 'Medium' ? 'bg-primary' : 'bg-chart-3'}`}
                                                                style={{ width: `${scan.probability}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-sm text-muted-foreground">{scan.probability}%</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={scan.riskLevel === 'High' ? 'destructive' : scan.riskLevel === 'Medium' ? 'default' : 'secondary'}
                                                        className={scan.riskLevel === 'Low' ? 'bg-chart-3 text-white hover:bg-chart-3/80' : ''}
                                                    >
                                                        {scan.riskLevel}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right pr-4 sm:pr-6">
                                                    {/* In a real app we'd pass ID to view historical result. Right now navigating back to the main result mock page. */}
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link href={`/result?scanId=${scan.id}&patientId=${patient.id}`}>
                                                            View
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
