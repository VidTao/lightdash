import { useState } from "react";
import { authService } from "../services/auth.service";

export const useEmailLogin = (onSuccess: () => void) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await authService.signInWithEmail(email, password);
      // onSuccess();
    } catch (error: any) {
      setError(error.message);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    setError,
    handleSubmit,
  };
};
