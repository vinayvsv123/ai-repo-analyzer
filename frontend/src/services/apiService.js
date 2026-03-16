import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const analyzeRepository = async (repoUrl, socketId) => {
    try {
        const response = await axios.post(`${API_URL}/repo/analyze`, { repoUrl, socketId });
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || error.message || 'An error occurred during analysis';
    }
};
