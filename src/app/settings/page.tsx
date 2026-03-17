"use client"

import React, { useState } from "react"
import { Save, BellRing, Lock, User, Building2, Paintbrush } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useAppContext } from "@/lib/auth-context"

export default function SettingsPage() {
    const { profile, settings, updateSettings, updateProfile } = useAppContext()
    const [isSaving, setIsSaving] = useState(false)

    // Local state for form fields
    const [localFacilityName, setLocalFacilityName] = useState("")
    const [localSupportEmail, setLocalSupportEmail] = useState("")
    const [localSupportEmailPassword, setLocalSupportEmailPassword] = useState("")
    const [localName, setLocalName] = useState("")
    const [localSpecialty, setLocalSpecialty] = useState("")
    const [localAiServiceUrl, setLocalAiServiceUrl] = useState("")

    // Initialize local state when context loads
    React.useEffect(() => {
        if (settings) {
            setLocalFacilityName(settings.facilityName)
            setLocalAiServiceUrl(settings.aiServiceUrl)
            setLocalSupportEmail(settings.supportEmail || "")
            setLocalSupportEmailPassword(settings.supportEmailPassword || "")
        }
        if (profile) {
            setLocalName(profile.name)
            setLocalSpecialty(profile.designation)
        }
    }, [settings, profile])


    const handleSave = async () => {
        setIsSaving(true)
        try {
            // Save Settings context to Firestore
            if (settings) {
                await updateSettings({
                    ...settings,
                    facilityName: localFacilityName,
                    aiServiceUrl: localAiServiceUrl,
                    supportEmail: localSupportEmail,
                    supportEmailPassword: localSupportEmailPassword
                })
            }

            // Save Profile context to Firestore
            if (profile) {
                await updateProfile({
                    ...profile,
                    name: localName,
                    designation: localSpecialty
                })
            }

            toast.success("Settings saved", {
                description: "Your system preferences have been securely updated in Firestore."
            })
        } catch (error) {
            console.error("Failed to save settings:", error)
            toast.error("Action Failed", {
                description: "There was a problem saving your preferences. Please try again."
            })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6 pb-10 max-w-5xl mx-auto animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-primary">Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your hospital workspace preferences and account settings.
                </p>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="integration">Integration</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="mt-6 space-y-6">
                    <Card className="shadow-sm border-muted-foreground/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-primary" />
                                Workspace Profile
                            </CardTitle>
                            <CardDescription>
                                Update the hospital or clinic details used in PDF reports.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="hospital-name">Facility Name</Label>
                                <Input
                                    id="hospital-name"
                                    value={localFacilityName}
                                    onChange={(e) => setLocalFacilityName(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="contact-email">Support Email (Sender)</Label>
                                <Input
                                    id="contact-email"
                                    value={localSupportEmail}
                                    onChange={(e) => setLocalSupportEmail(e.target.value)}
                                    placeholder="neurology@neurodetect.ai"
                                    type="email"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email-password">Support Email Password (App Password)</Label>
                                <Input
                                    id="email-password"
                                    value={localSupportEmailPassword}
                                    onChange={(e) => setLocalSupportEmailPassword(e.target.value)}
                                    placeholder="Enter App Password for SMTP"
                                    type="password"
                                />
                                <p className="text-[10px] text-muted-foreground mt-0.5">Note: If using Gmail, you must generate a 16-character App Password. Do not use your primary account password.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-muted-foreground/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                Personal Information
                            </CardTitle>
                            <CardDescription>
                                Manage your primary operator account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="operator-name">Full Name</Label>
                                <Input
                                    id="operator-name"
                                    value={localName}
                                    onChange={(e) => setLocalName(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="specialty">Specialty / Title</Label>
                                <Input
                                    id="specialty"
                                    value={localSpecialty}
                                    onChange={(e) => setLocalSpecialty(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? "Saving..." : "Save General Settings"}
                        </Button>
                    </div>
                </TabsContent>

                <TabsContent value="integration" className="mt-6 space-y-6">
                    <Card className="shadow-sm border-primary/20 bg-primary/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Paintbrush className="h-5 w-5 text-primary" />
                                AI Service Integration
                            </CardTitle>
                            <CardDescription>
                                Configure the connection to the Python Convolutional Neural Network.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="ai-url">Service Endpoint URL</Label>
                                <Input
                                    id="ai-url"
                                    value={localAiServiceUrl}
                                    className="bg-background"
                                    onChange={(e) => setLocalAiServiceUrl(e.target.value)}
                                    placeholder="http://localhost:8000"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    The fully qualified root URL for the MRI Prediction Service API.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? "Saving..." : "Save Integration Settings"}
                        </Button>
                    </div>
                </TabsContent>

            </Tabs>
        </div >
    )
}
