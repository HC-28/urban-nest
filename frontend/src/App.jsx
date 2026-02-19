import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import PropertyDetail from "./pages/PropertyDetail";
import PostProperty from "./pages/PostProperty";
import Agents from "./pages/Agents";
import AgentProfile from "./pages/AgentProfile";
import AgentChats from "./pages/AgentChats";
import BuyerChats from "./pages/BuyerChats";
import PropertyChat from "./pages/PropertyChat";
import Favorites from "./pages/Favorites";
import ProfilePage from "./pages/ProfilePage";
import BuyerPropertyChat from "./pages/BuyerPropertyChat";

// Leaflet CSS for maps
import "leaflet/dist/leaflet.css";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/post-property" element={<PostProperty />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/agent/chats" element={<AgentChats />} />
            <Route path="/chats" element={<BuyerChats />} />
            <Route path="/agent/chat/:propertyId/:buyerId" element={<PropertyChat />} />
            <Route path="/agent/:id" element={<AgentProfile />} />
            <Route path="/buyer/chat/:propertyId/:agentId" element={<BuyerPropertyChat />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/profile" element={<ProfilePage />} />
        </Routes>
    );
}

export default App;
