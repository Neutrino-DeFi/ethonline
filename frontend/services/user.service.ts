import axios from "axios";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

export const registerUser = async (walletId: string, walletAddress: string) => {
  try {
    const payload = {
      uniqueWalletId: walletId,
      walletAddress: walletAddress,
    };

    const response = await axios.post(
      `${API_BASE_URL}/api/v1/user/register`,
      payload
    );

    return response.data;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};

export const getUserDetails = async (walletId: string) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/user/${walletId}`
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching user details:", error);
    throw error;
  }
};
