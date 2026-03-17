"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { auth, db } from "@/lib/firebase"
import { User as FirebaseUser, onAuthStateChanged, signOut } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { useRouter, usePathname } from "next/navigation"

interface UserProfile {
    name: string
    designation: string
    contact: string
}

interface AppSettings {
    facilityName: string
    aiServiceUrl: string
    supportEmail?: string
    supportEmailPassword?: string
}

interface AppContextType {
    user: FirebaseUser | null
    profile: UserProfile | null
    settings: AppSettings
    loading: boolean
    logout: () => Promise<void>
    updateProfile: (profile: UserProfile) => Promise<void>
    updateSettings: (settings: AppSettings) => Promise<void>
}

const defaultSettings: AppSettings = {
    facilityName: "NeuroDetect Primary Care",
    aiServiceUrl: "http://localhost:8000",
    supportEmail: "",
    supportEmailPassword: ""
}

const AppContext = createContext<AppContextType>({} as AppContextType)

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<FirebaseUser | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [settings, setSettings] = useState<AppSettings>(defaultSettings)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser)

                try {
                    // Load Profile
                    const profileRef = doc(db, "users", firebaseUser.uid)
                    const profileSnap = await getDoc(profileRef)
                    if (profileSnap.exists()) {
                        setProfile(profileSnap.data() as UserProfile)
                    } else {
                        const defaultProfile = {
                            name: firebaseUser.email || "Doctor",
                            designation: "Neurologist",
                            contact: "N/A"
                        }
                        await setDoc(profileRef, defaultProfile)
                        setProfile(defaultProfile)
                    }

                    // Load Settings
                    const settingsRef = doc(db, "settings", firebaseUser.uid)
                    const settingsSnap = await getDoc(settingsRef)
                    if (settingsSnap.exists()) {
                        setSettings(settingsSnap.data() as AppSettings)
                    } else {
                        await setDoc(settingsRef, defaultSettings)
                        setSettings(defaultSettings)
                    }
                } catch (e) {
                    console.error("Error loading user data:", e)
                }
            } else {
                setUser(null)
                setProfile(null)
                setSettings(defaultSettings)
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    // Basic Route Protection
    useEffect(() => {
        if (!loading) {
            if (!user && pathname !== "/" && pathname !== "/login") {
                router.push("/")
            }
        }
    }, [user, loading, pathname, router])

    const logout = async () => {
        await signOut(auth)
        router.push("/")
    }

    const updateProfile = async (newProfile: UserProfile) => {
        if (!user) return
        const docRef = doc(db, "users", user.uid)
        await setDoc(docRef, newProfile, { merge: true })
        setProfile(newProfile)
    }

    const updateSettings = async (newSettings: AppSettings) => {
        if (!user) return
        const docRef = doc(db, "settings", user.uid)
        await setDoc(docRef, newSettings, { merge: true })
        setSettings(newSettings)
    }

    return (
        <AppContext.Provider value={{ user, profile, settings, loading, logout, updateProfile, updateSettings }}>
            {children}
        </AppContext.Provider>
    )
}

export const useAppContext = () => useContext(AppContext)
