import { useCallback, useState } from "react";
import { loginApi } from "../services/authApi";

export function useLoginViewModel() {
  const [mobile, setMobileState] = useState("");
  const [password, setPasswordState] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setMobile = useCallback((v: string) => {
    setMobileState(v);
  }, []);

  const setPassword = useCallback((v: string) => {
    setPasswordState(v);
  }, []);

  const login = useCallback(async () => {
    setError("");
    setLoading(true);

    try {
      return await loginApi({ mobile, password });
    } catch (e: any) {
      const msg = e?.message || "Login failed";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [mobile, password]);

  return {
    mobile,
    setMobile,
    password,
    setPassword,
    loading,
    error,
    login,
  };
}