import axios from "axios";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000/";

export const getAllAgents = async () => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/agents`
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching all agents:", error);
    throw error;
  }
};
