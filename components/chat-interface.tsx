"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send, Bot, User, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

interface ChatInterfaceProps {
  userId: string
}

export default function ChatInterface({ userId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    createChatSession()
  }, [])

  const createChatSession = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: userId,
          title: "New Legal Chat",
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      setSessionId(data.id)
    } catch (error) {
      console.error("Error creating chat session:", error)
    }
  }

  const saveMessage = async (content: string, role: "user" | "assistant") => {
    if (!sessionId) return
    try {
      await supabase.from("chat_messages").insert({
        session_id: sessionId,
        content,
        role,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error saving message:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    await saveMessage(userMessage.content, "user")
    setInput("")
    setIsLoading(true)

    try {
      // Wait for Puter.js to be available
      let puter = (window as any).puter
      let attempts = 0
      const maxAttempts = 10

      while (!puter?.ai && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500))
        puter = (window as any).puter
        attempts++
      }

      if (!puter?.ai) {
        throw new Error("Puter.js not loaded after multiple attempts. Please refresh the page.")
      }

      console.log("Puter.js loaded successfully:", puter)

      const prompt = `You are Nyaya.ai, an expert AI legal assistant specializing in Indian law. 
      Provide accurate, simple, empathetic legal information (not advice). 
      Current user question: ${userMessage.content}
      
      Please provide a helpful response about Indian law.`

      console.log("Sending prompt to Puter.js:", prompt)

      const reply = await puter.ai.chat(prompt)
      
      console.log("Puter.js response:", reply)

      // Handle different response formats
      let responseText = ""
      if (reply && reply.message && reply.message.content) {
        responseText = reply.message.content
      } else if (reply && reply.output_text) {
        responseText = reply.output_text
      } else if (reply && typeof reply === 'string') {
        responseText = reply
      } else if (reply && reply.choices && reply.choices[0] && reply.choices[0].message) {
        responseText = reply.choices[0].message.content
      } else {
        console.error("Unexpected response format:", reply)
        throw new Error("Unexpected response format from Puter.js")
      }

      if (!responseText || responseText.trim() === "") {
        throw new Error("Empty response from Puter.js")
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: responseText,
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      await saveMessage(responseText, "assistant")
    } catch (error) {
      console.error("Error in chat:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or refresh the page.`,
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="h-[600px] flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Nyaya.ai Legal Assistant</h3>
            <p className="text-sm text-gray-600">Ask me anything about Indian law</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Start a conversation about Indian law</p>
            <p className="text-sm">I can help with legal questions, document review, and more</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === "user"
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.role === "assistant" && (
                  <Bot className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                {message.role === "user" && (
                  <User className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-green-500" />
                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Indian law, legal procedures, or rights..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </Card>
  )
}

