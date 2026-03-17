"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FileText, Search, Activity, AlertCircle, Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    ReferenceLine
} from "recharts"

import { Patient, Scan } from "@/types"
import { patientStore } from "@/services/patient.service"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default function ReportsPage() {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [patients, setPatients] = useState<Patient[]>([])
    const [selectedPatientId, setSelectedPatientId] = useState<string>("")
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

    useEffect(() => {
        // Load all mock patients
        const fetchPts = async () => {
            const pts = await patientStore.getPatients()
            setPatients(pts)
        }
        fetchPts()
    }, [])

    useEffect(() => {
        const fetchPatient = async () => {
            if (selectedPatientId) {
                const pt = await patientStore.getPatientById(selectedPatientId)
                setSelectedPatient(pt || null)
            } else {
                setSelectedPatient(null)
            }
        }
        fetchPatient()
    }, [selectedPatientId])

    // Prepare chart data - sort chronological
    const chartData = selectedPatient
        ? [...selectedPatient.scans].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(scan => ({
            date: new Date(scan.date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
            probability: scan.probability,
            riskLevel: scan.riskLevel,
            fullDate: new Date(scan.date).toLocaleDateString()
        }))
        : [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-card border border-border p-3 rounded-lg shadow-xl text-sm leading-tight text-card-foreground">
                    <p className="font-semibold mb-1">{data.fullDate}</p>
                    <p>Risk Level: <span className={
                        data.riskLevel === 'High' ? 'text-destructive font-bold' :
                            data.riskLevel === 'Medium' ? 'text-primary font-bold' : 
                                data.riskLevel === 'Low' ? 'text-muted-foreground font-bold' : 'text-chart-3 font-bold'
                    }>{data.riskLevel}</span></p>
                    <p>Probability: <span className="font-semibold">{data.probability}%</span></p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Diagnostic Reports</h2>
                    <p className="text-muted-foreground mt-1">Select a patient to view their historical MRI scan analyses and progression.</p>
                </div>
            </div>

            <Card className="shadow-sm border-muted-foreground/20 bg-muted/10">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Search className="h-5 w-5 text-primary" />
                        Patient Selection
                    </CardTitle>
                    <CardDescription>Choose a patient from the registry to load their specific report data.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="max-w-md">
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open}
                                    className="w-full justify-between bg-background text-left font-normal"
                                >
                                    {selectedPatientId
                                        ? (() => {
                                            const pt = patients.find((p) => p.id === selectedPatientId);
                                            return pt ? `${pt.name} (${pt.id})` : "Select a patient...";
                                        })()
                                        : "Select a patient..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                <Command>
                                    <CommandInput placeholder="Search patient name or ID..." />
                                    <CommandList>
                                        <CommandEmpty>No patients found.</CommandEmpty>
                                        <CommandGroup>
                                            {patients.map((pt) => (
                                                <CommandItem
                                                    key={pt.id}
                                                    value={`${pt.name} ${pt.id}`}
                                                    onSelect={() => {
                                                        setSelectedPatientId(pt.id === selectedPatientId ? "" : pt.id)
                                                        setOpen(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedPatientId === pt.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    <span className="font-medium">{pt.name}</span>
                                                    <span className="text-muted-foreground ml-1">({pt.id})</span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardContent>
            </Card>

            {selectedPatient ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-300">
                    <Card className="lg:col-span-2 shadow-sm border-muted-foreground/20">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-primary" />
                                    Disease Progression Trend
                                </CardTitle>
                                <CardDescription>
                                    Longitudinal AI risk probabilities over time for {selectedPatient.name}.
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {chartData.length > 1 ? (
                                <div className="h-[300px] w-full mt-4">
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
                                            <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'transparent', stroke: 'hsl(var(--muted))', strokeWidth: 2, strokeDasharray: '4 4' }} />

                                            <ReferenceLine y={25} stroke="hsl(var(--chart-3))" strokeDasharray="3 3" strokeOpacity={0.5} />
                                            <ReferenceLine y={75} stroke="hsl(var(--destructive))" strokeDasharray="3 3" strokeOpacity={0.5} />

                                            <defs>
                                                <linearGradient id="colorRiskReport" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8} />
                                                    <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0.8} />
                                                </linearGradient>
                                            </defs>

                                            <Line
                                                type="monotone"
                                                dataKey="probability"
                                                stroke="url(#colorRiskReport)"
                                                strokeWidth={4}
                                                dot={{ r: 6, strokeWidth: 2, fill: 'hsl(var(--background))' }}
                                                activeDot={{ r: 8, stroke: 'hsl(var(--primary))', strokeWidth: 3 }}
                                                animationDuration={1500}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-[280px] w-full flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-xl bg-background/50">
                                    <AlertCircle className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
                                    <p className="text-muted-foreground font-medium text-center px-4">
                                        Insufficient data to plot a trend.<br />
                                        <span className="text-sm font-normal">At least two scans are required to show progression.</span>
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2 shadow-sm border-muted-foreground/20">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Patient Scan Repository
                            </CardTitle>
                            <CardDescription>Select any historical scan below to view the full detailed AI predictive report.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 sm:p-6 sm:pt-0">
                            {selectedPatient.scans.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-10 text-center border-t border-border/50">
                                    <p className="text-muted-foreground mb-4">No MRI scans have been recorded for this patient.</p>
                                    <Button onClick={() => router.push(`/screening?patientId=${selectedPatient.id}`)} variant="outline" size="sm">
                                        Upload First Scan
                                    </Button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto border-t sm:border-none sm:rounded-md border-border/50">
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow>
                                                <TableHead className="w-[120px] pl-4 sm:pl-6">Scan ID</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Condition</TableHead>
                                                <TableHead>AI Probability</TableHead>
                                                <TableHead>Severity</TableHead>
                                                <TableHead className="text-right pr-4 sm:pr-6">Full Report</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedPatient.scans.map((scan) => (
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
                                                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden shrink-0">
                                                                <div
                                                                    className={`h-full ${scan.riskLevel === 'High' ? 'bg-destructive' : scan.riskLevel === 'Medium' ? 'bg-primary' : 'bg-chart-3'}`}
                                                                    style={{ width: `${scan.probability}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-sm font-medium">{scan.probability}%</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={scan.riskLevel === 'High' ? 'destructive' : scan.riskLevel === 'Medium' ? 'default' : 'secondary'}
                                                            className={scan.riskLevel === 'Low' ? 'bg-chart-3 text-white' : ''}
                                                        >
                                                            {scan.riskLevel}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-4 sm:pr-6">
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <Link href={`/result?scanId=${scan.id}&patientId=${selectedPatient.id}`}>
                                                                View Report
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
            ) : (
                <div className="flex flex-col items-center justify-center p-16 text-center h-[40vh] border-2 border-dashed border-muted rounded-xl bg-muted/10">
                    <div className="rounded-full bg-primary/10 p-4 mb-4">
                        <FileText className="h-10 w-10 text-primary opacity-80" />
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight">Select a Patient</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
                        From the dropdown above, select any registered patient to view their comprehensive reporting and longitudinal data.
                    </p>
                </div>
            )}
        </div>
    )
}
