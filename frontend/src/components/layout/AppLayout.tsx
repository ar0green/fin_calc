import { Outlet } from "react-router-dom";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <Header />

          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}