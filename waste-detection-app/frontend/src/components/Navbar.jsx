import React from "react";
import "./Navbar.css";

const Navbar = ({ currentPage, onNavigate }) => {
  return (
    <nav className="navbar">
      <div
        className="logo"
        onClick={() => onNavigate("home")}
        style={{ cursor: "pointer" }}
      >
        Waste<span className="logo-box">Detection</span>
      </div>

      <div className="nav-links">
        <a
          href="#home"
          className={currentPage === "home" ? "active" : ""}
          onClick={(e) => {
            e.preventDefault();
            onNavigate("home");
          }}
        >
          Home
        </a>
        <a
          href="#about"
          className={currentPage === "about" ? "active" : ""}
          onClick={(e) => {
            e.preventDefault();
            onNavigate("about");
          }}
        >
          About Us
        </a>
      </div>
    </nav>
  );
};

export default Navbar;
