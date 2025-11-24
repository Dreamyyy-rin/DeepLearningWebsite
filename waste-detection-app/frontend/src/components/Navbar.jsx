import React from "react";
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="logo">
        Waste<span className="logo-box">Detection</span>
      </div>

      <div className="nav-links">
        <a href="#home" className="active">
          Home
        </a>
        <a href="#about">About us</a>
      </div>
    </nav>
  );
};

export default Navbar;
