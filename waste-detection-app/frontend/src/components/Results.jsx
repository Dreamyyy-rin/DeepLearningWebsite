import React, { useEffect, useState, useRef, useCallback } from "react";
import "./Results.css";

const Results = ({ data }) => {
  const [videoUrl, setVideoUrl] = useState(null);
  const [regionNorm, setRegionNorm] = useState({
    x: 0.15,
    y: 0.15,
    w: 0.35,
    h: 0.3,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentFrame, setCurrentFrame] = useState(0);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const videoRef = useRef(null);
  const videoCanvasRef = useRef(null);
  const imageOverlayRef = useRef(null);
  const videoOverlayRef = useRef(null);
  const lastUpdateRef = useRef(0);
  const rafRef = useRef(null);

  const getPixelRegion = useCallback(
    (displayW, displayH) => {
      return {
        x: regionNorm.x * displayW,
        y: regionNorm.y * displayH,
        width: regionNorm.w * displayW,
        height: regionNorm.h * displayH,
      };
    },
    [regionNorm]
  );

  const countObjectsInRegion = useCallback(() => {
    if (!data?.detections || !canvasRef.current || !imageRef.current) return 0;

    const canvas = canvasRef.current;
    const image = imageRef.current;
    const pixelRegion = getPixelRegion(canvas.width, canvas.height);
    const scaleX = image.naturalWidth / canvas.width;
    const scaleY = image.naturalHeight / canvas.height;

    const regionInImageCoords = {
      x1: pixelRegion.x * scaleX,
      y1: pixelRegion.y * scaleY,
      x2: (pixelRegion.x + pixelRegion.width) * scaleX,
      y2: (pixelRegion.y + pixelRegion.height) * scaleY,
    };

    let count = 0;
    data.detections.forEach((det) => {
      const [bx1, by1, bx2, by2] = det.bbox;
      const centerX = (bx1 + bx2) / 2;
      const centerY = (by1 + by2) / 2;
      if (
        centerX >= regionInImageCoords.x1 &&
        centerX <= regionInImageCoords.x2 &&
        centerY >= regionInImageCoords.y1 &&
        centerY <= regionInImageCoords.y2
      ) {
        count++;
      }
    });
    return count;
  }, [data, getPixelRegion]);

  const countObjectsInVideoRegion = useCallback(() => {
    if (
      !data?.detections_per_frame ||
      !videoCanvasRef.current ||
      !videoRef.current
    )
      return 0;
    const canvas = videoCanvasRef.current;
    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) return 0;
    const pixelRegion = getPixelRegion(canvas.width, canvas.height);
    const scaleX = video.videoWidth / canvas.width;
    const scaleY = video.videoHeight / canvas.height;
    const regionInVideoCoords = {
      x1: pixelRegion.x * scaleX,
      y1: pixelRegion.y * scaleY,
      x2: (pixelRegion.x + pixelRegion.width) * scaleX,
      y2: (pixelRegion.y + pixelRegion.height) * scaleY,
    };
    const frameData = data.detections_per_frame[currentFrame];
    if (!frameData || !frameData.detections) return 0;
    let count = 0;
    frameData.detections.forEach((det) => {
      const [bx1, by1, bx2, by2] = det.bbox;
      const centerX = (bx1 + bx2) / 2;
      const centerY = (by1 + by2) / 2;
      if (
        centerX >= regionInVideoCoords.x1 &&
        centerX <= regionInVideoCoords.x2 &&
        centerY >= regionInVideoCoords.y1 &&
        centerY <= regionInVideoCoords.y2
      ) {
        count++;
      }
    });
    return count;
  }, [data, currentFrame, getPixelRegion]);

  useEffect(() => {
    if (data?.video && data.video.startsWith("data:video")) {
      try {
        const base64Data = data.video.split(",")[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);

        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const blob = new Blob([bytes], { type: "video/mp4" });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);

        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (error) {
        console.error("Error converting video:", error);
        setVideoUrl(data.video);
      }
    } else {
      setVideoUrl(null);
    }
  }, [data?.video]);

  useEffect(() => {
    if (
      !data ||
      !data.annotated_image ||
      !canvasRef.current ||
      !imageRef.current
    )
      return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const image = imageRef.current;

    if (!image.complete) return;

    canvas.width = image.offsetWidth;
    canvas.height = image.offsetHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const pixelRegion = getPixelRegion(canvas.width, canvas.height);
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 3;
    ctx.strokeRect(
      pixelRegion.x,
      pixelRegion.y,
      pixelRegion.width,
      pixelRegion.height
    );
    ctx.fillStyle = "rgba(255, 215, 0, 0.15)";
    ctx.fillRect(
      pixelRegion.x,
      pixelRegion.y,
      pixelRegion.width,
      pixelRegion.height
    );
    const count = countObjectsInRegion();
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(pixelRegion.x, pixelRegion.y - 30, 90, 25);
    ctx.fillStyle = "#000";
    ctx.font = "bold 16px Arial";
    ctx.fillText(`Count: ${count}`, pixelRegion.x + 5, pixelRegion.y - 10);
  }, [data, regionNorm, getPixelRegion, countObjectsInRegion]);

  useEffect(() => {
    if (!data?.video || !videoCanvasRef.current || !videoRef.current) return;

    const canvas = videoCanvasRef.current;
    const video = videoRef.current;

    const drawRegion = () => {
      const ctx = canvas.getContext("2d");

      canvas.width = video.offsetWidth;
      canvas.height = video.offsetHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const pixelRegion = getPixelRegion(canvas.width, canvas.height);
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 3;
      ctx.strokeRect(
        pixelRegion.x,
        pixelRegion.y,
        pixelRegion.width,
        pixelRegion.height
      );
      ctx.fillStyle = "rgba(255, 215, 0, 0.15)";
      ctx.fillRect(
        pixelRegion.x,
        pixelRegion.y,
        pixelRegion.width,
        pixelRegion.height
      );
      const count = countObjectsInVideoRegion();
      ctx.fillStyle = "#FFD700";
      ctx.fillRect(pixelRegion.x, pixelRegion.y - 30, 90, 25);
      ctx.fillStyle = "#000";
      ctx.font = "bold 16px Arial";
      ctx.fillText(`Count: ${count}`, pixelRegion.x + 5, pixelRegion.y - 10);
    };

    const handleTimeUpdate = () => {
      if (data.fps && data.total_frames) {
        const frame = Math.min(
          Math.floor(video.currentTime * data.fps),
          data.total_frames - 1
        );
        setCurrentFrame(frame);
      }
      drawRegion();
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", drawRegion);

    drawRegion();

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", drawRegion);
    };
  }, [data, regionNorm, getPixelRegion, countObjectsInVideoRegion]);

  const unifiedPoint = (evt) => {
    if (evt.touches && evt.touches.length) {
      return { x: evt.touches[0].clientX, y: evt.touches[0].clientY };
    }
    return { x: evt.clientX, y: evt.clientY };
  };

  const handlePointerDown = (e, targetType) => {
    e.preventDefault();
    const { x, y } = unifiedPoint(e);
    let targetEl =
      targetType === "image"
        ? imageOverlayRef.current
        : videoOverlayRef.current;
    let canvasEl =
      targetType === "image" ? canvasRef.current : videoCanvasRef.current;
    if (!targetEl || !canvasEl) return;

    const rect = canvasEl.getBoundingClientRect();
    const displayW = rect.width;
    const displayH = rect.height;
    const pixelRegion = getPixelRegion(displayW, displayH);
    const localX = x - rect.left;
    const localY = y - rect.top;

    if (
      localX >= pixelRegion.x &&
      localX <= pixelRegion.x + pixelRegion.width &&
      localY >= pixelRegion.y &&
      localY <= pixelRegion.y + pixelRegion.height
    ) {
      setIsDragging(true);
      setDragOffset({ x: localX - pixelRegion.x, y: localY - pixelRegion.y });
    }
  };

  const handlePointerMove = (e, targetType) => {
    if (!isDragging) return;
    e.preventDefault();

    const now = Date.now();
    if (targetType === "video" && now - lastUpdateRef.current < 16) return; 
    lastUpdateRef.current = now;

    const { x, y } = unifiedPoint(e);
    let canvasEl =
      targetType === "image" ? canvasRef.current : videoCanvasRef.current;
    if (!canvasEl) return;

    const rect = canvasEl.getBoundingClientRect();
    const displayW = rect.width;
    const displayH = rect.height;
    const localX = x - rect.left;
    const localY = y - rect.top;
    const pixelRegion = getPixelRegion(displayW, displayH);

    let newPixelX = localX - dragOffset.x;
    let newPixelY = localY - dragOffset.y;

    newPixelX = Math.max(0, Math.min(newPixelX, displayW - pixelRegion.width));
    newPixelY = Math.max(
      30,
      Math.min(newPixelY, displayH - pixelRegion.height)
    );

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setRegionNorm({
        x: newPixelX / displayW,
        y: newPixelY / displayH,
        w: regionNorm.w,
        h: regionNorm.h,
      });
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && imageRef.current) {
        const canvas = canvasRef.current;
        canvas.width = imageRef.current.offsetWidth;
        canvas.height = imageRef.current.offsetHeight;
      }
      if (videoCanvasRef.current && videoRef.current) {
        videoCanvasRef.current.width = videoRef.current.offsetWidth;
        videoCanvasRef.current.height = videoRef.current.offsetHeight;
      }
      setRegionNorm((r) => ({ ...r }));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!data) {
    return null;
  }

  const {
    detections,
    annotated_image,
    model_used,
    video,
    detections_per_frame,
    total_frames,
    fps,
  } = data;

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
              <strong>Counting:</strong>{" "}
              <span className="highlight-text">{detections?.length || 0}</span>
            </p>
          )}
        </div>
      </div>

      <div className="results-details-card">
        {annotated_image && (
          <div className="image-container">
            <h4>Annotated Image with Counting Region:</h4>
            <div
              className="image-wrapper"
              style={{
                position: "relative",
                display: "inline-block",
                width: "100%",
              }}
            >
              <img
                ref={imageRef}
                src={annotated_image}
                alt="Annotated detection result"
                className="result-img"
                onLoad={() => {
                  if (canvasRef.current && imageRef.current) {
                    const canvas = canvasRef.current;
                    canvas.width = imageRef.current.offsetWidth;
                    canvas.height = imageRef.current.offsetHeight;
                    setRegionNorm((r) => ({ ...r }));
                  }
                }}
              />
              <canvas
                ref={canvasRef}
                className="region-canvas"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                }}
              />
              {(() => {
                if (!canvasRef.current) return null;
                const rect = canvasRef.current.getBoundingClientRect();
                const displayW = rect.width;
                const displayH = rect.height;
                if (!displayW || !displayH) return null;
                const pixelRegion = getPixelRegion(displayW, displayH);
                return (
                  <div
                    ref={imageOverlayRef}
                    className="image-region-overlay"
                    style={{
                      position: "absolute",
                      top: `${pixelRegion.y}px`,
                      left: `${pixelRegion.x}px`,
                      width: `${pixelRegion.width}px`,
                      height: `${pixelRegion.height}px`,
                      cursor: isDragging ? "grabbing" : "grab",
                      pointerEvents: "auto",
                      zIndex: 10,
                      touchAction: "none",
                      userSelect: "none",
                    }}
                    onMouseDown={(e) => handlePointerDown(e, "image")}
                    onMouseMove={(e) => handlePointerMove(e, "image")}
                    onMouseUp={handlePointerUp}
                    onMouseLeave={handlePointerUp}
                    onTouchStart={(e) => handlePointerDown(e, "image")}
                    onTouchMove={(e) => handlePointerMove(e, "image")}
                    onTouchEnd={handlePointerUp}
                  />
                );
              })()}
            </div>
            <div className="region-info">
              <p>
                <strong>Objects in Yellow Region:</strong>{" "}
                <span className="highlight-count">
                  {countObjectsInRegion()}
                </span>
              </p>
              <p className="region-hint">
                💡 Drag the yellow box to count objects in different areas
              </p>
            </div>
          </div>
        )}

        {isVideoResult && videoUrl && (
          <div className="video-container">
            <h4>Annotated Video with Counting Region:</h4>
            <div
              className="video-wrapper"
              style={{
                position: "relative",
                display: "inline-block",
                width: "100%",
              }}
            >
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                className="result-video"
                style={{
                  width: "100%",
                  maxHeight: "600px",
                  borderRadius: "8px",
                  display: "block",
                }}
                onError={(e) => console.error("Video playback error:", e)}
              />
              <canvas
                ref={videoCanvasRef}
                className="region-canvas video-canvas"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                }}
              />
              {(() => {
                if (!videoCanvasRef.current) return null;
                const rect = videoCanvasRef.current.getBoundingClientRect();
                const displayW = rect.width;
                const displayH = rect.height;
                if (!displayW || !displayH) return null;
                const pixelRegion = getPixelRegion(displayW, displayH);
                return (
                  <div
                    ref={videoOverlayRef}
                    className="video-region-overlay"
                    style={{
                      position: "absolute",
                      top: `${pixelRegion.y}px`,
                      left: `${pixelRegion.x}px`,
                      width: `${pixelRegion.width}px`,
                      height: `${pixelRegion.height}px`,
                      cursor: isDragging ? "grabbing" : "grab",
                      pointerEvents: "auto",
                      zIndex: 10,
                      touchAction: "none",
                      userSelect: "none",
                    }}
                    onMouseDown={(e) => handlePointerDown(e, "video")}
                    onMouseMove={(e) => handlePointerMove(e, "video")}
                    onMouseUp={handlePointerUp}
                    onMouseLeave={handlePointerUp}
                    onTouchStart={(e) => handlePointerDown(e, "video")}
                    onTouchMove={(e) => handlePointerMove(e, "video")}
                    onTouchEnd={handlePointerUp}
                  />
                );
              })()}
            </div>
            <div className="region-info">
              <p>
                <strong>
                  Objects in Yellow Region (Frame {currentFrame}):
                </strong>{" "}
                <span className="highlight-count">
                  {countObjectsInVideoRegion()}
                </span>
              </p>
              <p className="region-hint">
                💡 Drag the yellow box to count objects in different areas
              </p>
            </div>
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
