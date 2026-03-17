"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Search, Plus, User, Activity, Clock, Trash2, Edit } from "lucide-react"
import { toast } from "sonner"
import { Patient } from "@/types"
import { patientStore } from "@/services/patient.service"
import { AddPatientSheet } from "@/components/patients/add-patient-sheet"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function PatientsPage() {
    const [patients, setPatients] = useState<Patient[]>([])
    const [searchQuery, setSearchQuery] = useState("")

    const refreshPatients = useCallback(async () => {
        setPatients(await patientStore.getPatients())
    }, []);

    const handleDeletePatient = async (id: string) => {
        try {
            await patientStore.deletePatient(id)
            refreshPatients()
            toast.success("Patient deleted", {
                description: "The patient and all associated scan data has been permanently removed."
            })
        } catch (error) {
            console.error("Failed to delete patient", error)
            toast.error("Action Failed", {
                description: "There was a problem deleting this patient record."
            })
        }
    }

    useEffect(() => {
        refreshPatients()
    }, [refreshPatients])

    const filteredPatients = patients.filter(patient =>
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.id.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getLatestScanDetails = (patient: Patient) => {
        if (!patient.scans || patient.scans.length === 0) return null;
        // Scans are stored newest first in our mock implementation
        return patient.scans[0];
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
                <h2 className="text-3xl font-bold tracking-tight">Patients</h2>
                <div className="flex items-center space-x-2">
                    <AddPatientSheet onPatientAdded={refreshPatients}>
                        <Button className="hidden sm:flex">
                            <Plus className="mr-2 h-4 w-4" /> Add Patient
                        </Button>
                    </AddPatientSheet>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3 border-b border-border/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Patient Directory</CardTitle>
                            <CardDescription>Manage and view screening history for all registered patients.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search by name or ID..."
                                    className="pl-8 bg-muted/50 w-full"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            {/* Mobile only add button */}
                            <AddPatientSheet onPatientAdded={refreshPatients}>
                                <Button size="icon" className="shrink-0 sm:hidden">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </AddPatientSheet>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredPatients.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <div className="rounded-full bg-muted/50 p-4 mb-4">
                                <User className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold tracking-tight">No patients found</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                                {searchQuery
                                    ? `Could not find any patients matching "${searchQuery}". Please try adjusting your search terms.`
                                    : "There are currently no patients registered in the system."}
                            </p>
                            {!searchQuery && (
                                <AddPatientSheet onPatientAdded={refreshPatients}>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" /> Add First Patient
                                    </Button>
                                </AddPatientSheet>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow>
                                        <TableHead className="w-[100px] pl-6">ID</TableHead>
                                        <TableHead>Patient Details</TableHead>
                                        <TableHead>Total Scans</TableHead>
                                        <TableHead>Latest Risk</TableHead>
                                        <TableHead className="hidden md:table-cell">Last Scan</TableHead>
                                        <TableHead className="text-right pr-6">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPatients.map((patient) => {
                                        const latestScan = getLatestScanDetails(patient);
                                        return (
                                            <TableRow key={patient.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                                                <TableCell className="font-medium pl-6 text-muted-foreground">
                                                    {patient.id}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium shrink-0">
                                                            {patient.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{patient.name}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {patient.age} yrs • {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Activity className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium">{patient.scans?.length || 0}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {latestScan ? (
                                                        <Badge
                                                            variant={latestScan.riskLevel === 'High' ? 'destructive' : latestScan.riskLevel === 'Medium' ? 'default' : 'secondary'}
                                                            className={latestScan.riskLevel === 'Low' ? 'bg-chart-3 text-white' : ''}
                                                        >
                                                            {latestScan.riskLevel}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-muted-foreground">No scans</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell text-muted-foreground">
                                                    {latestScan ? (
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-4 w-4 opacity-70" />
                                                            <span className="text-sm">{new Date(latestScan.date).toLocaleDateString()}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm italic opacity-50">N/A</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <Link href={`/patients/${patient.id}`}>
                                                                Manage
                                                            </Link>
                                                        </Button>
                                                        <AddPatientSheet onPatientAdded={refreshPatients} initialData={patient}>
                                                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" onClick={(e) => e.stopPropagation()}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </AddPatientSheet>
                                                        <div onClick={(e) => e.stopPropagation()}>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            This action cannot be undone. This will permanently delete the profile for <strong>{patient.name}</strong> and remove all associated MRI scan data from our servers.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDeletePatient(patient.id)} className="bg-destructive hover:bg-destructive/90">
                                                                            Delete Patient
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
