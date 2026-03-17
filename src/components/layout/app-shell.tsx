"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "./sidebar"
import { Navbar } from "./navbar"
import { useAppContext } from "@/lib/auth-context"

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const { user, loading } = useAppContext()

    // Render plain children for login/landing pages
    if (pathname === "/" || pathname === "/login") {
        return <>{children}</>
    }

    // Default layout for authenticated routes (dashboard, patients, etc)
    return (
        <div className="flex min-h-screen w-full flex-col md:flex-row bg-muted/20">
            <Sidebar />
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-4 transition-all w-full flex-1">
                <Navbar />
                <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
