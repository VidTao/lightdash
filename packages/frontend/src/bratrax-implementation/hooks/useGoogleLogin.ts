import { authService } from "../services/auth.service";
import { useState } from "react";
import { apiService } from "../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export const useGoogleLogin = () => {
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();
  const { fetchApplicationUser } = useAuth();
  const signIn = async () => {
    try {
      const { userId, email, name, isNewUser } = await authService.signInWithGoogle();
      if (isNewUser) {
        await apiService.registerApplicationUser(userId, email, name);
        fetchApplicationUser();
        navigate("/register-client");
      }
      else {
        fetchApplicationUser();
      }
      setError("");
    } catch (error: any) {
      setError(error.message);
    }
  };

  return { signIn, error };
};
