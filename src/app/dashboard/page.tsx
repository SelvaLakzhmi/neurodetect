"use client"

import React, { useState, useEffect } from "react"
import { Activity, Users, AlertCircle, FileCheck2, TrendingUp, Loader2 } from "lucide-react"
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

import { Patient, Scan } from "@/types"
import { patientStore } from "@/services/patient.service"

export default function DashboardPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [stats, setStats] = useState({
        totalScreenings: 0,
        highRisk: 0,
        mediumRisk: 0,
        lowRisk: 0
    })
    const [recentScans, setRecentScans] = useState<any[]>([])
    const [trendData, setTrendData] = useState<any[]>([])

    useEffect(() => {
        const fetchDashboardData = async () => {
            const patients = await patientStore.getPatients()

            let total = 0
            let high = 0
            let medium = 0
            let low = 0

            const allScans: any[] = []

            patients.forEach(p => {
                p.scans.forEach(s => {
                    total++
                    if (s.riskLevel === 'High') high++
                    if (s.riskLevel === 'Medium') medium++
                    if (s.riskLevel === 'Low') low++

                    allScans.push({
                        id: p.id,
                        name: p.name,
                        age: p.age,
                        date: s.date,
                        risk: s.riskLevel === 'Medium' ? 'Medium' : s.riskLevel,
                        score: s.probability
                    })
                })
            })

            setStats({
                totalScreenings: total,
                highRisk: high,
                mediumRisk: medium,
                lowRisk: low
            })

            // Sort all scans by date descending (newest first)
            allScans.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            setRecentScans(allScans.slice(0, 5))

            // Build trend data for the last 6 months
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            const trendMap = new Map<string, { scans: number, highRisk: number }>()

            // initialize last 6 months
            const today = new Date()
            const orderedMonths: string[] = []
            for (let i = 5; i >= 0; i--) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
                const monthName = months[d.getMonth()]
                trendMap.set(monthName, { scans: 0, highRisk: 0 })
                orderedMonths.push(monthName)
            }

            allScans.forEach(scan => {
                const d = new Date(scan.date)
                // only count if it's within the map
                // we'll just check if map has the month. Technically could collide years if > 12 month old data, 
                // but this is fine for basic dashboard trend.
                const monthName = months[d.getMonth()]
                // To be exact, check if it's within last 6 months
                const monthsDiff = (today.getFullYear() - d.getFullYear()) * 12 + today.getMonth() - d.getMonth()
                if (monthsDiff >= 0 && monthsDiff <= 5) {
                    const data = trendMap.get(monthName)!
                    data.scans++
                    if (scan.risk === 'High') data.highRisk++
                }
            })

            const finalTrendData = orderedMonths.map(name => {
                const data = trendMap.get(name)!
                return {
                    name,
                    scans: data.scans,
                    highRisk: data.highRisk
                }
            })

            setTrendData(finalTrendData)
            setIsLoading(false)
        }
        fetchDashboardData()
    }, [])

    if (isLoading) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-muted-foreground animate-pulse">Aggregating live hospital statistics...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-10 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-primary">Overview</h1>
                <p className="text-muted-foreground mt-1">
                    Hospital-wide statistics on Alzheimer&apos;s MRI screenings.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm border-muted-foreground/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Total Screenings</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalScreenings}</div>
                        <p className="text-xs text-muted-foreground mt-1 text-emerald-500 font-medium">
                            Live system data
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-destructive/20 bg-destructive/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-destructive">High Risk Cases</CardTitle>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{stats.highRisk}</div>
                        <p className="text-xs text-muted-foreground mt-1 text-destructive font-medium">
                            {stats.totalScreenings > 0 ? ((stats.highRisk / stats.totalScreenings) * 100) : 0}% of total
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-chart-4/20 bg-chart-4/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-chart-4">Medium Risk Cases</CardTitle>
                        <Users className="h-4 w-4 text-chart-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-chart-4">{stats.mediumRisk}</div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-chart-3/20 bg-chart-3/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-chart-3">Low Risk Cases</CardTitle>
                        <FileCheck2 className="h-4 w-4 text-chart-3" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-chart-3">{stats.lowRisk}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="md:col-span-4 shadow-sm border-muted-foreground/20">
                    <CardHeader>
                        <CardTitle>Screening Volume Trend</CardTitle>
                        <CardDescription>Monthly MRI scans analyzed by the model (Last 6 Months).</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                    />
                                    <Line type="monotone" dataKey="scans" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="highRisk" stroke="hsl(var(--destructive))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-3 shadow-sm border-muted-foreground/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Recent Diagnostic Reports
                        </CardTitle>
                        <CardDescription>Latest risk assessments from the CNN model.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentScans.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                No scans available in the database.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50 border-none hover:bg-muted/50">
                                            <TableHead>Patient</TableHead>
                                            <TableHead>Risk</TableHead>
                                            <TableHead className="text-right">Score</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentScans.map((scan, i) => (
                                            <TableRow key={`${scan.id}-${i}`} className="border-b-muted/20">
                                                <TableCell>
                                                    <div className="font-medium text-sm">{scan.name}</div>
                                                    <div className="text-xs text-muted-foreground">{scan.id}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={scan.risk === "High" ? "destructive" : scan.risk === "Medium" ? "outline" : "secondary"}
                                                        className={cn(
                                                            "text-[10px] uppercase font-bold tracking-wider",
                                                            scan.risk === "Medium" && "border-chart-4 text-chart-4 bg-chart-4/10",
                                                            scan.risk === "Low" && "bg-chart-3/20 text-chart-3 hover:bg-chart-3/30"
                                                        )}
                                                    >
                                                        {scan.risk}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {scan.score}%
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
