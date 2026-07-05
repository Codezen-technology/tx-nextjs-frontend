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
    <div className="w-full max-w-[416px] rounded-lg border border-[#ebedf1] bg-white p-10 text-[#3b5374] shadow-[0px_8px_8px_rgb(0_0_0/0.15)]">
      <h1 className="mb-10 text-center font-suse text-[28px] font-bold leading-[1.2] text-[#00204a]">
        Create your account
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6c757d] hover:text-[#3b5374]"
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
                  className="mt-0.5 h-4 w-4 rounded border-[#bfc7d2] accent-[#9e6f21]"
                  {...register("terms")}
                />
                <span className="font-open-sans text-base text-[#3b5374]">
                  I agree to the{" "}
                  <Link href="/terms-and-conditions" className="font-bold text-[#9e6f21] underline">
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
            className="flex h-10 w-full items-center justify-center gap-2 rounded border border-[#9e6f21] bg-[#9e6f21] font-open-sans text-base text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {reg.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Register
          </button>
        </form>
      </div>

      <p className="mt-8 text-center font-open-sans text-base text-[#3b5374]">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-[#9e6f21] underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
