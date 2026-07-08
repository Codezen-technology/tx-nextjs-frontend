"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useRegister } from "@/lib/hooks/useAuth";
import { registerSchema, type RegisterInput } from "@/lib/schemas/auth";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { FormField, FormInput } from "@/components/ui/form-field";

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });
  const reg = useRegister();

  const onSubmit = (values: RegisterInput) => reg.mutate(values);

  return (
    <div className="border-neutral-30 w-full max-w-[416px] rounded-lg border bg-white p-10 text-neutral-500 shadow-[0px_8px_8px_rgb(0_0_0/0.15)]">
      <h1 className="font-suse mb-10 text-center text-[28px] leading-[1.2] font-bold text-neutral-900">
        Create your account
      </h1>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <SocialAuthButtons />
          <div className="flex items-center gap-2">
            <div className="bg-neutral-30 h-px flex-1" />
            <span className="font-open-sans text-base text-neutral-500">OR</span>
            <div className="bg-neutral-30 h-px flex-1" />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <FormField id="name" label="Full Name" error={errors.name?.message}>
              <FormInput
                id="name"
                variant="auth"
                autoComplete="name"
                autoFocus
                placeholder="Your Name"
                hasError={Boolean(errors.name)}
                {...register("name")}
              />
            </FormField>

            <FormField id="email" label="Email" error={errors.email?.message}>
              <FormInput
                id="email"
                variant="auth"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                hasError={Boolean(errors.email)}
                {...register("email")}
              />
            </FormField>

            <FormField id="password" label="Password" error={errors.password?.message}>
              <div className="relative">
                <FormInput
                  id="password"
                  variant="auth"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
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

            <div>
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  className="accent-secondary-500 mt-0.5 h-4 w-4 rounded border-neutral-50"
                  {...register("terms")}
                />
                <span className="font-open-sans text-base text-neutral-500">
                  I agree to the{" "}
                  <Link
                    href="/terms-and-conditions"
                    className="text-secondary-500 font-bold underline"
                  >
                    terms &amp; conditions
                  </Link>
                </span>
              </label>
              {errors.terms && <p className="mt-1 text-sm text-red-500">{errors.terms.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={reg.isPending}
            className="border-secondary-500 bg-secondary-500 font-open-sans flex h-10 w-full items-center justify-center gap-2 rounded border text-base text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {reg.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Register
          </button>
        </form>
      </div>

      <p className="font-open-sans mt-8 text-center text-base text-neutral-500">
        Already have an account?{" "}
        <Link href="/login" className="text-secondary-500 font-bold underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
