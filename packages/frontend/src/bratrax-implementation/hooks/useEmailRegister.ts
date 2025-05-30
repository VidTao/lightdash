import { useState } from "react";
import { authService } from "../services/auth.service";
import { apiService } from "../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


export const useEmailRegister = (onSuccess: () => void) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { fetchApplicationUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const { userId, isNewUser } = await authService.registerWithEmail(
        email,
        password
      );
      if (isNewUser) {
        await apiService.registerApplicationUser(userId, email, name);
        fetchApplicationUser();
        navigate("/register-client");
      }
      else {
        fetchApplicationUser();
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  return {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    setError,
    handleSubmit,
  };
};
