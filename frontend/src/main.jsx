import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { Toaster } from "react-hot-toast";
import { HelmetProvider } from "react-helmet-async";
import "./index.css"; // Global styles
import 'leaflet/dist/leaflet.css';
import { GoogleOAuthProvider } from "@react-oauth/google";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <GoogleOAuthProvider clientId="4343419613-392i840ouh0v3g1fmvq22v1cjm7dp85i.apps.googleusercontent.com">
          <BrowserRouter>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#1e293b',
                  color: '#f1f5f9',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                },
                success: { iconTheme: { primary: '#22c55e', secondary: '#1e293b' } },
                error: { iconTheme: { primary: '#ef4444', secondary: '#1e293b' } },
              }}
            />
          </BrowserRouter>
        </GoogleOAuthProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
