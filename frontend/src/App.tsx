import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Dashboard } from "@/pages/Dashboard";
import { Projects } from "@/pages/Projects";
import { Tasks } from "@/pages/Tasks";
import { Clients } from "@/pages/Clients";
import { ClientDetails } from "@/pages/ClientDetails";
import { Leads } from "@/pages/Leads";
import { ProjectBriefs } from "@/pages/ProjectBriefs";
import { NotFound } from "@/pages/NotFound";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "projects", element: <Projects /> },
      { path: "tasks", element: <Tasks /> },
      { path: "clients", element: <Clients /> },
      { path: "clients/:id", element: <ClientDetails /> },
      { path: "leads", element: <Leads /> },
      { path: "project-briefs", element: <ProjectBriefs /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
