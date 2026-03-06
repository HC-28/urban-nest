import React, { Suspense, lazy } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AnimatePresence, motion } from "framer-motion";
import ScrollToTop from "./components/ScrollToTop";
import BackToTop from "./components/BackToTop";
import { CompareProvider } from "./context/CompareContext";
import CompareActionBanner from "./components/CompareActionBanner";
import CompareModal from "./components/CompareModal";

// Leaflet CSS for maps
import "leaflet/dist/leaflet.css";

// Lazy-loaded components for Code Splitting
const Home = lazy(() => import("./pages/Home"));
const Signup = lazy(() => import("./pages/Signup"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Properties = lazy(() => import("./pages/Properties"));
const PropertyDetail = lazy(() => import("./pages/PropertyDetail"));
const PostProperty = lazy(() => import("./pages/PostProperty"));
const Agents = lazy(() => import("./pages/Agents"));
const AgentProfile = lazy(() => import("./pages/AgentProfile"));
const AgentChats = lazy(() => import("./pages/AgentChats"));
const BuyerChats = lazy(() => import("./pages/BuyerChats"));
const PropertyChat = lazy(() => import("./pages/PropertyChat"));
const Favorites = lazy(() => import("./pages/Favorites"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const BuyerPropertyChat = lazy(() => import("./pages/BuyerPropertyChat"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Page Transition Wrapper
const PageWrapper = ({ children }) => (
    <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
    >
        {children}
    </motion.div>
);

// Fallback loader for Suspense
const GlobalLoader = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a' }}>
        <div className="loader" style={{ width: '50px', height: '50px', border: '3px solid rgba(59, 130, 246, 0.2)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
);

// Protected Route - redirects to /login if not authenticated
const ProtectedRoute = ({ children }) => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) return <Navigate to="/login" replace />;
    return children;
};

function App() {
    const location = useLocation();

    return (
        <HelmetProvider>
            <CompareProvider>
                <ScrollToTop />
                <BackToTop />
                <AnimatePresence mode="wait">
                    <Suspense fallback={<GlobalLoader />}>
                        <Routes location={location} key={location.pathname}>
                            <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
                            <Route path="/signup" element={<PageWrapper><Signup /></PageWrapper>} />
                            <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
                            <Route path="/dashboard" element={<PageWrapper><ProtectedRoute><Dashboard /></ProtectedRoute></PageWrapper>} />
                            <Route path="/properties" element={<PageWrapper><Properties /></PageWrapper>} />
                            <Route path="/property/:id" element={<PageWrapper><PropertyDetail /></PageWrapper>} />
                            <Route path="/post-property" element={<PageWrapper><ProtectedRoute><PostProperty /></ProtectedRoute></PageWrapper>} />
                            <Route path="/agents" element={<PageWrapper><Agents /></PageWrapper>} />
                            <Route path="/agent/chats" element={<PageWrapper><ProtectedRoute><AgentChats /></ProtectedRoute></PageWrapper>} />
                            <Route path="/chats" element={<PageWrapper><ProtectedRoute><BuyerChats /></ProtectedRoute></PageWrapper>} />
                            <Route path="/agent/chat/:propertyId/:buyerId" element={<PageWrapper><ProtectedRoute><PropertyChat /></ProtectedRoute></PageWrapper>} />
                            <Route path="/agent/:id" element={<PageWrapper><AgentProfile /></PageWrapper>} />
                            <Route path="/buyer/chat/:propertyId/:agentId" element={<PageWrapper><ProtectedRoute><BuyerPropertyChat /></ProtectedRoute></PageWrapper>} />
                            <Route path="/favorites" element={<PageWrapper><ProtectedRoute><Favorites /></ProtectedRoute></PageWrapper>} />
                            <Route path="/profile" element={<PageWrapper><ProtectedRoute><ProfilePage /></ProtectedRoute></PageWrapper>} />
                            <Route path="/admin" element={<PageWrapper><ProtectedRoute><AdminDashboard /></ProtectedRoute></PageWrapper>} />
                            <Route path="/about" element={<PageWrapper><AboutPage /></PageWrapper>} />
                            <Route path="/contact" element={<PageWrapper><ContactPage /></PageWrapper>} />
                            <Route path="/terms" element={<PageWrapper><TermsPage /></PageWrapper>} />
                            <Route path="/privacy" element={<PageWrapper><PrivacyPage /></PageWrapper>} />
                            <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
                        </Routes>
                    </Suspense>
                </AnimatePresence>
                <CompareActionBanner />
                <CompareModal />
            </CompareProvider>
        </HelmetProvider>
    );
}

export default App;
