import React, { useContext, useState } from "react";
import './Sidebar.css'
import {assets} from "../../assets/assets";
import { Context } from "../../context/Context";

function Sidebar(){
    const { prevPrompts, newChat, openChat } = useContext(Context)
    const [isOpen, setIsOpen] = useState(false);

    return(
        <>
            {/* Toggle Button */}
            <button className="sidebar-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? '✕' : '☰'}
            </button>

            {/* Sidebar Drawer */}
            <div className={`brutalist-sidebar ${isOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <h2>SESSION CHATS</h2>
                    <p>TEMPORARY STORAGE</p>
                </div>
                
                <div className="top">
                    <div onClick={() => { newChat(); setIsOpen(false); }} className="new-chat-btn">
                        <span className="plus">+</span> NEW CHAT
                    </div>
                    
                    <div className="recent">
                        <p className="recent-title">RECENT EXPLORATIONS</p>
                        {prevPrompts.length > 0 ? (
                            prevPrompts.map((item, index) => {
                                return(
                                    <div key={index} onClick={() => { openChat(index); setIsOpen(false); }} className="recent-entry">
                                        <div className="entry-indicator"></div>
                                        <p>{item.slice(0, 18)}...</p>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="no-recent-chats">
                                <p>NO ACTIVE SESSIONS</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="sidebar-footer">
                    <p>DATABASE DISCONNECTED.<br/>CHATS WILL NOT BE SAVED.</p>
                </div>
            </div>
            
            {/* Overlay for mobile/closing */}
            {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)}></div>}
        </>
    )
}

export default Sidebar;
