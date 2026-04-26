import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AssistantPage from "./pages/AssistantPage";
import Dashboard from "./pages/Dashboard";
import ForecastPage from "./pages/ForecastPage";
import InsightsPage from "./pages/InsightsPage";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import ReportPage from "./pages/ReportPage";
import Records from "./pages/Records";
import Register from "./pages/Register";
import Settings from "./pages/Settings";
import Team from "./pages/Team";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/forecast" element={<ForecastPage />} />
        <Route path="/records" element={<Records />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/team" element={<Team />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
