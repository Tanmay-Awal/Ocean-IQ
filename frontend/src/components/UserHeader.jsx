import React, { useEffect } from "react";
import "./UserHeader.css";
import { useNavigate } from "react-router-dom";
import pic3 from "../assets/3.jpg";

const UserProfileHeader = () => {
  const navigate = useNavigate();

  const scrollToAbout = () => {
    document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Add ambient orbs
    const container = document.querySelector('.landing-hero');
    if (container) {
      const orb1 = document.createElement('div');
      orb1.className = 'ambient-orb orb-1';
      const orb2 = document.createElement('div');
      orb2.className = 'ambient-orb orb-2';
      container.appendChild(orb1);
      container.appendChild(orb2);
    }
  }, []);

  return (
    <div className="brutalist-wrapper">
      {/* Navigation */}
      <nav className="fixed-nav">
        <div className="nav-logo">OCEANIQ</div>
        <div className="nav-links">
          <a href="#capabilities">CAPABILITIES</a>
          <a href="#about">ABOUT</a>
          <button className="nav-btn" onClick={() => navigate('/chat')}>LAUNCH CHAT</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <h1 className="landing-hero-title">
          <span>OCEANIC</span>
          <span>INTELLIGENCE</span>
        </h1>
        <div className="landing-hero-footer">
          <p className="hero-subtext">CRAFTING DIGITAL ARTIFACTS THAT DEFINE MODERN OCEANOGRAPHY AND PUSH THE BOUNDARIES OF DATA PERCEPTION.</p>
          <button
            type="button"
            className="bounce-arrow"
            onClick={scrollToAbout}
            aria-label="Scroll to about section"
          >
            ↓
          </button>
        </div>
      </section>

      {/* Featured Asymmetric Section - Dark */}
      <section id="about" className="featured-section">
        <div className="featured-grid">
          <div className="featured-left">
            <div className="cyan-square-offset"></div>
            <img src={pic3} alt="Featured" className="grayscale-img" />
          </div>
          <div className="featured-right">
            <span className="sage-label">CORE TECHNOLOGY</span>
            <h2 className="featured-heading">REDEFINING THE DATA CANVAS</h2>
            <p className="featured-text">
              We built an immersive AI architecture that behaves like a living museum of the ocean.
              By merging natural language processing with brutalist data visualization, we created an interface that exists between marine science and functional art.
            </p>
            <button className="link-btn" onClick={() => navigate('/chat')}>ENTER CHAT SYSTEM <span>→</span></button>
          </div>
        </div>
      </section>

      {/* Capabilities Section - Light */}
      <section id="capabilities" className="capabilities-section">
        <div className="cap-grid">
          <div className="cap-list">
            <span className="cap-label">CAPABILITIES</span>
            <ul>
              <li><span></span> Retrieval Augmented Gen</li>
              <li><span></span> Vector Embeddings</li>
              <li><span></span> Dynamic Graphing</li>
              <li><span></span> Deep Ocean DB</li>
            </ul>
          </div>
          <div className="cap-statement">
            Transforming raw <span className="italic-accent">NetCDF</span> data into
            actionable <span className="italic-accent">insights</span> through conversational AI.
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="massive-footer">
        <h1 className="footer-heading">DIVE DEEPER</h1>
        <a href="#" className="footer-email" onClick={(e) => { e.preventDefault(); navigate('/chat') }}>LAUNCH OCEANIQ</a>

        <div className="footer-bottom">
          <span>© 2026 OCEANIQ</span>
          <div className="footer-links">
            <a href="#">TWITTER</a>
            <a href="#">GITHUB</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UserProfileHeader;