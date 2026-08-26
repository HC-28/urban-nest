import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";
import 'leaflet/dist/leaflet.css';

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      {/* ThemeProvider must wrap everything so ThemeContext is available globally */}
      <ThemeProvider>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID}>
          <HelmetProvider>
            <BrowserRouter>
              <App />
              {/*
                Toaster: styles use CSS custom properties so they
                automatically adapt to light / dark theme.
              */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    boxShadow: 'var(--shadow-lg)',
                  },
                  success: {
                    iconTheme: {
                      primary: '#22c55e',
                      secondary: 'var(--bg-tertiary)',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: 'var(--bg-tertiary)',
                    },
                  },
                }}
              />
            </BrowserRouter>
          </HelmetProvider>
        </GoogleOAuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
