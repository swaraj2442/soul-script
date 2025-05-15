'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, MessageSquare, Shield } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

const useCases = [
  "Extract key insights from lengthy documents in seconds",
  "Get instant answers to complex questions about your documents",
  "Summarize multiple documents with AI-powered analysis",
  "Find specific information across your entire document library",
  "Generate detailed reports from your document collections",
  "Translate and analyze documents in multiple languages",
  "Identify patterns and trends across your documents",
  "Create searchable knowledge bases from your documents"
];

export default function Home() {
  const { data: session } = useSession();
  const [currentUseCase, setCurrentUseCase] = useState(0);

  useEffect(() => {
    if (session) {
      const interval = setInterval(() => {
        setCurrentUseCase((prev) => (prev + 1) % useCases.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [session]);

  return (
    <div className="min-h-[calc(100vh-64px)] w-full flex flex-col">
      {/* Hero Section */}
      <section className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="flex flex-col items-center space-y-6 text-center">
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                Unlock insights from your documents with AI
              </h1>
              <p className="mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed">
                Upload documents, ask questions, and get instant answers powered by AI.
                Soul Script analyzes your content to provide accurate, contextual responses.
              </p>
            </div>
            {session && (
              <div className="w-full max-w-3xl mt-8">
                <div className="relative h-16 overflow-hidden">
                  {useCases.map((useCase, index) => (
                    <div
                      key={useCase}
                      className={`absolute w-full transition-all duration-500 ease-in-out ${
                        index === currentUseCase
                          ? 'translate-y-0 opacity-100'
                          : 'translate-y-full opacity-0'
                      }`}
                    >
                      <p className="text-lg md:text-xl font-medium text-primary/80">
                        {useCase}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto gap-2 text-base">
                  Get Started <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              {!session && (
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
      <section className="w-full py-16 md:py-24 lg:py-32 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="flex flex-col items-center justify-center space-y-8">
            <div className="space-y-4 text-center max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Key Features
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Our powerful AI chatbot helps you extract insights from your documents.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
              <div className="flex flex-col items-center space-y-4 border rounded-xl p-8 bg-card shadow-sm transition-all hover:shadow-md hover:scale-[1.02]">
                <div className="p-3 bg-primary/10 rounded-full">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Document Processing</h3>
                <p className="text-muted-foreground text-center text-lg">
                  Upload PDFs, TXT, and DOCX files. Our system processes and indexes your documents for quick retrieval.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 border rounded-xl p-8 bg-card shadow-sm transition-all hover:shadow-md hover:scale-[1.02]">
                <div className="p-3 bg-primary/10 rounded-full">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">AI-Powered Q&A</h3>
                <p className="text-muted-foreground text-center text-lg">
                  Ask questions in natural language about your documents and get accurate, contextual answers.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 border rounded-xl p-8 bg-card shadow-sm transition-all hover:shadow-md hover:scale-[1.02]">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Secure & Private</h3>
                <p className="text-muted-foreground text-center text-lg">
                  Your documents and data are secured with enterprise-grade encryption and authentication.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}