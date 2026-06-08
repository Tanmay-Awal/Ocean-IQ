"use client";
import React, { useState, useEffect } from "react";
import "./UserHeader.css";
import { useRouter } from "next/navigation";
import pic3 from "../assets/3.jpg";

const UserProfileHeader = () => {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);

    // Scroll reveal observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll(".reveal-on-scroll");
    elements.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("scroll", handleScroll);
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const scrollToAbout = () => {
    document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="brutalist-wrapper">
      {/* Navigation */}
      <nav className={`fixed-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-logo">
          <span>OCEANIQ</span>
          <span className="live-badge">
            <span className="ping-dot"></span>
            <span className="ping-text">TELEMETRY LIVE</span>
          </span>
        </div>
        <div className="nav-links">
          <a href="#capabilities">CAPABILITIES</a>
          <a href="#about">ABOUT</a>
          <button className="nav-btn" onClick={() => router.push('/chat')}>LAUNCH CHAT</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero-img-section">
        <img src="/landing.png" alt="OceanIQ Landing" className="hero-landing-image" />
        <button
          type="button"
          className="bounce-arrow-overlay"
          onClick={scrollToAbout}
          aria-label="Scroll to about section"
        >
          ↓
        </button>
      </section>

      {/* Featured Asymmetric Section - Dark */}
      <section id="about" className="featured-section">
        <div className="featured-grid">
          <div className="featured-left reveal-on-scroll slide-left">
            <div className="cyan-square-offset"></div>
            <img src={pic3.src} alt="Featured" className="grayscale-img" />
          </div>
          <div className="featured-right reveal-on-scroll slide-right">
            <span className="sage-label">CORE TECHNOLOGY</span>
            <h2 className="featured-heading">REDEFINING THE DATA CANVAS</h2>
            <p className="featured-text">
              We built an immersive AI architecture that behaves like a living museum of the ocean.
              By merging natural language processing with brutalist data visualization, we created an interface that exists between marine science and functional art.
            </p>
            <button className="link-btn" onClick={() => router.push('/chat')}>ENTER CHAT SYSTEM <span>→</span></button>
          </div>
        </div>
      </section>

      {/* Capabilities Section - Light */}
      <section id="capabilities" className="capabilities-section">
        <div className="cap-grid">
          <div className="cap-list reveal-on-scroll fade-in">
            <span className="cap-label">CAPABILITIES</span>
            <ul>
              <li><span></span> Retrieval Augmented Gen</li>
              <li><span></span> Vector Embeddings</li>
              <li><span></span> Dynamic Graphing</li>
              <li><span></span> Deep Ocean DB</li>
            </ul>
          </div>
          <div className="cap-statement reveal-on-scroll fade-in delay-200">
            Transforming raw <span className="italic-accent">NetCDF</span> data into
            actionable <span className="italic-accent">insights</span> through conversational AI.
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="massive-footer reveal-on-scroll fade-in">
        <h1 className="footer-heading">DIVE DEEPER</h1>
        <a href="#" className="footer-email" onClick={(e) => { e.preventDefault(); router.push('/chat') }}>LAUNCH OCEANIQ</a>

        <div className="footer-bottom">
          <span>© 2026 OCEANIQ</span>
        </div>
      </footer>
    </div>
  );
};

export default UserProfileHeader;