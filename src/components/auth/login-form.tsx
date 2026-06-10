"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useLogin } from "@/lib/hooks/useAuth";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { cn } from "@/lib/utils/cn";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });
  const login = useLogin();

  const onSubmit = (values: LoginInput) => login.mutate(values);

  return (
    <div className="w-full max-w-[416px] rounded-lg border border-[#ebedf1] bg-white p-10 text-[#3b5374] shadow-[0px_8px_8px_rgb(0_0_0/0.15)]">
      <h1 className="mb-10 text-center font-suse text-[28px] font-bold leading-[1.2] text-[#00204a]">
        Log in
      </h1>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <SocialAuthButtons />
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-[#ebedf1]" />
            <span className="font-open-sans text-base text-[#3b5374]">OR</span>
            <div className="h-px flex-1 bg-[#ebedf1]" />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="username"
                className="mb-1 block font-open-sans text-sm font-medium text-[#3b5374]"
              >
                Email or Username
              </label>
              <input
                id="username"
                autoComplete="username"
                autoFocus
                placeholder="you@example.com"
                className={cn(
                  "w-full rounded border border-[#ced4da] bg-white px-3.5 py-[7px] font-open-sans text-base text-[#3b5374] placeholder:text-[#6c757d] focus:border-[#9e6f21] focus:outline-none focus:ring-2 focus:ring-[#9e6f21]/30",
                  errors.username && "border-red-500",
                )}
                {...register("username")}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
              )}
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="font-open-sans text-sm font-medium text-[#3b5374]"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="font-open-sans text-xs text-[#9e6f21] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Password"
                  className={cn(
                    "w-full rounded border border-[#ced4da] bg-white px-3.5 py-[7px] pr-10 font-open-sans text-base text-[#3b5374] placeholder:text-[#6c757d] focus:border-[#9e6f21] focus:outline-none focus:ring-2 focus:ring-[#9e6f21]/30",
                    errors.password && "border-red-500",
                  )}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6c757d] hover:text-[#3b5374]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={login.isPending}
            className="flex h-10 w-full items-center justify-center gap-2 rounded border border-[#9e6f21] bg-[#9e6f21] font-open-sans text-base text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {login.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Log in
          </button>
        </form>
      </div>

      <p className="mt-8 text-center font-open-sans text-base text-[#3b5374]">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-bold text-[#9e6f21] underline">
          Register
        </Link>
      </p>
    </div>
  );
}
