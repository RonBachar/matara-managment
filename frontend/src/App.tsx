import type { ReactNode } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { FullscreenSpinner, useAuth } from "@/context/AuthContext";
import { Dashboard } from "@/pages/Dashboard";
import { Projects } from "@/pages/Projects";
import { ProjectDetails } from "@/pages/ProjectDetails";
import { Tasks } from "@/pages/Tasks";
import { Clients } from "@/pages/Clients";
import { ClientDetails } from "@/pages/ClientDetails";
import { Leads } from "@/pages/Leads";
import { Login } from "@/pages/Login";
import { NotFound } from "@/pages/NotFound";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullscreenSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "projects", element: <Projects /> },
      { path: "projects/:id", element: <ProjectDetails /> },
      { path: "tasks", element: <Tasks /> },
      { path: "clients", element: <Clients /> },
      { path: "clients/:id", element: <ClientDetails /> },
      { path: "leads", element: <Leads /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
