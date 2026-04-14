import React, { Suspense, lazy } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AnimatePresence, motion } from "framer-motion";
import BackToTop from "./components/layout/BackToTop";
import { CompareProvider } from "./context/CompareContext";
import CompareActionBanner from "./components/ui/CompareActionBanner";
import CompareModal from "./components/ui/CompareModal";
import { SearchProvider } from "./context/SearchContext";

// Leaflet CSS for maps
import "leaflet/dist/leaflet.css";

// Lazy-loaded components for Code Splitting
const Home = lazy(() => import("./pages/static/Home"));
const Signup = lazy(() => import("./pages/auth/Signup"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const VerifyEmail = lazy(() => import("./pages/auth/VerifyEmail"));
const Login = lazy(() => import("./pages/auth/Login"));
const Dashboard = lazy(() => import("./pages/user/Dashboard"));
const Properties = lazy(() => import("./pages/property/Properties"));
const Buy = lazy(() => import("./pages/property/Buy"));
const Rent = lazy(() => import("./pages/property/Rent"));
const Projects = lazy(() => import("./pages/property/Projects"));
const PropertyDetail = lazy(() => import("./pages/property/PropertyDetail"));
const PostProperty = lazy(() => import("./pages/property/PostProperty"));
const Agents = lazy(() => import("./pages/directory/Agents"));
const Agencies = lazy(() => import("./pages/directory/Agencies"));
const AgentProfile = lazy(() => import("./pages/directory/AgentProfile"));
const AgentChats = lazy(() => import("./pages/chat/AgentChats"));
const BuyerChats = lazy(() => import("./pages/chat/BuyerChats"));
const PropertyChat = lazy(() => import("./pages/chat/PropertyChat"));
const Favorites = lazy(() => import("./pages/user/Favorites"));
const Profile = lazy(() => import("./pages/user/Profile"));
const BuyerPropertyChat = lazy(() => import("./pages/chat/BuyerPropertyChat"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const About = lazy(() => import("./pages/static/About"));
const Contact = lazy(() => import("./pages/static/Contact"));
const Terms = lazy(() => import("./pages/static/Terms"));
const Privacy = lazy(() => import("./pages/static/Privacy"));
const NotFound = lazy(() => import("./pages/static/NotFound"));

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
        <SearchProvider>
            <CompareProvider>
                <BackToTop />
                <AnimatePresence mode="wait">
                    <Suspense fallback={<GlobalLoader />}>
                        <Routes location={location} key={location.pathname}>
                            <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
                            <Route path="/signup" element={<PageWrapper><Signup /></PageWrapper>} />
                            <Route path="/forgot-password" element={<PageWrapper><ForgotPassword /></PageWrapper>} />
                            <Route path="/verify-email" element={<PageWrapper><VerifyEmail /></PageWrapper>} />
                            <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
                            <Route path="/dashboard" element={<PageWrapper><ProtectedRoute><Dashboard /></ProtectedRoute></PageWrapper>} />
                            <Route path="/properties" element={<PageWrapper><Properties /></PageWrapper>} />
                            <Route path="/buy" element={<PageWrapper><Buy /></PageWrapper>} />
                            <Route path="/rent" element={<PageWrapper><Rent /></PageWrapper>} />
                            <Route path="/projects" element={<PageWrapper><Projects /></PageWrapper>} />
                            <Route path="/property/:id" element={<PageWrapper><PropertyDetail /></PageWrapper>} />
                            <Route path="/post-property" element={<PageWrapper><ProtectedRoute><PostProperty /></ProtectedRoute></PageWrapper>} />
                            <Route path="/agents" element={<PageWrapper><Agents /></PageWrapper>} />
                            <Route path="/agencies" element={<PageWrapper><Agencies /></PageWrapper>} />
                            <Route path="/agent/chats" element={<PageWrapper><ProtectedRoute><AgentChats /></ProtectedRoute></PageWrapper>} />
                            <Route path="/chats" element={<PageWrapper><ProtectedRoute><BuyerChats /></ProtectedRoute></PageWrapper>} />
                            <Route path="/agent/chat/:propertyId/:buyerId" element={<PageWrapper><ProtectedRoute><PropertyChat /></ProtectedRoute></PageWrapper>} />
                            <Route path="/agent/:id" element={<PageWrapper><AgentProfile /></PageWrapper>} />
                            <Route path="/buyer/chat/:propertyId/:agentId" element={<PageWrapper><ProtectedRoute><BuyerPropertyChat /></ProtectedRoute></PageWrapper>} />
                            <Route path="/favorites" element={<PageWrapper><ProtectedRoute><Favorites /></ProtectedRoute></PageWrapper>} />
                            <Route path="/profile" element={<PageWrapper><ProtectedRoute><Profile /></ProtectedRoute></PageWrapper>} />
                            <Route path="/admin" element={<PageWrapper><ProtectedRoute><AdminDashboard /></ProtectedRoute></PageWrapper>} />
                            <Route path="/about" element={<PageWrapper><About /></PageWrapper>} />
                            <Route path="/contact" element={<PageWrapper><Contact /></PageWrapper>} />
                            <Route path="/terms" element={<PageWrapper><Terms /></PageWrapper>} />
                            <Route path="/privacy" element={<PageWrapper><Privacy /></PageWrapper>} />
                            <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
                        </Routes>
                    </Suspense>
                </AnimatePresence>
                <CompareActionBanner />
                <CompareModal />
            </CompareProvider>
        </SearchProvider>
    );
}

export default App;

