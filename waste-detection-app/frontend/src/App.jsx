import React, { useState, useRef, useEffect } from "react"; // 1. Tambah useRef & useEffect
import Upload from "./components/Upload";
import Results from "./components/Results";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import "./App.css";
import Footer from "./components/Footer";

const App = () => {
  const [results, setResults] = useState(null);

  const resultsRef = useRef(null);

  const handleResults = (data) => {
    setResults(data);
  };

  useEffect(() => {
    if (results && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [results]);

  return (
    <div className="container">
      <Navbar />
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
      <Footer />
    </div>
  );
};

export default App;
