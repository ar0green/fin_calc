import { X } from "lucide-react";
import { useState } from "react";
import { Outlet } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <Sidebar className="hidden lg:block" />

        <div className="min-w-0 flex-1">
          <Header onMenuClick={() => setIsMobileMenuOpen(true)} />

          <main className="p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/40"
            onClick={closeMobileMenu}
          />

          <div className="absolute inset-y-0 left-0 flex max-w-full">
            <div className="relative w-72 bg-white shadow-xl">
              <div className="absolute right-3 top-3 z-10">
                <Button
                  variant="secondary"
                  className="h-9 px-3"
                  onClick={closeMobileMenu}
                  aria-label="Закрыть меню"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <Sidebar
                className="block w-72 border-r-0"
                onNavigate={closeMobileMenu}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}