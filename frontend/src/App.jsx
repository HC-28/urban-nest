import { Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";

import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import PropertyDetail from "./pages/PropertyDetail";
import PostProperty from "./pages/PostProperty";
import Agents from "./pages/Agents";

// ✅ Chat pages (already imported)
import AgentChats from "./pages/AgentChats";
import PropertyChat from "./pages/PropertyChat";

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route path="/post-property" element={<PostProperty />} />
        <Route path="/agents" element={<Agents />} />

        {/* ✅ ADD THESE TWO LINES */}
        <Route path="/agent/chats" element={<AgentChats />} />
        <Route path="/agent/chat/:propertyId/:buyerId" element={<PropertyChat />} />
      </Routes>
    </>
  );
}

export default App;
