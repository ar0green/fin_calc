import { Menu } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useCurrentUser, useLogout } from "@/features/auth/useAuth";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          className="h-9 px-3 lg:hidden"
          onClick={onMenuClick}
          aria-label="Открыть меню"
        >
          <Menu className="h-4 w-4" />
        </Button>

        <div>
          <h1 className="text-base font-semibold text-slate-950">Личные финансы</h1>
          <p className="hidden text-sm text-slate-500 sm:block">
            MVP финансового калькулятора
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden text-right sm:block">
          <div className="text-sm font-medium text-slate-900">
            {user?.email ?? "Пользователь"}
          </div>
          <div className="text-xs text-slate-500">Авторизован</div>
        </div>

        <Button variant="secondary" onClick={logout}>
          Выйти
        </Button>
      </div>
    </header>
  );
}