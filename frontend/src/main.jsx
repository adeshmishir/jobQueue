import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { JobsProvider } from "./context/JobsContext";
import ErrorBoundary from "./components/ErrorBoundary";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <JobsProvider>
          <App />
        </JobsProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);