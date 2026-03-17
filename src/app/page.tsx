"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useAppContext } from "@/lib/auth-context"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Activity, Lock, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [email, setEmail] = useState("doctor@neurodetect.ai")
  const [password, setPassword] = useState("password123")
  const [error, setError] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const router = useRouter()

  const { user, loading } = useAppContext()

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoggingIn(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      // Router redirect is handled by useEffect or auth context listening to user state changes
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to sign in. Please check your credentials.")
      setIsLoggingIn(false)
    }
  }

  // Wait until loading is done so we don't flash the login page
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Activity className="h-8 w-8 animate-pulse text-primary" />
      </div>
    )
  }

  if (user) {
    return null // Will redirect shortly
  }

  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.16))] flex-col sm:flex-row bg-muted/20">
      {/* Left side hero branding */}
      <div className="hidden flex-1 sm:flex flex-col justify-center px-12 lg:px-24 bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-r border-primary/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] bg-[length:32px_32px]" />
        <div className="relative z-10 max-w-lg space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Activity className="h-4 w-4" />
            <span>Secure Access Portal</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            NeuroDetect <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">AI Platform</span>
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed">
            Sign in to access advanced deep learning tools for rapid, accurate, and non-invasive Alzheimer&apos;s Disease screening from MRI scans.
          </p>

          <div className="space-y-4 pt-8 border-t border-border/50">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Lock className="w-5 h-5 text-primary/60" />
              <span>HIPAA Compliant Data Handling</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Brain className="w-5 h-5 text-primary/60" />
              <span>Real-Time Convolutional Neural Network Analysis</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side login form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <Card className="w-full max-w-md shadow-2xl border-primary/20 bg-background/60 backdrop-blur-xl">
          <form onSubmit={handleLogin}>
            <CardHeader className="space-y-4 pb-6">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <div className="text-center">
                <CardTitle className="text-2xl font-bold tracking-tight">Welcome Back</CardTitle>
                <CardDescription className="text-base mt-2">
                  Login to access your operator dashboard
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              {error && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@neurodetect.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pb-8 pt-4">
              <Button
                type="submit"
                className="w-full h-11 text-base shadow-md transition-all hover:shadow-lg"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? "Authenticating..." : "Sign In"}
              </Button>

              <p className="text-sm text-center text-muted-foreground mt-4">
                By signing in, you agree to our <a href="#" className="underline underline-offset-4 hover:text-primary">Terms of Service</a> and <a href="#" className="underline underline-offset-4 hover:text-primary">Privacy Policy</a>.
              </p>

              <div className="text-center text-xs text-muted-foreground mt-2 px-4 py-2 bg-muted/50 rounded-md">
                <p className="font-semibold text-foreground/70 mb-1">Demo Credentials:</p>
                <p>Email: doctor@neurodetect.ai</p>
                <p>Password: password123</p>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
