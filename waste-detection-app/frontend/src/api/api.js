import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const predictWaste = async (imageFile, modelName = 'YoloV11s', confidence = 0.25) => {
    try {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('model', modelName);
        formData.append('conf', confidence);

        const response = await axios.post(`${API_URL}/predict`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error during prediction:', error);
        throw error;
    }
};

export const listModels = async () => {
    try {
        const response = await axios.get(`${API_URL}/models`);
        return response.data;
    } catch (error) {
        console.error('Error fetching models:', error);
        throw error;
    }
};