import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { FinanceProvider } from "@/hooks/useFinance";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const Dashboard = lazy(() => import("./pages/app/Dashboard"));
const Income = lazy(() => import("./pages/app/Income"));
const Expenses = lazy(() => import("./pages/app/Expenses"));
const Transactions = lazy(() => import("./pages/app/Transactions"));
const Reports = lazy(() => import("./pages/app/Reports"));
const Budget = lazy(() => import("./pages/app/Budget"));
const Alerts = lazy(() => import("./pages/app/Alerts"));
const ExportImport = lazy(() => import("./pages/app/ExportImport"));
const Settings = lazy(() => import("./pages/app/Settings"));

const PageFallback = () => (
  <div className="flex items-center justify-center py-24">
    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="/auth" element={<Navigate to="/" replace />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <FinanceProvider>
                    <AppLayout />
                  </FinanceProvider>
                </ProtectedRoute>
              }
            >
              <Route index element={<Suspense fallback={<PageFallback />}><Dashboard /></Suspense>} />
              <Route path="income" element={<Suspense fallback={<PageFallback />}><Income /></Suspense>} />
              <Route path="expenses" element={<Suspense fallback={<PageFallback />}><Expenses /></Suspense>} />
              <Route path="transactions" element={<Suspense fallback={<PageFallback />}><Transactions /></Suspense>} />
              <Route path="reports" element={<Suspense fallback={<PageFallback />}><Reports /></Suspense>} />
              <Route path="budget" element={<Suspense fallback={<PageFallback />}><Budget /></Suspense>} />
              <Route path="alerts" element={<Suspense fallback={<PageFallback />}><Alerts /></Suspense>} />
              <Route path="export" element={<Suspense fallback={<PageFallback />}><ExportImport /></Suspense>} />
              <Route path="settings" element={<Suspense fallback={<PageFallback />}><Settings /></Suspense>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
