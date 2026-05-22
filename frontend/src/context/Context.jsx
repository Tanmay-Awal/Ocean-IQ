import { createContext, useState, useRef } from "react";
export const Context = createContext();

const ContextProvider = (props) => {

    const [input, setInput] = useState("");
    const [recentPrompt, setRecentPrompt] = useState("");
    const [prevPrompts, setPrevPrompts] = useState([]);
    const [showResult, setShowResult] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resultData, setResultData] = useState("");
    const [conversationHistory, setConversationHistory] = useState([]);
    const [chats, setChats] = useState([]);
    const [currentChatIndex, setCurrentChatIndex] = useState(null);
    const [isStopped, setIsStopped] = useState(false);
    const [isThinkingMode, setIsThinkingMode] = useState(false);
    
    const [currentChatIsFull, setCurrentChatIsFull] = useState(false);
    const memoryLimit = 10;
    
    const abortControllerRef = useRef(null);
    const timeoutRefs = useRef([]);

    const delayPara = (index, nextWord) => {
        const timeoutId = setTimeout(function () {
            if (!isStopped) {
                setResultData(prev => prev + nextWord);
            }
        }, 75 * index);
        timeoutRefs.current.push(timeoutId);
    };

    const stopGeneration = () => {
        setIsStopped(true);
        setLoading(false);
        timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
        timeoutRefs.current = [];
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        
        if (resultData.trim()) {
            const newMessage = { question: recentPrompt, answer: resultData };
            setConversationHistory(prev => [...prev, newMessage]);
            setChats(prevChats => {
                let nextChats = [...prevChats];
                const updatedChat = { ...nextChats[currentChatIndex] };
                updatedChat.messages = [...updatedChat.messages, newMessage];
                nextChats[currentChatIndex] = updatedChat;
                return nextChats;
            });
        }
        setResultData("");
        setIsStopped(false);
        setInput(recentPrompt);
    };

    const newChat = () => {
        setLoading(false);
        setShowResult(false);
        setConversationHistory([]);
        setRecentPrompt("");
        setResultData("");
        setCurrentChatIndex(null);
        setCurrentChatIsFull(false); 
        setIsThinkingMode(false);
    };

    const toggleThinkingMode = () => {
        setIsThinkingMode(!isThinkingMode);
    };

    const updateChatMemory = (chatIndex, question, answer) => {
        setChats(prevChats => {
            const newChats = [...prevChats];
            const chatToUpdate = newChats[chatIndex];
            
            const chatMemory = chatToUpdate.memory || [];
            const newMemory = [...chatMemory, { question, answer }];
            
            chatToUpdate.memory = newMemory;
            
            if (newMemory.length >= memoryLimit) {
                chatToUpdate.isMemoryFull = true;
                setCurrentChatIsFull(true);
            }
            
            return newChats;
        });
    };

    const openChat = (index) => {
        if (index < 0 || index >= chats.length) return;
        
        setCurrentChatIndex(index);
        setConversationHistory(chats[index].messages);
        setShowResult(true);
        setLoading(false);
        setRecentPrompt("");
        setResultData("");
        
        setCurrentChatIsFull(chats[index].isMemoryFull || false);
    };

    const onSent = async (prompt) => {
        if (currentChatIsFull) {
            return;
        }

        setResultData("");
        setLoading(true);
        setShowResult(true);
        setIsStopped(false);
        timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
        timeoutRefs.current = [];

        const userQuery = prompt !== undefined ? prompt : input;
        setRecentPrompt(userQuery);

        try {
            abortControllerRef.current = new AbortController();
            
            const currentChatMemory = currentChatIndex !== null && chats[currentChatIndex].memory ? chats[currentChatIndex].memory : [];
            
            const requestBody = {
                query: userQuery,
                isThinkingMode: isThinkingMode,
                chatMemory: currentChatMemory,
            };
            
            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // --- NEW LOGIC: Handle graph response or text response ---
            const botResponse = data.message || null;
            const graphPath = data.graph_path || null;

            if (graphPath) {
                const newMessage = { question: userQuery, graph_path: graphPath };
                setConversationHistory(prev => [...prev, newMessage]);
                setChats(prevChats => {
                    let nextChats = [...prevChats];
                    if (currentChatIndex === null) {
                        const newChat = {
                            title: userQuery.substring(0, 20),
                            messages: [newMessage],
                            memory: [], // Graphs are not stored in memory for thinking mode
                            isMemoryFull: false
                        };
                        nextChats.push(newChat);
                        setPrevPrompts(p => [...p, userQuery.substring(0, 20)]);
                        setCurrentChatIndex(nextChats.length - 1);
                    } else {
                        const updatedChat = { ...nextChats[currentChatIndex] };
                        updatedChat.messages = [...updatedChat.messages, newMessage];
                        nextChats[currentChatIndex] = updatedChat;
                    }
                    return nextChats;
                });
                setLoading(false);
                setResultData("");
                setInput("");
            } else {
                // Existing logic for text response
                const newResponseArray = botResponse.split(" ");
                for (let i = 0; i < newResponseArray.length; i++) {
                    const nextWord = newResponseArray[i];
                    delayPara(i, nextWord + " ");
                }
    
                const totalDurationMs = 75 * newResponseArray.length + 100;
                const finalizeTimeout = setTimeout(() => {
                    if (!isStopped) {
                        const newMessage = { question: userQuery, answer: botResponse };
                        setConversationHistory(prev => [...prev, newMessage]);
                        
                        setChats(prevChats => {
                            let nextChats = [...prevChats];
                            if (currentChatIndex === null) {
                                const newChat = {
                                    title: userQuery.substring(0, 20),
                                    messages: [newMessage],
                                    memory: [{ question: userQuery, answer: botResponse }],
                                    isMemoryFull: false
                                };
                                nextChats.push(newChat);
                                setPrevPrompts(p => [...p, userQuery.substring(0, 20)]);
                                setCurrentChatIndex(nextChats.length - 1);
                                
                                if (newChat.memory.length >= memoryLimit) {
                                    newChat.isMemoryFull = true;
                                    setCurrentChatIsFull(true);
                                }
                            } else {
                                const updatedChat = { ...nextChats[currentChatIndex] };
                                updatedChat.messages = [...updatedChat.messages, newMessage];
                                updatedChat.memory = [...(updatedChat.memory || []), { question: userQuery, answer: botResponse }];
                                
                                if (updatedChat.memory.length >= memoryLimit) {
                                    updatedChat.isMemoryFull = true;
                                    setCurrentChatIsFull(true);
                                }
                                
                                nextChats[currentChatIndex] = updatedChat;
                            }
                            return nextChats;
                        });
                        
                        setLoading(false);
                        setResultData("");
                        setInput("");
                    }
                }, totalDurationMs);
                timeoutRefs.current.push(finalizeTimeout);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Request was aborted');
            } else {
                console.error("Failed to fetch from Python backend:", error);
                const userMessage = { question: userQuery, answer: "Sorry, I'm having trouble connecting to my backend." };
                setConversationHistory(prev => [...prev, userMessage]);
                setLoading(false);
                setResultData("");
                setInput("");
            }
        }
    };

    const contextValue = {
        prevPrompts,
        setPrevPrompts,
        onSent,
        setRecentPrompt,
        recentPrompt,
        showResult,
        loading,
        resultData,
        input,
        setInput,
        newChat,
        conversationHistory,
        chats,
        currentChatIndex,
        openChat,
        stopGeneration,
        isStopped,
        isThinkingMode,
        toggleThinkingMode,
        currentChatIsFull,
        memoryLimit
    };

    return (
        <Context.Provider value={contextValue}>
            {props.children}
        </Context.Provider>
    );
};

export default ContextProvider;