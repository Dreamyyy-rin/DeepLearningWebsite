import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <p>
        &copy; {new Date().getFullYear()}{" "}
        <strong>
          WasteDetection by Oivicko Ekagani Irwanto & Felicia Wijaya
        </strong>
        . All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
