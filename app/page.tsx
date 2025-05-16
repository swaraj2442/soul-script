"use client";

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, FileText, MessageSquare, Sparkles, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { GradientAnimation } from '@/components/ui/gradient-animation'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (data.user) {
          setUser(data.user)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setIsLoading(false)
      }
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="flex flex-col min-h-screen relative">
      <GradientAnimation
        colors={["#FF6B6B", "#4ECDC4", "#45B7D1"]}
        duration={20}
        blur={80}
        opacity={0.2}
      />
      
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="flex flex-col items-center justify-center space-y-6 text-center">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                Soul Script
              </h1>
              <p className="mx-auto max-w-[700px] text-lg md:text-xl text-muted-foreground">
                Upload your documents and ask questions about their content using AI
              </p>
            </div>
            <div className="space-y-4 max-w-2xl">
              <p className="text-lg md:text-xl text-muted-foreground">
                Soul Script analyzes your content to provide accurate, contextual responses.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto gap-2 text-base px-8">
                  Get Started <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              {isLoading ? (
                <div className="h-12 w-32 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : !user && (
                <Link href="/auth/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-base">
                    Log In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-16 md:py-24 lg:py-32 bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="flex flex-col items-center justify-center space-y-12">
            <div className="space-y-4 text-center max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Key Features
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Our powerful AI chatbot helps you extract insights from your documents.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
              <div className="flex flex-col items-center space-y-4 p-8 bg-card/50 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all">
                <div className="p-3 bg-primary/10 rounded-full">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Document Upload</h3>
                <p className="text-center text-muted-foreground">
                  Upload your documents in various formats for AI analysis
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 p-8 bg-card/50 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all">
                <div className="p-3 bg-primary/10 rounded-full">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Smart Q&A</h3>
                <p className="text-center text-muted-foreground">
                  Ask questions about your documents and get instant answers
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 p-8 bg-card/50 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">AI-Powered</h3>
                <p className="text-center text-muted-foreground">
                  Advanced AI technology for accurate and contextual responses
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}