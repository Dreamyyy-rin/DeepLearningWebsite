import React from "react";
import "./Results.css"; 

const Results = ({ data }) => {
 
  if (!data) {
    return null;
  }

  const { detections, annotated_image, model_used } = data;

  return (
    <div className="results-container">
      <div className="results-summary">
        <h3>Detection Results</h3>

        <div className="results-info">
          <p>
            <strong>Model Used:</strong>{" "}
            <span className="highlight-text">{model_used}</span>
          </p>
          <p>
            <strong>Detections Found:</strong>{" "}
            <span className="highlight-text">{detections.length}</span>
          </p>
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

        {detections.length > 0 ? (
          <div className="detections-list">
            <h4>Detected Objects:</h4>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Confidence</th>
                    <th>Bounding Box</th>
                  </tr>
                </thead>
                <tbody>
                  {detections.map((det, index) => (
                    <tr key={index}>
                      <td>
                        <span className="badge">{det.label}</span>
                      </td>
                      <td>{(det.confidence * 100).toFixed(1)}%</td>
                      <td className="mono-font">
                        [{det.bbox.map((v) => v.toFixed(0)).join(", ")}]
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="no-data">No objects detected in the image.</p>
        )}
      </div>
    </div>
  );
};

export default Results;
