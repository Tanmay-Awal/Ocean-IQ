import { useState, useContext, useEffect, useRef } from "react";
import './Main.css';
import { assets } from '../../../assets/assets';
import chatBg from '../../../assets/172148-846731250_small.mp4';
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
    const [showSidebar, setShowSidebar] = useState(false);
    const resultRef = useRef(null);
    const bottomRef = useRef(null);

    const handleSend = () => {
        setIsPromptSent(true); 
        onSent();
        setInput('');
        setTimeout(() => {
            const searchBox = document.querySelector('.search-box');
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
        setShowSidebar(false);
    };

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [conversationHistory.length, loading, resultData, showResult, isPromptSent]);

    return (
        <div className="main">
            <video
                className="main-bg-video"
                src={chatBg}
                autoPlay
                loop
                muted
                playsInline
            />
            <div className="nav">
                <img src={flowchatLogo} alt="FlowChat" className="brand-logo" />
            </div>
            <div className="main-container">
                {showResult ? (
                    <div className="result" ref={resultRef}>
                        {conversationHistory.map((chat, index) => (
                            <div key={index}>
                                <div className="user-message">
                                    <p>{chat.question}</p>
                                </div>
                                <div className="ai-response">
                                    {/* --- NEW LOGIC: Check for image or text response --- */}
                                    {chat.graph_path ? (
                                        <img src={`http://localhost:5000/${chat.graph_path}`} alt="Generated Graph" className="generated-graph" />
                                    ) : (
                                        <p dangerouslySetInnerHTML={{ __html: chat.answer }}></p>
                                    )}
                                </div>
                            </div>
                        ))}
                        
                        {loading && (
                            <div>
                                <div className="user-message">
                                    <p>{recentPrompt}</p>
                                </div>
                                <div className="ai-response">
                                    {resultData ? (
                                        <p dangerouslySetInnerHTML={{ __html: resultData }}></p>
                                    ) : (
                                        <div className="loader">
                                            <div className="loader-dot"></div>
                                            <div className="loader-dot"></div>
                                            <div className="loader-dot"></div>
                                            <div className="loader-dot"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>
                ) : (
                    <div className="greet">
                        <p><span>Hello</span></p>
                        <p className="greet-subtitle">Ask The Ocean Anything</p>
                    </div>
                )}
            </div>
            <div className={`main-bottom ${isPromptSent ? 'slide-down' : ''}`}>
                <div className="search-box">
                    <img 
                        src={assets.plus_icon} 
                        alt="" 
                        className="plus-icon"
                        onClick={() => setShowSidebar(!showSidebar)}
                    />
                    
                    {showSidebar && (
                        <div className="small-sidebar show">
                            <a href="http://localhost:8501" target="_blank" rel="noopener noreferrer">
                                <div className="sidebar-option">
                                    <span className="sidebar-option-text">Streamlit</span>
                                </div>
                            </a>
                            <div className="sidebar-option" onClick={handleThinkingClick}>
                                <span className="sidebar-option-text">Thinking Mode</span>
                            </div>
                        </div>
                    )}
                    
                    {isThinkingMode && (
                        <div className="thinking-mode-tag">
                            Thinking Mode
                            <span className="cut-icon" onClick={toggleThinkingMode}>x</span>
                        </div>
                    )}

                    <input
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        value={input}
                        type="text"
                        placeholder={
                            isThinkingMode ? '' :
                            currentChatIsFull ? 'Memory full - Start new chat' : 
                            loading ? 'AI is responding...' : 
                            'Enter A Prompt Here'
                        }
                        disabled={loading || currentChatIsFull}
                    />
                    
                    <div className="input-controls">
                        {loading ? (
                            <div className="stop-button" onClick={stopGeneration}>
                                <div className="stop-icon"></div>
                            </div>
                        ) : currentChatIsFull ? (
                            <button className="new-chat-button" onClick={newChat}>
                                New Chat
                            </button>
                        ) : (
                            input ? <img onClick={handleSend} src={assets.send_icon} alt="" /> : null
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Main;