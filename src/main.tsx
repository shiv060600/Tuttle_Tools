
  import { createRoot } from "react-dom/client";
  import { BrowserRouter } from 'react-router-dom'
  import { AuthProvider } from "./contexts/AuthContext.tsx";
  import App from "./App.tsx";
  import "./index.css";
  import "./styles/tailwind-extensions.css";

  createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
  
  );
  