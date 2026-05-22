import React, { useContext, useState } from "react";
import './Sidebar.css'
import {assets} from "../../assets/assets";
import { Context } from "../../context/Context";
function Sidebar(){

    const { prevPrompts, newChat, openChat } = useContext(Context)


    return(
        <div className="sidebar">
            <div className="top">
                <div onClick={ () =>newChat() }className="new-chat">
                    <img className="new-chat-plus-icon" src={assets.plus_icon} alt="" />
                    <p>New Chat.</p>
                </div>
                <div className="recent">
                <p className="recent-title">  Recent</p>
                {prevPrompts.length > 0 ? (
                    prevPrompts.map((item,index)=>{
                        return(
                            <div onClick={()=>openChat(index)} className="recent-entry">
                                <img src={assets.message_icon} alt="" />
                                <p>{item.slice(0,18)}...</p>
                            </div>
                        )
                    })
                ) : (
                    <div className="no-recent-chats">
                        <p>No recent chats</p>
                    </div>
                )}
                
            </div>
            </div>
        </div>
    )
}

export default Sidebar

