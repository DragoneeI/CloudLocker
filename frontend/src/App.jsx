import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Kiosk from "./pages/Kiosk";


function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                <Route path="/dashboard" element={<Dashboard />} />

                <Route path="/kiosk" element={<Kiosk />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
