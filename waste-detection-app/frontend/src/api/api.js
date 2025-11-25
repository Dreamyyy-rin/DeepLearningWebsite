import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const predictWaste = async (
  imageFile,
  modelName = "YoloV11s",
  confidence = 0.25
) => {
  try {
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("model", modelName);
    formData.append("conf", confidence);

    const response = await axios.post(`${API_URL}/predict`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error during prediction:", error);
    throw error;
  }
};

export const predictWasteVideo = async (
  videoFile,
  modelName = "YoloV11s",
  confidence = 0.25
) => {
  try {
    const formData = new FormData();
    formData.append("video", videoFile);
    formData.append("model", modelName);
    formData.append("conf", confidence);

    console.log("Sending video for inference...", {
      filename: videoFile.name,
      size: videoFile.size,
      model: modelName,
      confidence: confidence,
    });

    const response = await axios.post(`${API_URL}/predict-video`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 600000,
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        console.log("Upload progress:", percentCompleted + "%");
      },
    });

    console.log("Video inference response received");
    return response.data;
  } catch (error) {
    console.error("Error during video prediction:", error);
    if (error.response) {
      console.error("Response error:", error.response.data);
    }
    throw error;
  }
};

export const listModels = async () => {
  try {
    const response = await axios.get(`${API_URL}/models`);
    return response.data;
  } catch (error) {
    console.error("Error fetching models:", error);
    throw error;
  }
};
