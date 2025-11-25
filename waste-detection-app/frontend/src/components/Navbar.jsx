import React, { useState } from "react";
import "./Navbar.css";

const Navbar = ({ currentPage, onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNavClick = (page) => {
    onNavigate(page);
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div
        className="logo"
        onClick={() => handleNavClick("home")}
        style={{ cursor: "pointer" }}
      >
        Waste<span className="logo-box">Detection</span>
      </div>

      <button
        className="hamburger"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle menu"
      >
        <span className={isMenuOpen ? "open" : ""}></span>
        <span className={isMenuOpen ? "open" : ""}></span>
        <span className={isMenuOpen ? "open" : ""}></span>
      </button>

      <div className={`nav-links ${isMenuOpen ? "active" : ""}`}>
        <a
          href="#home"
          className={currentPage === "home" ? "active" : ""}
          onClick={(e) => {
            e.preventDefault();
            handleNavClick("home");
          }}
        >
          Home
        </a>
        <a
          href="#about"
          className={currentPage === "about" ? "active" : ""}
          onClick={(e) => {
            e.preventDefault();
            handleNavClick("about");
          }}
        >
          About Us
        </a>
      </div>
    </nav>
  );
};

export default Navbar;
