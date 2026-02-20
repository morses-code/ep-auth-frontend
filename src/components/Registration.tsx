import {
  Alert,
  Box,
  Button,
  FormControl,
  Snackbar,
  TextField,
  type AlertColor,
} from "@mui/material";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

type RegistrationType = "customer" | "tradesperson" | null;

type RegistrationProps = {
  username: string;
  password: string;
  confirmPassword: string;
};

type AuthResponse = {
  token?: string;
  accessToken?: string;
  jwt?: string;
  message?: string;
};

type ApiResponse = {
  ok: boolean;
  status: number;
  data: unknown;
};

const API_BASE_URL = "http://localhost:8080";

const extractToken = (data: unknown) => {
  if (!data || typeof data !== "object") {
    return undefined;
  }

  const authData = data as AuthResponse;
  return authData.token ?? authData.accessToken ?? authData.jwt;
};

const getErrorMessage = (data: unknown, fallback: string) => {
  if (!data) {
    return fallback;
  }

  if (typeof data === "string") {
    return data;
  }

  if (
    typeof data === "object" &&
    typeof (data as AuthResponse).message === "string"
  ) {
    return (data as AuthResponse).message as string;
  }

  return fallback;
};

const parseResponseBody = async (response: Response) => {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const postJson = async (
  path: string,
  payload: object,
): Promise<ApiResponse> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await parseResponseBody(response);

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
};

const validateRegistrationData = (
  data: RegistrationProps,
  registrationType: RegistrationType,
) => {
  const { username, password, confirmPassword } = data;

  if (!username || !password || !confirmPassword) {
    return "Please fill in all fields!";
  }

  if (password !== confirmPassword) {
    return "Passwords do not match!";
  }

  if (!registrationType) {
    return "Please select a registration type.";
  }

  return null;
};

const CustomerRegistration = ({
  onSelect,
}: {
  onSelect: (type: Exclude<RegistrationType, null>) => void;
}) => {
  return (
    <Button
      variant="contained"
      color="primary"
      onClick={() => onSelect("customer")}
    >
      Customer Registration
    </Button>
  );
};

const TradespersonRegistration = ({
  onSelect,
}: {
  onSelect: (type: Exclude<RegistrationType, null>) => void;
}) => {
  return (
    <Button
      variant="contained"
      color="secondary"
      onClick={() => onSelect("tradesperson")}
    >
      Tradesperson Registration
    </Button>
  );
};

const Registration = () => {
  const { setToken } = useAuth();
  const [registrationType, setRegistrationType] =
    useState<RegistrationType>(null);

  const [registrationData, setRegistrationData] = useState<RegistrationProps>({
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [showSnackBar, setShowSnackBar] = useState(false);
  const [snackBarMessage, setSnackBarMessage] = useState("");
  const [snackBarSeverity, setSnackBarSeverity] = useState<AlertColor>("info");

  const setPostAuthSuccessMessage = (message: string) => {
    sessionStorage.setItem("postAuthSuccessMessage", message);
  };

  const openSnackBar = (message: string, severity: AlertColor = "info") => {
    setSnackBarMessage(message);
    setSnackBarSeverity(severity);
    setShowSnackBar(true);
  };

  const onClickHandler = (type: Exclude<RegistrationType, null>) => {
    if (type !== registrationType) {
      setRegistrationData({
        username: "",
        password: "",
        confirmPassword: "",
      });
    }
    setRegistrationType(type);
  };

  const submitHandler = async () => {
    const { username, password } = registrationData;

    const validationError = validateRegistrationData(
      registrationData,
      registrationType,
    );
    if (validationError) {
      openSnackBar(validationError, "error");
      return;
    }

    const completeRegistrationMessage = `Registered as ${registrationType}!`;

    try {
      const registerResult = await postJson("/auth/register", {
        username,
        password,
        role: registrationType,
      });

      if (!registerResult.ok) {
        const errorMessage = getErrorMessage(
          registerResult.data,
          "Registration failed.",
        );
        openSnackBar(
          `${errorMessage} (status ${registerResult.status})`,
          "error",
        );
        return;
      }

      const registrationToken = extractToken(registerResult.data);
      if (registrationToken) {
        setPostAuthSuccessMessage(completeRegistrationMessage);
        setToken(registrationToken);
        return;
      }

      const loginResult = await postJson("/auth/login", {
        username,
        password,
      });

      if (!loginResult.ok) {
        const loginErrorMessage = getErrorMessage(
          loginResult.data,
          "Login failed after registration.",
        );
        console.error("Login failed after registration", {
          status: loginResult.status,
        });
        openSnackBar(
          `${loginErrorMessage} (status ${loginResult.status})`,
          "error",
        );
        return;
      }

      const token = extractToken(loginResult.data);

      if (!token) {
        openSnackBar(
          "Login succeeded, but no token was returned by the backend.",
          "error",
        );
        return;
      }

      setPostAuthSuccessMessage(completeRegistrationMessage);
      setToken(token);
    } catch (error) {
      console.error("Registration/login request failed:", error);
      openSnackBar(
        "Request failed. If the browser console shows a CORS error, enable CORS for your frontend origin on the backend.",
        "error",
      );
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Box sx={{ display: "flex", gap: 2 }}>
        <CustomerRegistration onSelect={onClickHandler} />
        <TradespersonRegistration onSelect={onClickHandler} />
      </Box>

      {registrationType === "customer" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
          <FormControl sx={{ gap: 1 }}>
            <TextField
              placeholder="Username"
              label="Username"
              onChange={(e) =>
                setRegistrationData({
                  ...registrationData,
                  username: e.target.value,
                })
              }
              value={registrationData.username}
            />
            <TextField
              placeholder="Password"
              label="Password"
              type="password"
              onChange={(e) =>
                setRegistrationData({
                  ...registrationData,
                  password: e.target.value,
                })
              }
              value={registrationData.password}
            />
            <TextField
              placeholder="Confirm Password"
              label="Confirm Password"
              type="password"
              onChange={(e) =>
                setRegistrationData({
                  ...registrationData,
                  confirmPassword: e.target.value,
                })
              }
              value={registrationData.confirmPassword}
            />
            <Button variant="contained" color="primary" onClick={submitHandler}>
              Submit
            </Button>
          </FormControl>
        </Box>
      )}

      {registrationType === "tradesperson" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
          <FormControl sx={{ gap: 1 }}>
            <TextField
              placeholder="Username"
              label="Username"
              onChange={(e) =>
                setRegistrationData({
                  ...registrationData,
                  username: e.target.value,
                })
              }
              value={registrationData.username}
            />
            <TextField
              placeholder="Password"
              label="Password"
              type="password"
              onChange={(e) =>
                setRegistrationData({
                  ...registrationData,
                  password: e.target.value,
                })
              }
              value={registrationData.password}
            />
            <TextField
              placeholder="Confirm Password"
              label="Confirm Password"
              type="password"
              onChange={(e) =>
                setRegistrationData({
                  ...registrationData,
                  confirmPassword: e.target.value,
                })
              }
              value={registrationData.confirmPassword}
            />
            <Button variant="contained" color="primary" onClick={submitHandler}>
              Submit
            </Button>
          </FormControl>
        </Box>
      )}
      <Snackbar
        open={showSnackBar}
        autoHideDuration={6000}
        onClose={() => setShowSnackBar(false)}
      >
        <Alert
          onClose={() => setShowSnackBar(false)}
          severity={snackBarSeverity}
          sx={{ width: "100%" }}
        >
          {snackBarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Registration;
