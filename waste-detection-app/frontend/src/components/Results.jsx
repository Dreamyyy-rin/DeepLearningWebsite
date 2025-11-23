import React from 'react';

const Results = ({ data }) => {
    if (!data) {
        return null;
    }

    const { detections, annotated_image, model_used } = data;

    return (
        <div className="results-container">
            <h2>Detection Results</h2>
            
            <div className="results-info">
                <p><strong>Model Used:</strong> {model_used}</p>
                <p><strong>Detections Found:</strong> {detections.length}</p>
            </div>

            {annotated_image && (
                <div className="image-container">
                    <h3>Annotated Image:</h3>
                    <img src={annotated_image} alt="Annotated detection result" />
                </div>
            )}

            {detections.length > 0 ? (
                <div className="detections-list">
                    <h3>Detected Objects:</h3>
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
                                    <td>{det.label}</td>
                                    <td>{(det.confidence * 100).toFixed(1)}%</td>
                                    <td>
                                        [{det.bbox.map(v => v.toFixed(0)).join(', ')}]
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p>No objects detected in the image.</p>
            )}
        </div>
    );
};

export default Results;