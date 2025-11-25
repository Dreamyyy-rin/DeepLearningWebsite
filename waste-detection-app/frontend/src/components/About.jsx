import React from "react";
import "./About.css";

const About = () => {
  return (
    <div className="about-container">
      <div className="about-hero">
        <h1 className="about-title">About Us</h1>
        <p className="about-subtitle">
          Meet the team behind this Waste Detection AI Project
        </p>
      </div>

      <div className="about-content">
        <div className="project-section">
          <h2>🎯 Our Project</h2>
          <p>
            This Waste Detection Application uses advanced YOLOv11 deep learning
            models to automatically identify and classify waste objects in
            images and videos. Our goal is to contribute to environmental
            sustainability through AI-powered waste management solutions.
          </p>
          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">🖼️</span>
              <h3>Image Detection</h3>
              <p>Upload images to detect waste objects with high accuracy</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🎬</span>
              <h3>Video Detection</h3>
              <p>Process videos frame-by-frame for real-time detection</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">📊</span>
              <h3>Region Counting</h3>
              <p>Count objects in specific areas with draggable regions</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">⚡</span>
              <h3>Multiple Models</h3>
              <p>Choose from YOLOv11n, YOLOv11s, or YOLOv11m models</p>
            </div>
          </div>
        </div>

        <div className="team-section">
          <h2>👥 Our Team</h2>
          <p className="team-intro">
            Developed by Computer Science students at Universitas Kristen Satya
            Wacana
          </p>

          <div className="team-grid">
            <div className="team-card">
              <div className="team-avatar">
                <span className="avatar-text">O</span>
              </div>
              <div className="team-info">
                <h3 className="team-name">Oivicko Ekagani Irwanto</h3>
                <p className="team-nim">NIM: 672023006</p>
                <div className="team-role">
                  <span className="role-badge">Backend Developer</span>
                  <span className="role-badge">ML Engineer</span>
                </div>
                <p className="team-bio">
                  Responsible for building the Flask backend API, implementing
                  YOLO model inference, and video processing pipeline.
                </p>
              </div>
            </div>

            <div className="team-card">
              <div className="team-avatar">
                <span className="avatar-text">F</span>
              </div>
              <div className="team-info">
                <h3 className="team-name">Felicia Wijaya</h3>
                <p className="team-nim">NIM: 672023009</p>
                <div className="team-role">
                  <span className="role-badge">Frontend Developer</span>
                  <span className="role-badge">UI/UX Designer</span>
                </div>
                <p className="team-bio">
                  Focused on creating the React frontend, designing the user
                  interface, and implementing interactive features like region
                  counting.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="tech-section">
          <h2>🛠️ Technologies Used</h2>
          <div className="tech-grid">
            <div className="tech-item">
              <span className="tech-icon">🐍</span>
              <span className="tech-name">Python & Flask</span>
            </div>
            <div className="tech-item">
              <span className="tech-icon">⚛️</span>
              <span className="tech-name">React.js</span>
            </div>
            <div className="tech-item">
              <span className="tech-icon">🤖</span>
              <span className="tech-name">YOLOv11</span>
            </div>
            <div className="tech-item">
              <span className="tech-icon">📦</span>
              <span className="tech-name">Ultralytics</span>
            </div>
            <div className="tech-item">
              <span className="tech-icon">🎨</span>
              <span className="tech-name">CSS3</span>
            </div>
            <div className="tech-item">
              <span className="tech-icon">📡</span>
              <span className="tech-name">REST API</span>
            </div>
          </div>
        </div>

        <div className="footer-section">
          <div className="university-info">
            <h3>🏛️ Universitas Kristen Satya Wacana</h3>
            <p>Faculty of Information Technology</p>
            <p>Informatics Engineering Program</p>
            <p className="year">© 2025</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
