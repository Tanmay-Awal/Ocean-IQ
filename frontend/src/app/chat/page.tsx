"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Lightbulb, Plus, ArrowRight, User, Square } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import dynamic from "next/dynamic"
import { Sidebar } from "@/components/layout/Sidebar"
import { chatStore } from "@/lib/chatStore"

const PlotlyChart = dynamic(() => import("@/components/PlotlyChart"), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-[#0f172a] h-[420px] w-full rounded-xl flex items-center justify-center text-slate-500">Loading interactive chart...</div>
})

// Types
type Message = {
  id: number
  role: "user" | "assistant"
  content: string
  imagePath?: string
  graphJson?: any
}

function ChatContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams?.get("query")
  const chatId = searchParams?.get("chatId")

  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isThinkingMode, setIsThinkingMode] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentChatIdRef = useRef<string>(Date.now().toString())
  const hasInitialized = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (chatId) {
      const existing = chatStore.getChat(chatId)
      if (existing) {
        currentChatIdRef.current = chatId
        setMessages(existing.messages)
        return
      }
    }

    // Setup for new chat
    if (!chatId) {
      currentChatIdRef.current = Date.now().toString()
      setMessages([])
    }
  }, [chatId])

  useEffect(() => {
    if (initialQuery && !chatId && messages.length === 0 && !isGenerating) {
      const timer = setTimeout(() => {
        handleSend(initialQuery)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [initialQuery, chatId, messages.length, isGenerating])

  useEffect(() => {
    if (messages.length > 0) {
      chatStore.saveChat({
        id: currentChatIdRef.current,
        title: messages[0].content.slice(0, 35) + (messages[0].content.length > 35 ? "..." : ""),
        messages,
        updatedAt: Date.now()
      })
    }
  }, [messages])

  useEffect(() => {
    // Auto scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  const handleSend = async (text: string) => {
    if (!text.trim()) return

    const newMsg: Message = { id: Date.now(), role: "user", content: text }
    setMessages(prev => [...prev, newMsg])
    setInputValue("")
    setIsTyping(true)
    setIsGenerating(true)

    try {
      // Build chatMemory expected by backend: [{"question": "...", "answer": "..."}]
      const chatMemory = []
      let lastQuestion = ""
      for (const msg of messages) {
        if (msg.role === "user") {
          lastQuestion = msg.content
        } else if (msg.role === "assistant" && lastQuestion) {
          chatMemory.push({ question: lastQuestion, answer: msg.content })
          lastQuestion = ""
        }
      }

      const abortController = new AbortController()
      abortControllerRef.current = abortController

      const response = await fetch("http://localhost:5000/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortController.signal,
        body: JSON.stringify({
          query: text,
          isThinkingMode: isThinkingMode,
          chatMemory
        })
      })

      if (!response.body) throw new Error("ReadableStream not supported")

      const reader = response.body.getReader()
      const decoder = new TextDecoder("utf-8")
      let aiContent = ""
      let graphUrl = ""
      let graphJsonData: any = null

      const assistantId = Date.now()
      setMessages(prev => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", imagePath: "", graphJson: null }
      ])

      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() || ""

        for (const event of events) {
          if (event.startsWith('event: metadata')) {
            const dataLine = event.split('\n').find(line => line.startsWith('data: '))
            if (dataLine) {
              const meta = JSON.parse(dataLine.replace('data: ', ''))
              if (meta.graph_path) {
                graphUrl = `http://localhost:5000${meta.graph_path}`
              }
              if (meta.graph_json) {
                graphJsonData = meta.graph_json
              }
            }
            setIsTyping(false) // First chunks arriving
          } else if (event.startsWith('event: text')) {
            const dataLine = event.split('\n').find(line => line.startsWith('data: '))
            if (dataLine) {
              const textChunk = JSON.parse(dataLine.replace('data: ', ''))
              aiContent += textChunk

              setMessages(prev => prev.map(msg =>
                msg.id === assistantId ? { ...msg, content: aiContent } : msg
              ))

              // Artificial delay to make the AI type slower and more naturally
              await new Promise(resolve => setTimeout(resolve, 30))
            }
          } else if (event.startsWith('event: done')) {
            break
          }
        }
      }

      // Stream finished! Now finally attach the image and graph so they pop up at the end.
      setMessages(prev => prev.map(msg =>
        msg.id === assistantId ? { ...msg, content: aiContent, imagePath: graphUrl, graphJson: graphJsonData } : msg
      ))

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Stream aborted by user')
      } else {
        console.error(error)
        setMessages(prev => [
          ...prev,
          { id: Date.now(), role: "assistant", content: "Sorry, I could not connect to the backend server." }
        ])
      }
    } finally {
      setIsTyping(false)
      setIsGenerating(false)
      abortControllerRef.current = null
    }
  }

  const handleNewChat = () => {
    currentChatIdRef.current = Date.now().toString()
    setMessages([])
    hasInitialized.current = false
    router.replace('/chat')
  }

  const suggestions = [
    "Show me the average temperature in the Northern Arabian Sea",
    "Plot a depth profile for float 2902217",
    "Calculate the Mixed Layer Depth for WMO 2902210",
    "Compare salinity between WMO 2902210 and 2902217"
  ]

  return (
    <div className="flex flex-col h-full bg-[#0a0f16] text-white font-sans overflow-hidden relative">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#1e2b38]/50 bg-[#0a0f16]/80 backdrop-blur-md z-10">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-[#0d1620] border border-[#1e2b38] flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.15)] cursor-pointer" onClick={() => router.push('/dashboard')}>
            <Lightbulb className="w-5 h-5 text-[#06b6d4]" />
          </div>
          <div className="flex flex-col cursor-pointer" onClick={() => router.push('/dashboard')}>
            <h1 className="text-[15px] font-bold tracking-tight text-white leading-tight">Aqua Research Assistant</h1>
            <p className="text-[11px] text-slate-500 font-medium">OceanIQ • ARGO float intelligence</p>
          </div>
        </div>
        <button
          onClick={handleNewChat}
          className="flex items-center space-x-2 text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-[#131b24] transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto relative flex flex-col items-center">

        {messages.length === 0 ? (
          // Empty State
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-3xl px-6 pb-20">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight text-center animate-fade-in-up">
              What would you like to <span className="text-[#06b6d4]">explore</span>?
            </h2>
            <p className="text-sm text-slate-400 mb-12 text-center max-w-md animate-fade-in-up delay-100">
              Ask about ocean temperature, salinity profiles, float trajectories, mixed layer depth, or request visualizations.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {suggestions.map((query, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSend(query)}
                  className={`bg-[#111822] border border-[#1e2b38] hover:border-[#2d3d50] hover:bg-[#161f2b] transition-all p-5 rounded-xl cursor-pointer min-h-[100px] flex-col justify-center animate-fade-in-up ${idx >= 2 ? 'hidden md:flex' : 'flex'}`}
                  style={{ animationDelay: `${(idx + 2) * 100}ms` }}
                >
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Try Asking</span>
                  <p className="text-sm text-slate-300 font-medium leading-relaxed">{query}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Chat View
          <div className="w-full max-w-4xl px-4 py-8 space-y-8 pb-32">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start w-full'}`}>
                {msg.role === 'assistant' ? (
                  // AI Message Layout
                  <div className="flex items-start w-full max-w-[95%]">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full border border-[#1e2b38] bg-[#0d1620] flex items-center justify-center mt-1 mr-4 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                      <Lightbulb className="w-4 h-4 text-[#06b6d4]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="prose prose-invert max-w-none text-slate-200 text-[15px] leading-relaxed">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            table: ({ node, ...props }) => (
                              <div className="overflow-x-auto my-6 rounded-xl border border-[#1e2b38] bg-[#111822]">
                                <table className="w-full text-sm text-left m-0" {...props} />
                              </div>
                            ),
                            thead: ({ node, ...props }) => (
                              <thead className="text-xs uppercase text-[#06b6d4] bg-[#0a0f16] border-b border-[#1e2b38]" {...props} />
                            ),
                            th: ({ node, ...props }) => (
                              <th className="px-6 py-4 font-semibold tracking-wider m-0 border-0" {...props} />
                            ),
                            td: ({ node, ...props }) => (
                              <td className="px-6 py-4 border-b border-[#1e2b38] m-0 last:border-0" {...props} />
                            ),
                            tr: ({ node, ...props }) => (
                              <tr className="border-b border-[#1e2b38] last:border-0 hover:bg-[#161f2b] transition-colors m-0" {...props} />
                            ),
                            p: ({ node, ...props }) => (
                              <p className="mb-4 last:mb-0" {...props} />
                            ),
                            strong: ({ node, ...props }) => (
                              <strong className="font-bold text-white" {...props} />
                            ),
                            a: ({ node, ...props }) => (
                              <a className="text-[#06b6d4] hover:underline" {...props} />
                            ),
                            code: ({ node, inline, ...props }: any) => (
                              inline
                                ? <code className="bg-[#1e2b38] px-1.5 py-0.5 rounded text-sm text-[#e2e8f0]" {...props} />
                                : <pre className="bg-[#0a0f16] border border-[#1e2b38] p-4 rounded-xl overflow-x-auto"><code className="text-sm text-[#e2e8f0]" {...props} /></pre>
                            )
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>

                      {/* Embedded Chart Visualization or Image */}
                      {(msg as any).graphJson ? (
                        <div className="mt-4 w-full max-w-2xl rounded-xl border border-[#1e2b38] bg-[#0a0f16] overflow-hidden">
                          <PlotlyChart data={(msg as any).graphJson} height="420px" />
                        </div>
                      ) : (msg as any).imagePath && (
                        <div className="mt-4 w-full max-w-lg rounded-xl overflow-hidden border border-[#1e2b38]">
                          <img src={(msg as any).imagePath} alt="Generated Graph" className="w-full h-auto" />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // User Message Layout
                  <div className="max-w-[80%] bg-[#1e2b38] text-slate-100 px-5 py-3.5 rounded-2xl rounded-tr-sm text-[15px] leading-relaxed shadow-md">
                    {msg.content}
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isTyping && (
              <div className="flex items-start w-full max-w-[95%] animate-pulse">
                <div className="flex-shrink-0 w-8 h-8 rounded-full border border-[#1e2b38] bg-[#0d1620] flex items-center justify-center mt-1 mr-4 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                  <Lightbulb className="w-4 h-4 text-[#06b6d4]" />
                </div>
                <div className="bg-[#111822] border border-[#1e2b38] px-4 py-3 rounded-xl flex space-x-2 items-center h-[46px]">
                  <div className="w-1.5 h-1.5 bg-[#06b6d4] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-[#06b6d4] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-[#06b6d4] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Fixed Input Area (Now inside the scroll container to ensure exact centering alignment) */}
        <div className="sticky bottom-0 left-0 right-0 w-full bg-gradient-to-t from-[#0a0f16] via-[#0a0f16] to-[#0a0f16]/0 pt-10 pb-6 px-4 flex flex-col items-center mt-auto z-20">
          <form
            onSubmit={e => { e.preventDefault(); handleSend(inputValue); }}
            className="w-full max-w-3xl relative flex items-center bg-[#111822] border border-[#1e2b38] rounded-xl overflow-hidden focus-within:border-[#2d3d50] focus-within:ring-1 focus-within:ring-[#06b6d4]/30 transition-all shadow-lg"
          >
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Enter research query (e.g. Plot salinity vs temperature for float 2902217)..."
              className="w-full h-14 pl-5 pr-40 bg-transparent border-none outline-none text-sm text-slate-200 placeholder:text-slate-600"
            />

            <div className="absolute right-2 flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsThinkingMode(!isThinkingMode)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${isThinkingMode
                    ? 'border-[#1e2b38] bg-[#0d1620] text-white'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
              >
                <Lightbulb className={`w-3 h-3 ${isThinkingMode ? 'text-[#06b6d4]' : ''}`} />
                <span>Thinking</span>
              </button>
              <button
                type={isGenerating ? "button" : "submit"}
                onClick={isGenerating ? () => abortControllerRef.current?.abort() : undefined}
                disabled={!isGenerating && !inputValue.trim()}
                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${isGenerating
                    ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300'
                    : 'bg-[#0d1620] border-[#1e2b38] text-slate-400 hover:text-white hover:bg-[#1e2b38]'
                  }`}
              >
                {isGenerating ? <Square className="w-3 h-3 fill-current" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>
          <p className="text-[10px] text-slate-600 mt-3 font-medium">
            Aqua can analyze ARGO float data, generate charts, and answer oceanographic questions.
          </p>
        </div>
      </div>

    </div>
  )
}

export default function ChatPage() {
  return (
    <div className="flex flex-col md:flex-row h-[100dvh] overflow-hidden bg-background pb-[72px] md:pb-0">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0a0f16] text-[#06b6d4]">Loading Aqua Research Assistant...</div>}>
          <ChatContent />
        </Suspense>
      </main>
    </div>
  )
}
