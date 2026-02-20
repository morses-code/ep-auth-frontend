import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type AuthContextValue = {
  isAuthenticated: boolean;
  token: string | null;
  setToken: (value: string | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

const getTokenExpiryTime = (token: string) => {
  const tokenParts = token.split(".");

  if (tokenParts.length !== 3) {
    return null;
  }

  try {
    const payload = tokenParts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(tokenParts[1].length / 4) * 4, "=");

    const decodedPayload = JSON.parse(atob(payload)) as { exp?: number };

    if (
      typeof decodedPayload.exp !== "number" ||
      !Number.isFinite(decodedPayload.exp)
    ) {
      return null;
    }

    return decodedPayload.exp * 1000;
  } catch {
    return null;
  }
};

const isJwtToken = (token: string) => token.split(".").length === 3;

const isTokenExpired = (token: string) => {
  if (!isJwtToken(token)) {
    return false;
  }

  const expiryTime = getTokenExpiryTime(token);
  if (expiryTime == null) {
    return true;
  }

  return Date.now() >= expiryTime;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [token, setTokenState] = useState<string | null>(null);

  useEffect(() => {
    localStorage.removeItem("authToken");
  }, []);

  const setToken = (value: string | null) => {
    if (value) {
      if (isTokenExpired(value)) {
        setTokenState(null);
        return;
      }
    }

    setTokenState(value);
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(token),
        token,
        setToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
