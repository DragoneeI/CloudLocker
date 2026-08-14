import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Kiosk from "./pages/Kiosk";
import Lockers from "./pages/Lockers";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/lockers" replace />} />

                <Route path="/dashboard" element={<Dashboard />} />

                <Route path="/lockers" element={<Lockers />} />

                <Route path="/kiosk" element={<Kiosk />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
