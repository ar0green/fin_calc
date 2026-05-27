import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { login } from "@/features/auth/auth.api";
import { hasAccessToken, setAccessToken } from "@/features/auth/auth.storage";

const loginSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(1, "Введите пароль")
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@example.com",
      password: "admin123"
    }
  });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAccessToken(data.access_token);
      navigate("/");
    }
  });

  if (hasAccessToken()) {
    return <Navigate to="/" replace />;
  }

  const errorMessage =
    mutation.error instanceof AxiosError
      ? mutation.error.response?.data?.detail ?? "Ошибка авторизации"
      : "Ошибка авторизации";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-md">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-950">Вход</h1>
          <p className="mt-1 text-sm text-slate-500">
            Войди в финансовый калькулятор
          </p>
        </div>

        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
        >
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />

          <Input
            label="Пароль"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />

          {mutation.isError ? (
            <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Входим..." : "Войти"}
          </Button>
        </form>
      </Card>
    </div>
  );
}