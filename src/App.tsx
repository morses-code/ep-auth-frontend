import { Typography } from "@mui/material";
import { useAuth } from "./contexts/AuthContext";

function App() {
  const {isAuthenticated} = useAuth();
  
  return (
    <Typography variant="h4" align="center" mt={4}>
      {isAuthenticated ? "Authenticated" : "Not Authenticated"}
    </Typography>
  );
}

export default App;
