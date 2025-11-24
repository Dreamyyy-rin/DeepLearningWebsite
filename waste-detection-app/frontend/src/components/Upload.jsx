import React, { useState } from "react";
import { predictWaste } from "../api/api";
import "./Upload.css";

const Upload = ({ onResults }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [modelName, setModelName] = useState("YoloV11s");
  const [confidence, setConfidence] = useState(0.25);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setMessage("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Please select a file to upload.");
      return;
    }

    setLoading(true);
    setMessage("Processing...");

    try {
      const result = await predictWaste(selectedFile, modelName, confidence);
      setMessage("Detection complete!");
      onResults(result);
    } catch (error) {
      setMessage(`Error: ${error.message || "Detection failed"}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-section">
      <div className="upload-header">
        <h3>Let's Try Out</h3>
        <p>Upload your waste image and our AI will detect it.</p>
      </div>

      <div className="upload-card">
        <div className="upload-area">
          <input
            type="file"
            id="fileInput"
            className="file-input"
            accept="image/*"
            onChange={handleFileChange}
            disabled={loading}
          />
          <label htmlFor="fileInput" className="upload-label">
            {preview ? (
              <img src={preview} alt="Preview" className="image-preview" />
            ) : (
              <div className="placeholder-content">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="upload-icon"
                >
                  <path
                    d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z"
                    fill="#3E3F29"
                  />
                </svg>
                <p>
                  <strong>Click to Upload</strong>
                </p>
                <span className="support-text">
                  Upload your image by clicking the button below.
                </span>
                <div className="upload-btn-fake">Select File</div>
              </div>
            )}
          </label>
        </div>

        <div className="controls-row">
          <div className="control-group">
            <label>Model:</label>
            <select
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              disabled={loading}
            >
              <option value="YoloV11s">YoloV11s (Small)</option>
              <option value="YoloV11n">YoloV11n (Nano)</option>
              <option value="YoloV11m">YoloV11m (Medium)</option>
            </select>
          </div>

          <div className="control-group">
            <label>Confidence: {confidence.toFixed(2)}</label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={confidence}
              onChange={(e) => setConfidence(parseFloat(e.target.value))}
              disabled={loading}
            />
          </div>
        </div>

        <button
          className="btn-detect"
          onClick={handleUpload}
          disabled={loading || !selectedFile}
        >
          {loading ? "Processing..." : "Start Detection"}
        </button>

        {message && (
          <p className={`status-message ${loading ? "loading" : ""}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Upload;
