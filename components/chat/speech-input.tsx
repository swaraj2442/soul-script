"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'

interface SpeechInputProps {
  onTranscript: (text: string) => void
  disabled?: boolean
}

export function SpeechInput({ onTranscript, disabled }: SpeechInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [isInitializing, setIsInitializing] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [recognition, setRecognition] = useState<any>(null)

  useEffect(() => {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false)
      toast.error('Speech recognition is not supported in your browser')
    }
  }, [])

  useEffect(() => {
    // Cleanup recognition on unmount
    return () => {
      if (recognition) {
        recognition.stop()
      }
    }
  }, [recognition])

  const startListening = () => {
    if (!isSupported || disabled) return

    setIsInitializing(true)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const newRecognition = new SpeechRecognition()

    newRecognition.continuous = true
    newRecognition.interimResults = true
    newRecognition.lang = 'en-US'

    newRecognition.onstart = () => {
      setIsListening(true)
      setIsInitializing(false)
      toast.success('Listening...')
    }

    newRecognition.onresult = (event: any) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      if (finalTranscript) {
        onTranscript(finalTranscript)
        setInterimText('')
      } else {
        setInterimText(interimTranscript)
      }
    }

    newRecognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
      setIsInitializing(false)
      setInterimText('')
      
      if (event.error === 'no-speech') {
        toast.error('No speech detected. Please try again.')
      } else if (event.error === 'audio-capture') {
        toast.error('No microphone detected. Please check your microphone settings.')
      } else if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please allow microphone access.')
      } else {
        toast.error('Speech recognition error. Please try again.')
      }
    }

    newRecognition.onend = () => {
      setIsListening(false)
      setIsInitializing(false)
      setInterimText('')
    }

    try {
      newRecognition.start()
      setRecognition(newRecognition)
    } catch (error) {
      console.error('Error starting speech recognition:', error)
      setIsInitializing(false)
      toast.error('Failed to start speech recognition')
    }
  }

  const stopListening = () => {
    if (!isSupported || disabled) return
    if (recognition) {
      recognition.stop()
    }
    setIsListening(false)
    setIsInitializing(false)
    setInterimText('')
    toast.success('Stopped listening')
  }

  if (!isSupported) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`h-11 w-11 ${isListening ? 'text-red-500' : ''}`}
              onClick={isListening ? stopListening : startListening}
              disabled={disabled || isInitializing}
            >
              {isInitializing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isListening ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
              <span className="sr-only">
                {isListening ? 'Stop listening' : 'Start listening'}
              </span>
            </Button>
            {isListening && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-background border rounded-lg shadow-lg text-sm">
                {interimText || 'Listening...'}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isListening ? 'Click to stop listening' : 'Click to start voice input'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 