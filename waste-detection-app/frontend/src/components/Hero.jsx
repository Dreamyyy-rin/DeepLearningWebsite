import React from 'react';
import './Hero.css'; 

const Hero = () => {
  return (
    <header className="hero">
      <div className="hero-content">
        <h1>
          CLEAN UP🚮
         
          <br />
          YOUR ENVIRONMENT WITH
          <br />
          <span className="highlight">AI WASTE DETECTOR </span>
        </h1>
        
        <p className="subtitle">
          Detect waste types instantly. Recycle better. Protect the planet. 
          Start your journey to a cleaner world with our AI technology.
        </p>


        <a href="#detector" className="btn-start">
          Try Detector <span className="arrow-right">→</span>
        </a>
      </div>

      <div className="hero-image-wrapper">
        <div className="image-box">
          <img 
            src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80" 
            alt="AI Waste Tech" 
            className="model-img"
          />
          <div className="face-frame"></div>
        </div>
      </div>
    </header>
  );
};

export default Hero;