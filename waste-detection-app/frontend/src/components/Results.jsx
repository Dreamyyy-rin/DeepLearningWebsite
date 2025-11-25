import React, { useEffect, useState } from "react";
import "./Results.css";

const Results = ({ data }) => {
  const [videoUrl, setVideoUrl] = useState(null);

  // Convert base64 video to blob URL for better performance
  useEffect(() => {
    if (data?.video && data.video.startsWith("data:video")) {
      try {
        // Extract base64 data
        const base64Data = data.video.split(",")[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);

        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const blob = new Blob([bytes], { type: "video/mp4" });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);

        // Cleanup
        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (error) {
        console.error("Error converting video:", error);
        setVideoUrl(data.video); // Fallback to direct base64
      }
    } else {
      setVideoUrl(null);
    }
  }, [data?.video]);

  if (!data) {
    return null;
  }

  // Handle both image (detections) and video (video) results
  const {
    detections,
    annotated_image,
    model_used,
    video,
    detections_per_frame,
    total_frames,
    fps,
  } = data;

  // Determine if result is from video or image
  const isVideoResult = !!video;
  const allDetections =
    detections ||
    (detections_per_frame
      ? detections_per_frame.flatMap((f) => f.detections)
      : []);

  return (
    <div className="results-container">
      <div className="results-summary">
        <h3>Detection Results</h3>

        <div className="results-info">
          <p>
            <strong>Model Used:</strong>{" "}
            <span className="highlight-text">{model_used}</span>
          </p>
          {isVideoResult ? (
            <>
              <p>
                <strong>Total Frames:</strong>{" "}
                <span className="highlight-text">{total_frames}</span>
              </p>
              <p>
                <strong>FPS:</strong>{" "}
                <span className="highlight-text">{fps}</span>
              </p>
              <p>
                <strong>Total Detections:</strong>{" "}
                <span className="highlight-text">{allDetections.length}</span>
              </p>
            </>
          ) : (
            <p>
              <strong>Detections Found:</strong>{" "}
              <span className="highlight-text">{detections?.length || 0}</span>
            </p>
          )}
        </div>
      </div>

      <div className="results-details-card">
        {annotated_image && (
          <div className="image-container">
            <h4>Annotated Image:</h4>
            <img
              src={annotated_image}
              alt="Annotated detection result"
              className="result-img"
            />
          </div>
        )}

        {isVideoResult && videoUrl && (
          <div className="video-container">
            <h4>Annotated Video with Detection Regions:</h4>
            <video
              src={videoUrl}
              controls
              className="result-video"
              style={{
                maxWidth: "100%",
                maxHeight: "600px",
                borderRadius: "8px",
              }}
              onError={(e) => console.error("Video playback error:", e)}
            />
          </div>
        )}

        {isVideoResult && !videoUrl && (
          <div className="video-container loading">
            <p>Loading video...</p>
          </div>
        )}

        {allDetections && allDetections.length > 0 ? (
          <div className="detections-list">
            <h4>Detected Objects:</h4>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Confidence</th>
                    <th>Bounding Box (Region)</th>
                  </tr>
                </thead>
                <tbody>
                  {allDetections.map((det, index) => (
                    <tr key={index}>
                      <td>
                        <span className="badge">{det.label}</span>
                      </td>
                      <td>{(det.confidence * 100).toFixed(1)}%</td>
                      <td className="mono-font">
                        x1:{det.bbox[0].toFixed(0)}, y1:{det.bbox[1].toFixed(0)}
                        , x2:{det.bbox[2].toFixed(0)}, y2:
                        {det.bbox[3].toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="no-data">No objects detected.</p>
        )}

        {isVideoResult &&
          detections_per_frame &&
          detections_per_frame.length > 0 && (
            <div className="frame-details">
              <h4>Detections per Frame:</h4>
              <div className="frame-list">
                {detections_per_frame.slice(0, 10).map((frame, idx) => (
                  <div key={idx} className="frame-item">
                    <strong>Frame {frame.frame}:</strong>{" "}
                    {frame.detections.length} detection(s)
                  </div>
                ))}
                {detections_per_frame.length > 10 && (
                  <div className="frame-item">
                    ... and {detections_per_frame.length - 10} more frames
                  </div>
                )}
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default Results;
