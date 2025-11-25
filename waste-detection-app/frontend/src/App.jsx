import React, { useState, useRef, useEffect } from "react"; 
import Upload from "./components/Upload";
import Results from "./components/Results";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import "./App.css";
import Footer from "./components/Footer";

const App = () => {
  const [results, setResults] = useState(null);
  const [currentPage, setCurrentPage] = useState("home");

  const resultsRef = useRef(null);

  const handleResults = (data) => {
    setResults(data);
  };

  const handleNavigation = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (results && resultsRef.current && currentPage === "home") {
      setTimeout(() => {
        resultsRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [results, currentPage]);

  return (
    <div className="container">
      <Navbar currentPage={currentPage} onNavigate={handleNavigation} />

      {currentPage === "home" ? (
        <>
          <Hero />
          <main className="main-content">
            <div id="detector" className="hero-wrapper">
              <Upload onResults={handleResults} />

              <div ref={resultsRef}>
                {results && (
                  <div className="results-section">
                    <Results data={results} />
                  </div>
                )}
              </div>
            </div>
          </main>
        </>
      ) : (
        <About />
      )}

      <Footer />
    </div>
  );
};

export default App;
