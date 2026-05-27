import { Button } from "@/components/ui/Button";
import { useCurrentUser, useLogout } from "@/features/auth/useAuth";

export function Header() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <h1 className="text-base font-semibold text-slate-950">Личные финансы</h1>
        <p className="text-sm text-slate-500">MVP финансового калькулятора</p>
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