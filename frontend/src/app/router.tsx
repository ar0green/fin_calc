import { Navigate, createBrowserRouter } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import { hasAccessToken } from "@/features/auth/auth.storage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { DebtsPage } from "@/pages/DebtsPage";
import { ExpensesPage } from "@/pages/ExpensesPage";
import { IncomesPage } from "@/pages/IncomesPage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ScenariosPage } from "@/pages/ScenariosPage";
import { PlanningPage } from "@/pages/PlanningPage";
import { DebtPaymentsPage } from "@/pages/DebtPaymentsPage";
import { BudgetsPage } from "@/pages/BudgetsPage";

function ProtectedRoute() {
  if (!hasAccessToken()) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
}

function PublicOnlyRoute({ children }: { children: JSX.Element }) {
  if (hasAccessToken()) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "planning",
        element: <PlanningPage />,
      },
      {
        path: "budgets",
        element: <BudgetsPage />
      },
      {
        path: "incomes",
        element: <IncomesPage />,
      },
      {
        path: "expenses",
        element: <ExpensesPage />,
      },
      {
        path: "debts",
        element: <DebtsPage />,
      },
      {
        path: "debt-payments",
        element: <DebtPaymentsPage />,
      },
      {
        path: "analytics",
        element: <AnalyticsPage />,
      },
      {
        path: "scenarios",
        element: <ScenariosPage />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
