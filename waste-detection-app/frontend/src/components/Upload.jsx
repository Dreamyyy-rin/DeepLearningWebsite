import React, { useState } from 'react';
import { predictWaste } from '../api/api';

const Upload = ({ onResults }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [modelName, setModelName] = useState('YoloV11s');
    const [confidence, setConfidence] = useState(0.25);

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
        setMessage('');
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setMessage('Please select a file to upload.');
            return;
        }

        setLoading(true);
        setMessage('Processing...');

        try {
            const result = await predictWaste(selectedFile, modelName, confidence);
            setMessage('Detection complete!');
            onResults(result);
        } catch (error) {
            setMessage(`Error: ${error.message || 'Detection failed'}`);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="upload-container">
            <h2>Upload Waste Image for Detection</h2>
            
            <div className="form-group">
                <label>Select Image:</label>
                <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange} 
                    disabled={loading}
                />
            </div>

            <div className="form-group">
                <label>Model:</label>
                <select 
                    value={modelName} 
                    onChange={(e) => setModelName(e.target.value)}
                    disabled={loading}
                >
                    <option value="YoloV11s">YoloV11s (Small - Fast)</option>
                    <option value="YoloV11n">YoloV11n (Nano - Fastest)</option>
                    <option value="YoloV11m">YoloV11m (Medium - Balanced)</option>
                </select>
            </div>

            <div className="form-group">
                <label>Confidence Threshold: {confidence.toFixed(2)}</label>
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

            <button onClick={handleUpload} disabled={loading || !selectedFile}>
                {loading ? 'Processing...' : 'Upload & Detect'}
            </button>
            
            {message && <p className={loading ? 'info' : 'message'}>{message}</p>}
        </div>
    );
};

export default Upload;