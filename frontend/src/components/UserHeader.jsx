import React from "react";
import videoSrc5 from "../assets/39393-422737370_small.mp4";
import pic1 from "../assets/1.jpg";
import pic2 from "../assets/2.jpg";
import pic3 from "../assets/3.jpg";
import flowchatLogo from "../assets/floatchat.png";
import "./UserHeader.css";
import { useNavigate } from "react-router-dom";

const UserProfileHeader = () => {
  const navigate = useNavigate();
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleclick = () => {
    navigate('/chat');
  }
  return (
    <>
      <div className="viewport">
        {/* Video Background */}
        <video
          className="video-bg"
          src={videoSrc5}
          autoPlay
          loop
          muted
          playsInline
        />

        {/* Dark Overlay */}
        <div className="overlay-dark"></div>

        {/* Header at top, centered horizontally */}
        <div className="header-top-center">
          <nav className="user-header-nav">
            <div className="user-header-container">
              <a className="user-header-logo-link" href="#" aria-label="FlowChat home">
                <img src={flowchatLogo} alt="FlowChat" className="user-header-logo" />
              </a>

              <div className="user-header-buttons">
                <button className="user-header-button" type="button" onClick={() => scrollTo('about')}>About</button>
                <button className="user-header-button" type="button" onClick={() => scrollTo('aim')}>Our Aim</button>
              </div>
            </div>
          </nav>
        </div>

        {/* Text above buttons */}
        <div className="hero">
          <h1 className="hero-title">
            <span className="line">Explore the Depths.</span><br />
            <span className="line accent">Understand Our Oceans</span>
          </h1>
        </div>

        {/* Buttons above bottom of video */}
        <div className="cta">
          <button className="btn btn--chat" onClick={handleclick}>Chat</button>
          <button 
            className="btn btn--stream"
            onClick={() => window.open("http://localhost:8501", "_blank", "noopener,noreferrer")}
          >
          StreamLit
          </button>
        </div>
      </div>

      {/* Black Section with Information Dashboards */}
      <div className="section-dark">
        <div className="container-7xl">
          <h2 className="section-title animate-fade-in-up">Know Ocean More</h2>

          {/* Information Dashboards */}
          <div className="grid-1-3">
            {/* Economic Impact Dashboard */}
            <div className="card" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
              <div className="card-body emerald">
                <div className="center">
                  <div className="icon-circle">
                    <span className="text-white text-3xl font-bold">$</span>
                  </div>
                  <h3 className="card-title">Economic Impact</h3>
                  <p className="card-text">
                    Oceans support global trade, fisheries, and tourism, provide food and energy, sustain livelihoods for billions, and contribute over <span className="font-bold text-emerald-400">$400 billion annually</span>, while enabling transportation, recreation, and economic development worldwide.
                  </p>
                </div>
              </div>
            </div>

            {/* Climate Change Dashboard */}
            <div className="card" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
              <div className="card-body red">
                <div className="center">
                  <div className="icon-circle">
                    <span className="text-white text-3xl font-bold">🌡️</span>
                  </div>
                  <h3 className="card-title">Climate Impact</h3>
                  <p className="card-text">
                    Climate change melts Greenland <span className="font-bold text-red-400">270B tons/year</span>, Antarctica <span className="font-bold text-red-400">150B tons/year</span>, raising sea levels 3.7 mm/year. Warmer oceans fuel 25% more Category 4–5 storms, while 50% of coral reefs are lost and ocean acidity increased 30%.
                  </p>
                </div>
              </div>
            </div>

            {/* Biodiversity Dashboard */}
            <div className="card" style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
              <div className="card-body indigo">
                <div className="center">
                  <div className="icon-circle">
                    <span className="text-white text-3xl font-bold">🐋</span>
                  </div>
                  <h3 className="card-title">Biodiversity</h3>
                  <p className="card-text">
                    The ocean hosts incredible biodiversity: over <span className="font-bold text-indigo-400">230,000 known species</span>, from tiny plankton to giant whales. Coral reefs support 25% of marine species, while deep seas hide mysterious creatures. Oceans cover 70% of Earth.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* About FloatChat Section */}
          <div className="about" id="about">
            <h2 className="about-title animate-fade-in-up">About FloatChat</h2>
            <div className="about-row">
              {/* Text Content */}
              <div className="about-text">
                <p className="animate-fade-in-up" style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}>
                  FloatChat is an AI-powered conversational interface designed to make ARGO oceanographic data accessible and easy to explore. Oceans generate vast amounts of data through profiling floats, BGC sensors, and other in-situ measurements, but analyzing this data often requires advanced technical skills. FloatChat bridges this gap, allowing users to interact with ocean data using natural language.
                </p>
                <p className="animate-fade-in-up" style={{ animationDelay: "0.8s", animationFillMode: "forwards" }}>
                  At its core, FloatChat combines Artificial Intelligence (AI) with Retrieval-Augmented Generation (RAG) techniques. Users ask questions in plain language—like viewing salinity profiles or comparing ocean parameters—and the system translates these queries into structured database searches, retrieving precise and meaningful results.
                </p>
                <p className="animate-fade-in-up" style={{ animationDelay: "1.1s", animationFillMode: "forwards" }}>
                  With an intuitive chat interface and interactive dashboards, FloatChat empowers researchers, educators, and enthusiasts to visualize float trajectories, depth-time profiles, and comparisons, turning complex ocean datasets into actionable insights.
                </p>
              </div>

              {/* Architecture Diagram */}
              <div className="arch animate-fade-in-up" style={{ animationDelay: "3s", animationFillMode: "forwards" }}>
                <div className="arch-card">
                  <div className="arch-head">
                    <h3>System Architecture</h3>
                    <p>Data Flow & AI Processing</p>
                  </div>

                  {/* Architecture Flow */}
                  <div className="flow">
                    {/* Data Ingestion Layer */}
                    <div className="step">
                      <div className="badge">
                        <div className="title">Raw Data</div>
                        <div className="desc">ARGO NetCDF Files</div>
                      </div>
                      <div className="arrow">↓</div>
                    </div>

                    {/* Preprocessing Layer */}
                    <div className="step">
                      <div className="badge purple">
                        <div className="title">Preprocessing</div>
                        <div className="desc">Data Cleaning & Processing</div>
                      </div>
                      <div className="arrow">↓</div>
                    </div>

                    {/* Database Layer */}
                    <div className="step">
                      <div className="badge yellow">
                        <div className="title">Database Layer</div>
                        <div className="desc">PostgreSQL + VectorDB</div>
                      </div>
                      <div className="arrow">↓</div>
                    </div>

                    {/* AI Processing Layer */}
                    <div className="step">
                      <div className="badge pink">
                        <div className="title">AI Processing</div>
                        <div className="desc">LLM + RAG System</div>
                      </div>
                      <div className="arrow">↓</div>
                    </div>

                    {/* Output Layer */}
                    <div className="step">
                      <div className="badge green">
                        <div className="title">User Output</div>
                        <div className="desc">Natural Language Responses</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Our Aim Section */}
          <div className="aim" id="aim">
            {/* Our Aim Text */}
            <div className="wrap">
              <h2 className="title animate-fade-in-up">Our Aim</h2>
              <p className="text animate-fade-in-up" style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}>
                FloatChat was built with the belief that the oceans hold the stories of our planet, waiting to be discovered. This project strives to unlock these hidden depths, making ocean data come alive.
              </p>
              <p className="text animate-fade-in-up" style={{ animationDelay: "0.8s", animationFillMode: "forwards" }}>
                The aim is to empower everyone—researchers, students, and enthusiasts—to explore, understand, and protect the vast, mysterious world beneath the waves.
              </p>
              <div className="text-center">
                <span className="signature animate-fade-in-up" style={{ animationDelay: "1.1s", animationFillMode: "forwards" }}>~ FloatChat Developer</span>
              </div>
            </div>

            {/* Ocean Images */}
            <div className="team-grid animate-fade-in-up" style={{ animationDelay: "1.4s", animationFillMode: "forwards" }}>
              {/* Ocean Life Image */}
              <div className="team-card">
                <div className="card-shell">
                  <div className="square">
                    <img src={pic1} alt="Ocean Biodiversity" />
                  </div>
                </div>
              </div>

              {/* Arctic Climate Image */}
              <div className="team-card">
                <div className="card-shell">
                  <div className="square">
                    <img src={pic2} alt="Climate Research" />
                  </div>
                </div>
              </div>

              {/* Ocean Exploration Image */}
              <div className="team-card">
                <div className="card-shell">
                  <div className="square">
                    <img src={pic3} alt="Ocean Exploration" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfileHeader;