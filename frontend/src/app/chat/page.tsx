"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { 
  Sparkles, 
  Plus, 
  ArrowRight, 
  Square, 
  Cpu, 
  Layers, 
  Compass, 
  Copy, 
  Check, 
  Activity, 
  Droplets, 
  Radio, 
  FileText,
  RotateCcw
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import dynamic from "next/dynamic"
import { Sidebar } from "@/components/layout/Sidebar"
import { chatStore, Message } from "@/lib/chatStore"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"
import { cn } from "@/lib/utils"

const PlotlyChart = dynamic(() => import("@/components/PlotlyChart"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full rounded-2xl bg-surface-card/60 border border-border flex items-center justify-center text-slate-500 font-mono text-xs">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full border-2 border-ocean-cyan border-t-transparent animate-spin" />
        <span>Rendering interactive Plotly profile...</span>
      </div>
    </div>
  )
})

function ChatContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams?.get("query")
  const chatId = searchParams?.get("chatId")

  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isThinkingMode, setIsThinkingMode] = useState(true) // Default to scientific reasoning
  const [activeCategory, setActiveCategory] = useState("thermo")
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [streamStage, setStreamStage] = useState<string>("")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentChatIdRef = useRef<string>(Date.now().toString())
  const abortControllerRef = useRef<AbortController | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load chat by id
  useEffect(() => {
    if (chatId) {
      const existing = chatStore.getChat(chatId)
      if (existing) {
        currentChatIdRef.current = chatId
        setMessages(existing.messages)
        return
      }
    }

    // New chat initialization
    if (!chatId) {
      currentChatIdRef.current = Date.now().toString()
      setMessages([])
    }
  }, [chatId])

  // Handle auto-trigger from query param
  useEffect(() => {
    if (initialQuery && !chatId && messages.length === 0 && !isGenerating) {
      const timer = setTimeout(() => {
        handleSend(initialQuery)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [initialQuery, chatId, messages.length, isGenerating])

  // Auto persist chat
  useEffect(() => {
    if (messages.length > 0) {
      const firstUserMsg = messages.find(m => m.role === "user")
      const title = firstUserMsg ? firstUserMsg.content.slice(0, 36) + (firstUserMsg.content.length > 36 ? "..." : "") : "Ocean Analysis"
      chatStore.saveChat({
        id: currentChatIdRef.current,
        title,
        messages,
        updatedAt: Date.now()
      })
    }
  }, [messages])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping, streamStage])

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`
    }
  }, [inputValue])

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleExportMarkdown = (content: string, title: string) => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, "_") || "oceaniq_research"}.md`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleSend = async (text: string) => {
    if (!text.trim() || isGenerating) return

    const newMsg: Message = { id: Date.now(), role: "user", content: text }
    setMessages(prev => [...prev, newMsg])
    setInputValue("")
    setIsTyping(true)
    setIsGenerating(true)
    setStreamStage("Parsing query intent & spatial coordinates...")

    try {
      const chatMemory: Array<{ question: string; answer: string }> = []
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

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const response = await fetch(`${apiUrl}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortController.signal,
        body: JSON.stringify({
          query: text,
          isThinkingMode: isThinkingMode,
          chatMemory
        })
      })

      if (!response.ok) {
        let errMessage = ""
        try {
          const errJson = await response.json()
          if (errJson?.error) errMessage = errJson.error
        } catch {}
        throw new Error(errMessage || `Server responded with status ${response.status}`)
      }

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
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
                graphUrl = `${apiUrl}${meta.graph_path}`
              }
              if (meta.graph_json) {
                graphJsonData = meta.graph_json
              }
            }
            setIsTyping(false)
            setStreamStage("Synthesizing oceanographic reasoning...")
          } else if (event.startsWith('event: text')) {
            const dataLine = event.split('\n').find(line => line.startsWith('data: '))
            if (dataLine) {
              const textChunk = JSON.parse(dataLine.replace('data: ', ''))
              aiContent += textChunk

              setMessages(prev => prev.map(msg =>
                msg.id === assistantId ? { ...msg, content: aiContent } : msg
              ))
              setIsTyping(false)
              setStreamStage("")
            }
          } else if (event.startsWith('event: error')) {
            const dataLine = event.split('\n').find(line => line.startsWith('data: '))
            let errorDetail = ""
            if (dataLine) {
              try {
                errorDetail = JSON.parse(dataLine.replace('data: ', ''))
              } catch {
                errorDetail = dataLine.replace('data: ', '')
              }
            }
            aiContent = `### Analysis Notice\n\n${errorDetail || "Aqua AI was unable to complete the analysis for this dataset."}\n\n• **Tip**: Please verify that the specified float number or coordinates exist, or try rephrasing your research query.`
            setMessages(prev => prev.map(msg =>
              msg.id === assistantId ? { ...msg, content: aiContent, isError: true } : msg
            ))
            setIsTyping(false)
            setStreamStage("")
            break
          } else if (event.startsWith('event: done')) {
            setStreamStage("")
            break
          }
        }
      }

      // Final message update with graphs attached
      setMessages(prev => prev.map(msg =>
        msg.id === assistantId ? { ...msg, content: aiContent, imagePath: graphUrl, graphJson: graphJsonData } : msg
      ))

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Stream aborted by user')
      } else {
        console.error("Aqua AI Stream Error:", error)
        
        let friendlyContent = ""
        const errMsg = String(error?.message || error || "").toLowerCase()

        if (errMsg.includes("failed to fetch") || errMsg.includes("networkerror") || errMsg.includes("econnrefused") || errMsg.includes("readablestream not supported") || errMsg.includes("load failed")) {
          friendlyContent = [
            "### Ocean Telemetry Service Temporarily Unavailable",
            "",
            "Aqua AI is momentarily unable to connect to the oceanographic analysis network.",
            "",
            "• **Status**: The telemetry data stream is experiencing high demand or a temporary synchronization pause.",
            "• **Next Step**: Please wait a few seconds and click **Retry** below to re-run your query."
          ].join("\n")
        } else if (errMsg.includes("timeout") || errMsg.includes("timed out")) {
          friendlyContent = [
            "### Processing Window Exceeded",
            "",
            "The oceanographic calculation took longer than expected to complete.",
            "",
            "• **Recommendation**: Try asking for a narrower depth window or specific float (e.g. `Calculate MLD for WMO 2902217`)."
          ].join("\n")
        } else {
          friendlyContent = [
            "### Analysis Temporarily Unavailable",
            "",
            "Aqua AI was unable to complete this query at the moment.",
            "",
            "• **Recommendation**: Please click **Retry** or try rephrasing your research question."
          ].join("\n")
        }

        setMessages(prev => [
          ...prev,
          { 
            id: Date.now(), 
            role: "assistant", 
            content: friendlyContent,
            isError: true
          }
        ])
      }
    } finally {
      setIsTyping(false)
      setIsGenerating(false)
      setStreamStage("")
      abortControllerRef.current = null
    }
  }

  const handleNewChat = () => {
    currentChatIdRef.current = Date.now().toString()
    setMessages([])
    router.replace('/chat')
  }

  const promptCategories = [
    {
      id: "thermo",
      name: "Thermodynamics & MLD",
      icon: Layers,
      prompts: [
        "Calculate Mixed Layer Depth for WMO 2902217",
        "Find the Thermocline depth and gradient for float 1902677",
        "Analyze temperature stratification anomalies in the Northern Arabian Sea",
        "Explain the ΔT = 0.2°C threshold method used for ARGO profiles"
      ]
    },
    {
      id: "curves",
      name: "Depth Profiles & CTD",
      icon: Activity,
      prompts: [
        "Plot a vertical depth profile for float 2902210",
        "Plot salinity vs temperature (T-S diagram) for float 2902217",
        "Compare vertical temperature curves between float 1902677 and 2902217",
        "Generate a CTD sounding chart for equatorial floats"
      ]
    },
    {
      id: "spatial",
      name: "Geospatial & Floats",
      icon: Compass,
      prompts: [
        "Find all active ARGO floats near the Bay of Bengal",
        "Show latest float coordinates and trajectories in the Indian Ocean",
        "What is the average temperature near coordinates 15°N, 68°E?",
        "List all floats with more than 150 vertical soundings"
      ]
    },
    {
      id: "watermass",
      name: "Water Masses & Chemistry",
      icon: Droplets,
      prompts: [
        "Compare salinity between WMO 2902210 and 2902217",
        "Classify the water mass profiles in the Northern Bay of Bengal",
        "Identify high salinity Arabian Sea water parcels in recent cycles",
        "Summarize oxygen minimum zones detected in the basin"
      ]
    }
  ]

  const activeCategoryData = promptCategories.find(c => c.id === activeCategory) || promptCategories[0]

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden relative transition-colors duration-300">
      
      {/* Top Session Toolbar */}
      <header className="h-14 shrink-0 border-b border-border/50 px-6 flex items-center justify-between bg-surface-base/90 backdrop-blur-xl z-20 transition-colors duration-300">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-ocean-cyan to-ocean-blue flex items-center justify-center text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <Sparkles className="w-4 h-4 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-foreground tracking-tight">Aqua Research Assistant</h1>
              <Badge variant="cyan" className="font-mono text-[9px] py-0 px-1.5">Dual RAG Engine</Badge>
            </div>
            <p className="text-[10px] text-slate-700 dark:text-slate-400 font-mono font-medium">
              Google Gemini 2.0 &bull; Groq Llama 3.3 &bull; ChromaDB
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewChat}
            className="text-xs font-semibold text-slate-800 dark:text-slate-300 hover:text-foreground"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>New Session</span>
          </Button>

          <div className="pl-1 border-l border-border/40">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Conversation Stream */}
      <div className={cn(
        "flex-1 min-h-0 overflow-y-auto px-4 md:px-8 transition-all flex flex-col",
        messages.length === 0 ? "" : "space-y-6 py-6"
      )}>
        
        {messages.length === 0 ? (
          /* Empty State: Research Prompt Matrix with Responsive Safe Layout */
          <div className="w-full max-w-3xl mx-auto flex flex-col items-center my-auto pt-3 pb-6 sm:py-6 md:py-8 animate-fade-in-up">
            
            {/* Header Block with Responsive Proportions */}
            <div className="text-center space-y-2 sm:space-y-3 max-w-xl mx-auto mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-ocean-cyan/10 border border-ocean-cyan/30 flex items-center justify-center text-ocean-cyan mx-auto shadow-[0_0_20px_rgba(6,182,212,0.25)] mb-2.5 sm:mb-3">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 font-bold" />
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                Oceanographic Research Intelligence
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium pt-0.5 sm:pt-1 max-w-lg mx-auto">
                Pose queries in natural language. Aqua translates requests into spatial SQL, calculates thermodynamic indices, and generates dynamic Plotly depth profiles.
              </p>
            </div>

            {/* Category Filter Pills with Responsive Flow */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 mb-4 sm:mb-6 w-full">
              {promptCategories.map((cat) => {
                const Icon = cat.icon
                const isActive = activeCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border",
                      isActive 
                        ? 'bg-ocean-cyan/15 border-ocean-cyan/40 text-ocean-cyan dark:text-white shadow-[0_0_15px_rgba(6,182,212,0.15)] font-bold' 
                        : 'bg-surface-card border-border text-slate-800 dark:text-slate-300 hover:text-foreground hover:border-slate-400 dark:hover:border-slate-600 font-semibold'
                    )}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-ocean-cyan' : 'text-slate-500'}`} />
                    <span>{cat.name}</span>
                  </button>
                )
              })}
            </div>

            {/* 4 Suggested Query Cards - Responsive Heights & Balanced Gaps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4.5 w-full mb-4 sm:mb-6">
              {activeCategoryData.prompts.map((promptText, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSend(promptText)}
                  className="p-3.5 sm:p-4.5 rounded-xl sm:rounded-2xl bg-surface-card border border-border/80 hover:border-ocean-cyan/50 hover:bg-surface-elevated/70 transition-all duration-200 cursor-pointer group flex flex-col justify-between card-hover-lift shadow-sm min-h-[92px] sm:min-h-[108px]"
                >
                  <span className="text-[10px] font-mono text-ocean-cyan uppercase tracking-wider mb-1.5 flex items-center gap-1 font-bold">
                    <Radio className="w-2.5 h-2.5 text-ocean-cyan animate-pulse" /> Suggested Query
                  </span>
                  <p className="text-xs sm:text-sm text-foreground group-hover:text-ocean-cyan font-semibold leading-relaxed transition-colors line-clamp-2">
                    {promptText}
                  </p>
                  <div className="mt-2.5 pt-2 sm:mt-3.5 sm:pt-2.5 border-t border-border/30 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-ocean-cyan font-mono font-medium">
                    <span>Execute query</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>

            {/* Micro Trust Ribbon Anchoring the Empty State */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 text-[10px] sm:text-[11px] font-mono text-slate-600 dark:text-slate-400 font-medium w-full pb-2">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                ARGO Global Indian Array Live
              </span>
              <span>&bull;</span>
              <span>Gemini 2.0 Thinking Mode</span>
              <span>&bull;</span>
              <span>Spatial SQL Vector Synthesis</span>
            </div>

          </div>
        ) : (
          /* Active Chat Stream */
          <div className="max-w-3xl mx-auto space-y-6 pb-12 w-full">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start w-full"}`}
              >
                {msg.role === "user" ? (
                  /* User Prompt Card */
                  <div className="max-w-[85%] bg-surface-elevated border border-ocean-blue/30 text-foreground px-5 py-3.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed shadow-md font-medium">
                    {msg.content}
                  </div>
                ) : (
                  /* Assistant Scientific Response */
                  <div className="w-full flex items-start space-x-4">
                    <div className="w-8 h-8 rounded-xl bg-surface-elevated border border-ocean-cyan/30 flex items-center justify-center text-ocean-cyan shrink-0 mt-1 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                      <Sparkles className="w-4 h-4 font-bold" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-4">
                      {/* Markdown Body */}
                      <div className="p-6 rounded-2xl bg-surface-card border border-border/80 text-foreground text-sm leading-relaxed shadow-sm space-y-4 font-sans">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            table: ({ ...props }) => (
                              <div className="overflow-x-auto my-4 rounded-xl border border-border/80 bg-surface-base">
                                <table className="w-full text-xs font-mono text-left" {...props} />
                              </div>
                            ),
                            thead: ({ ...props }) => (
                              <thead className="bg-surface-elevated/80 border-b border-border/80 text-ocean-cyan uppercase font-bold" {...props} />
                            ),
                            th: ({ ...props }) => (
                              <th className="px-4 py-3 font-bold tracking-wider font-sans" {...props} />
                            ),
                            td: ({ ...props }) => (
                              <td className="px-4 py-3 border-b border-border/30 text-slate-900 dark:text-slate-300 font-medium" {...props} />
                            ),
                            tr: ({ ...props }) => (
                              <tr className="hover:bg-surface-hover/40 transition-colors" {...props} />
                            ),
                            p: ({ ...props }) => (
                              <p className="mb-3 last:mb-0 leading-relaxed font-normal" {...props} />
                            ),
                            h1: ({ ...props }) => (
                              <h1 className="text-xl font-bold text-foreground mb-3 mt-4" {...props} />
                            ),
                            h2: ({ ...props }) => (
                              <h2 className="text-lg font-bold text-foreground mb-2 mt-4" {...props} />
                            ),
                            h3: ({ ...props }) => (
                              <h3 className="text-base font-semibold text-ocean-cyan mb-2 mt-3" {...props} />
                            ),
                            strong: ({ ...props }) => (
                              <strong className="font-bold text-foreground" {...props} />
                            ),
                            code: ({ node, inline, ...props }: any) => (
                              inline
                                ? <code className="bg-surface-elevated px-1.5 py-0.5 rounded text-xs font-mono text-ocean-cyan border border-border/50 font-bold" {...props} />
                                : <pre className="bg-surface-base p-4 rounded-xl border border-border/60 overflow-x-auto text-xs font-mono text-slate-900 dark:text-slate-300 my-3"><code {...props} /></pre>
                            )
                          }}
                        >
                          {msg.content || (isGenerating ? "Analyzing ocean telemetry..." : "")}
                        </ReactMarkdown>

                        {/* Interactive Plotly Chart Attachment */}
                        {msg.graphJson && (
                          <div className="mt-4 w-full rounded-xl overflow-hidden border border-border">
                            <PlotlyChart data={msg.graphJson} title="Telemetry Depth Profile" />
                          </div>
                        )}

                        {/* Static Matplotlib Image Attachment */}
                        {msg.imagePath && !msg.graphJson && (
                          <div className="mt-4 rounded-xl overflow-hidden border border-border bg-surface-base p-2">
                            <img src={msg.imagePath} alt="Generated Physical Ocean Profile" className="w-full h-auto rounded-lg" />
                          </div>
                        )}
                      </div>

                      {/* Message Action Bar */}
                      <div className="flex items-center justify-between px-2 text-xs font-mono text-slate-500">
                        <div className="flex items-center gap-2">
                          {msg.isError ? (
                            <>
                              <Badge variant="standby" className="text-[9px] py-0 bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold">
                                Telemetry Pause
                              </Badge>
                              <span className="text-slate-500">Connection Interrupted</span>
                            </>
                          ) : (
                            <>
                              <Badge variant="cyan" className="text-[9px] py-0">Synthesis Complete</Badge>
                              <span>ARGO Verified</span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {msg.isError && (
                            <>
                              <button
                                onClick={() => {
                                  const idx = messages.findIndex(m => m.id === msg.id)
                                  const prevUser = idx > 0 ? messages[idx - 1] : null
                                  if (prevUser && prevUser.role === "user") {
                                    handleSend(prevUser.content)
                                  } else {
                                    handleSend(inputValue || "Calculate Mixed Layer Depth for WMO 2902217")
                                  }
                                }}
                                className="flex items-center gap-1 text-ocean-cyan hover:text-ocean-cyan/80 transition-colors p-1 cursor-pointer font-semibold"
                                title="Retry query"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Retry</span>
                              </button>
                              <span>&bull;</span>
                            </>
                          )}
                          <button
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="flex items-center gap-1 hover:text-foreground transition-colors p-1 cursor-pointer"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-500">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                          <span>&bull;</span>
                          <button
                            onClick={() => handleExportMarkdown(msg.content, "Aqua_Research_Note")}
                            className="flex items-center gap-1 hover:text-foreground transition-colors p-1 cursor-pointer"
                            title="Export as Markdown"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Export MD</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Intelligence Pipeline Stepper during Generation */}
            {isGenerating && streamStage && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-surface-card border border-ocean-cyan/30 text-xs font-mono text-ocean-cyan animate-pulse shadow-sm">
                <div className="w-4 h-4 border-2 border-ocean-cyan border-t-transparent rounded-full animate-spin shrink-0" />
                <span>{streamStage}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

      </div>

      {/* Persistent Research Input Bar */}
      <div className="shrink-0 border-t border-border/50 bg-surface-base/95 backdrop-blur-xl px-4 py-2.5 sm:py-3 md:px-6 md:py-3.5 z-20 transition-colors duration-300">
        <div className="max-w-3xl mx-auto space-y-1.5 sm:space-y-2">
          
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend(inputValue)
            }}
            className="relative flex items-end bg-surface-card border border-border rounded-2xl p-2 focus-within:border-ocean-cyan/60 focus-within:ring-2 focus-within:ring-ocean-cyan/20 transition-all shadow-md"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend(inputValue)
                }
              }}
              placeholder="Ask Aqua about temperature anomalies, MLD, float trajectories, or plot graphs (e.g. 'Plot CTD profile for WMO 2902217')..."
              className="flex-1 max-h-44 p-3 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-slate-400 resize-none font-sans leading-relaxed"
            />

            <div className="flex items-center gap-2 pb-1 pr-1">
              {/* Thinking Mode Toggle */}
              <button
                type="button"
                onClick={() => setIsThinkingMode(!isThinkingMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-medium transition-all cursor-pointer ${
                  isThinkingMode
                    ? 'bg-ocean-cyan/15 border-ocean-cyan/40 text-ocean-cyan font-semibold'
                    : 'bg-surface-elevated border-border text-slate-500 hover:text-foreground'
                }`}
                title="Deep Gemini 2.0 scientific reasoning chain"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Thinking</span>
              </button>

              {/* Submit or Abort Button */}
              {isGenerating ? (
                <button
                  type="button"
                  onClick={() => abortControllerRef.current?.abort()}
                  className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 text-red-500 hover:bg-red-500/25 flex items-center justify-center transition-colors cursor-pointer"
                  title="Stop generation"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="w-9 h-9 rounded-xl bg-gradient-to-r from-ocean-cyan to-ocean-blue text-slate-950 font-bold flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer active:scale-95"
                  title="Send query"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>

          <div className="flex items-center justify-between px-2 text-[11px] font-mono text-slate-500">
            <span>Press Enter to send &bull; Shift+Enter for new line</span>
            <span className="hidden sm:inline">ARGO Indian Ocean Telemetry &bull; Hybrid RAG SQL</span>
          </div>

        </div>
      </div>

    </div>
  )
}

export default function ChatPage() {
  return (
    <div className="flex flex-col md:flex-row h-[100dvh] overflow-hidden bg-background pb-[72px] md:pb-0 transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 h-full min-h-0 min-w-0 overflow-hidden">
        <Suspense fallback={
          <div className="flex h-screen items-center justify-center bg-background text-ocean-cyan font-mono text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-ocean-cyan border-t-transparent animate-spin" />
              <span>Initializing Aqua Research Assistant...</span>
            </div>
          </div>
        }>
          <ChatContent />
        </Suspense>
      </main>
    </div>
  )
}
