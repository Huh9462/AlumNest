import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import Nav from "@/components/Nav";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Alumni from "@/pages/Alumni";
import AluPal from "@/pages/AluPal";
import Leaderboard from "@/pages/Leaderboard";
import Certificate from "@/pages/Certificate";
import Chat from "@/pages/Chat";
import FavouritesReminder from "@/components/FavouritesReminder";

export default function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Nav />
          <FavouritesReminder />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/alumni" element={<Alumni />} />
            <Route path="/alupal" element={<AluPal />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/certificate" element={<Certificate />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:userId" element={<Chat />} />
          </Routes>
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}
