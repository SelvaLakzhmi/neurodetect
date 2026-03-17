"use client"

import { MobileNav } from "./sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { Bell, CircleUser, LogOut, Settings as SettingsIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAppContext } from "@/lib/auth-context"
import Link from "next/link"

export function Navbar() {
    const { profile, settings, logout } = useAppContext()

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 lg:h-[60px] shrink-0">
            <MobileNav />
            <div className="hidden sm:flex items-center text-sm font-medium text-muted-foreground mr-auto bg-muted/50 px-3 py-1.5 rounded-full border shadow-sm whitespace-nowrap">
                <span className="px-1">{settings?.facilityName || "NeuroDetect Primary Care"}</span>
            </div>
            <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4 justify-end">
                {/* <Button variant="outline" size="icon" className="rounded-full shadow-sm ml-auto sm:ml-0">
                    <Bell className="h-4 w-4" />
                    <span className="sr-only">Toggle notifications</span>
                </Button> */}
                <ModeToggle />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="rounded-full border border-border shadow-sm">
                            <CircleUser className="h-5 w-5" />
                            <span className="sr-only">Toggle user menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="font-normal flex flex-col space-y-1">
                            <span className="text-sm font-medium leading-none">{profile?.name || "Operator Account"}</span>
                            <span className="text-xs leading-none text-muted-foreground">
                                {profile?.designation || "Medical Staff"}
                            </span>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/settings" className="cursor-pointer">
                                <SettingsIcon className="mr-2 h-4 w-4" />
                                <span>Preferences</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
