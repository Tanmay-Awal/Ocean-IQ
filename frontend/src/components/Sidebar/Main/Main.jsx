import { useState, useContext, useEffect, useRef } from "react";
import './Main.css';
import { assets } from '../../../assets/assets';
import { Context } from '../../../context/Context';
import flowchatLogo from '../../../assets/floatchat.png';

function Main() {
    const { 
        onSent, 
        input, 
        setInput, 
        recentPrompt, 
        showResult, 
        loading, 
        resultData, 
        conversationHistory, 
        stopGeneration, 
        isThinkingMode, 
        toggleThinkingMode, 
        newChat,
        currentChatIsFull
    } = useContext(Context);
    
    const [isPromptSent, setIsPromptSent] = useState(false);
    const resultRef = useRef(null);
    const bottomRef = useRef(null);

    const handleSend = () => {
        setIsPromptSent(true); 
        onSent();
        setInput('');
        setTimeout(() => {
            const searchBox = document.querySelector('.search-container');
            if (searchBox) {
                searchBox.classList.add('expanded');
            }
        }, 100);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && input.trim()) {
            handleSend();
        }
    };

    const handleThinkingClick = () => {
        toggleThinkingMode();
    };

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [conversationHistory.length, loading, resultData, showResult, isPromptSent]);

    return (
        <div className="main">
            {/* Top Navigation Pill */}
            <div className="top-nav-wrapper">
                <div className="nav-left">
                    <img src={flowchatLogo} alt="FlowChat" className="brand-logo" />
                </div>
                
                <div className="pill-nav">
                    <div className="pill-nav-item active" onClick={() => window.location.href='/'}>
                        <span>Home</span>
                    </div>
                </div>

                <div className="nav-right">
                    <button className="btn-secondary" onClick={newChat}>New Chat</button>
                    <button className="btn-primary" onClick={handleThinkingClick}>
                        {isThinkingMode ? "Thinking: ON" : "Thinking: OFF"}
                    </button>
                </div>
            </div>

            <div className={`main-content ${showResult ? 'chat-active' : ''}`}>
                
                {!showResult && (
                    <div className="hero-section">
                        <div className="geo-pill">
                            <span className="geo-icon">🌊</span> Now exploring global ocean data
                        </div>
                        <h1 className="super-title">
                            Dive in. Ask it.<br/>
                            <span className="text-gradient">Explore the Ocean.</span>
                        </h1>
                        <p className="super-subtitle">
                            The AI-powered oceanographic platform built for researchers and enthusiasts. 
                            Explore ARGO floats, climate impact, and marine life instantly.
                        </p>
                    </div>
                )}

                {showResult && (
                    <div className="result-container" ref={resultRef}>
                        {conversationHistory.map((chat, index) => (
                            <div key={index} className="chat-thread">
                                <div className="user-message-wrapper">
                                    <div className="user-message">
                                        <p>{chat.question}</p>
                                    </div>
                                </div>
                                <div className="ai-response-wrapper">
                                    <div className="ai-avatar">
                                        <img src={assets.gemini_icon} alt="AI" />
                                    </div>
                                    <div className="ai-response">
                                        {chat.graph_path ? (
                                            <img src={`http://localhost:5000/${chat.graph_path}`} alt="Generated Graph" className="generated-graph" />
                                        ) : (
                                            <p dangerouslySetInnerHTML={{ __html: chat.answer }}></p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {loading && (
                            <div className="chat-thread">
                                <div className="user-message-wrapper">
                                    <div className="user-message">
                                        <p>{recentPrompt}</p>
                                    </div>
                                </div>
                                <div className="ai-response-wrapper">
                                    <div className="ai-avatar">
                                        <img src={assets.gemini_icon} alt="AI" />
                                    </div>
                                    <div className="ai-response">
                                        {resultData ? (
                                            <p dangerouslySetInnerHTML={{ __html: resultData }}></p>
                                        ) : (
                                            <div className="wave-loader">
                                                <span></span><span></span><span></span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} className="scroll-anchor" />
                    </div>
                )}

                {/* Centered Search Bar */}
                <div className={`search-container ${showResult ? 'docked' : ''}`}>
                    <div className="search-box">
                        <div className="search-box-left">
                            <img 
                                src={assets.plus_icon} 
                                alt="Add" 
                                className="action-icon"
                            />
                        </div>
                        
                        <input
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            value={input}
                            type="text"
                            placeholder={
                                currentChatIsFull ? 'Memory full - Start new chat' : 
                                loading ? 'Aqua is formulating an answer...' : 
                                'Describe what you want to explore...'
                            }
                            disabled={loading || currentChatIsFull}
                        />
                        
                        <div className="search-box-right">
                            {loading ? (
                                <button className="submit-btn stop-btn" onClick={stopGeneration}>
                                    <div className="stop-square"></div>
                                </button>
                            ) : (
                                <button 
                                    className={`submit-btn ${input ? 'active' : ''}`} 
                                    onClick={handleSend}
                                    disabled={!input || currentChatIsFull}
                                >
                                    ↑
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {!showResult && (
                        <div className="prompt-suggestion">
                            <span className="dot"></span>
                            "Show me the salinity profile of floats near the Great Barrier Reef..."
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Main;