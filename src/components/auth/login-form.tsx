"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useLogin } from "@/lib/hooks/useAuth";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { ENABLED_SOCIAL_PROVIDERS } from "@/lib/firebase/client";
import { ParsedHtml } from "@/components/ui/parsed-html";
import { FormField, FormInput } from "@/components/ui/form-field";

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

  const onSubmit = (values: LoginInput) => {
    login.reset();
    login.mutate(values);
  };

  return (
    <div className="border-neutral-30 w-full max-w-[416px] rounded-lg border bg-white p-10 text-neutral-500 shadow-[0px_8px_8px_rgb(0_0_0/0.15)]">
      <h1 className="font-suse mb-10 text-center text-[28px] leading-[1.2] font-bold text-neutral-900">
        Log in
      </h1>

      <div className="flex flex-col gap-6">
        {ENABLED_SOCIAL_PROVIDERS.length > 0 && (
          <div className="flex flex-col gap-4">
            <SocialAuthButtons />
            <div className="flex items-center gap-2">
              <div className="bg-neutral-30 h-px flex-1" />
              <span className="font-open-sans text-base text-neutral-500">OR</span>
              <div className="bg-neutral-30 h-px flex-1" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <FormField id="username" label="Email or Username" error={errors.username?.message}>
              <FormInput
                id="username"
                variant="auth"
                autoComplete="username"
                autoFocus
                placeholder="you@example.com"
                hasError={Boolean(errors.username)}
                {...register("username")}
              />
            </FormField>

            <FormField
              id="password"
              label="Password"
              labelExtra={
                <Link
                  href="/forgot-password"
                  className="font-open-sans text-secondary-500 text-xs hover:underline"
                >
                  Forgot password?
                </Link>
              }
              error={errors.password?.message}
            >
              <div className="relative">
                <FormInput
                  id="password"
                  variant="auth"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Password"
                  hasError={Boolean(errors.password)}
                  className="pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-[#6c757d] hover:text-neutral-500"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormField>
          </div>

          {login.isError && (
            <div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 px-3 py-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <ParsedHtml
                as="p"
                className="font-open-sans text-sm text-red-600 [&_a]:underline"
                content={login.error?.message || "Invalid credentials. Please try again."}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={login.isPending}
            className="border-secondary-500 bg-secondary-500 font-open-sans flex h-10 w-full items-center justify-center gap-2 rounded border text-base text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {login.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Log in
          </button>
        </form>
      </div>

      <p className="font-open-sans mt-8 text-center text-base text-neutral-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-secondary-500 font-bold underline">
          Register
        </Link>
      </p>
    </div>
  );
}
