import {
  Alert,
  Box,
  Button,
  Snackbar,
  Typography,
  type AlertColor,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import Registration from "./components/Registration";

function App() {
  const { isAuthenticated, token, logout } = useAuth();
  const [protectedResponse, setProtectedResponse] = useState<string>("");
  const [showSnackBar, setShowSnackBar] = useState(false);
  const [snackBarMessage, setSnackBarMessage] = useState("");
  const [snackBarSeverity, setSnackBarSeverity] =
    useState<AlertColor>("success");

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const successMessage = sessionStorage.getItem("postAuthSuccessMessage");
    if (!successMessage) {
      return;
    }

    setSnackBarMessage(successMessage);
    setSnackBarSeverity("success");
    setShowSnackBar(true);
    sessionStorage.removeItem("postAuthSuccessMessage");
  }, [isAuthenticated]);

  const callProtectedEndpoint = async () => {
    if (!token) {
      setProtectedResponse("No token available. Please login first.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/protected", {
        method: "GET",
        headers: {
          Authorization: `${token}`,
        },
      });

      const bodyText = await response.text();

      if (!response.ok) {
        const errorText = bodyText || "Request failed";

        if (response.status === 401) {
          logout();
          setProtectedResponse("Session expired. Please login again.");
          return;
        }

        setProtectedResponse(`Error ${response.status}: ${errorText}`);
        return;
      }

      setProtectedResponse(
        `Success ${response.status}: ${bodyText || "No content"}`,
      );
    } catch (error) {
      console.error("Protected endpoint request failed:", error);
      setProtectedResponse(
        "Request failed. Check backend availability/CORS in browser console.",
      );
    }
  };

  return (
    <Box sx={{ flexGrow: 1, padding: 2 }}>
      <Typography variant="h3" align="center" gutterBottom>
        Welcome to the Registration App
      </Typography>

      {isAuthenticated ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography variant="h5" align="center" gutterBottom>
            You are logged in!
          </Typography>
          <Button variant="contained" onClick={callProtectedEndpoint}>
            Test Protected Endpoint
          </Button>
          <Button variant="outlined" onClick={logout}>
            Logout
          </Button>
          {protectedResponse ? (
            <Typography variant="body1" align="center">
              {protectedResponse}
            </Typography>
          ) : null}
        </Box>
      ) : (
        <Registration />
      )}
      <Snackbar
        open={showSnackBar}
        autoHideDuration={4000}
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
}

export default App;
