"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/lib/services/auth";
import { userService } from "@/lib/services/user";
import { useAuthStore } from "@/lib/stores/auth.store";
import { queryKeys } from "@/lib/utils/query-keys";
import {
  clearCartToken,
  getImpersonatingDisplayName,
  hasUserLoggedInCookie,
  isImpersonating,
} from "@/lib/api/bff-client";
import type { LoginInput, RegisterInput } from "@/lib/schemas/auth";
import type { ApiError } from "@/lib/api/error";
import type { WpUser } from "@/types/user";

function wpUserToAuthUser(u: WpUser) {
  const displayName =
    u.display_name?.trim() ||
    u.name?.trim() ||
    [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
    u.username ||
    u.user_nicename ||
    "";
  return {
    email: u.email ?? "",
    displayName,
    nicename: u.slug ?? u.username ?? u.user_nicename ?? "",
  };
}

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const clearUser = useAuthStore((s) => s.logout);
  const [cookieAuthed, setCookieAuthed] = useState(false);

  useEffect(() => {
    const authed = hasUserLoggedInCookie();
    setCookieAuthed(authed);
    // Reconcile split-brain: the `user_logged_in` cookie is the authoritative
    // session signal (it's what the proxy trusts). If a persisted user survives
    // in localStorage but the cookie is gone (expiry / logout elsewhere), the
    // session is over — clear the stale user so UI matches the route guards.
    if (hasHydrated && user && !authed) {
      clearUser();
    }
  }, [user, hasHydrated, clearUser]);

  return {
    user,
    // Authoritative on the cookie, not the persisted display data.
    isAuthenticated: hasHydrated && cookieAuthed,
    hasHydrated,
  };
}

export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();
  const search = useSearchParams();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => authService.login(input),
    onSuccess: ({ user }) => {
      setUser(user);
      // Drop the anonymous Cart-Token so the next cart fetch resolves against
      // this user's own WC session/persistent cart instead of the guest cart.
      clearCartToken();
      qc.invalidateQueries({ queryKey: queryKeys.user.me });
      qc.invalidateQueries({ queryKey: queryKeys.enrollments.me });
      qc.invalidateQueries({ queryKey: queryKeys.cart.detail });
      toast.success(`Welcome back, ${user.displayName}`);
      const next = search.get("next");
      router.replace(next && next.startsWith("/") ? next : "/dashboard/my-learning");
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Invalid credentials");
    },
  });
}

export function useRegister() {
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const { terms: _t, ...payload } = input;
      return authService.register(payload);
    },
    onSuccess: ({ user }) => {
      qc.invalidateQueries({ queryKey: queryKeys.user.me });
      qc.invalidateQueries({ queryKey: queryKeys.enrollments.me });
      if (hasUserLoggedInCookie()) {
        setUser(user);
        clearCartToken();
        qc.invalidateQueries({ queryKey: queryKeys.cart.detail });
        toast.success("Account created. Welcome to the platform!");
        router.replace("/dashboard");
      } else {
        toast.success("Account created. Please sign in.");
        router.replace("/login");
      }
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Could not register. Try a different email.");
    },
  });
}

export function useLogout() {
  const logoutStore = useAuthStore((s) => s.logout);
  const router = useRouter();
  const qc = useQueryClient();
  return () => {
    void (async () => {
      try {
        await authService.logout();
      } catch {
        /* still clear client state */
      }
      logoutStore();
      clearCartToken();
      qc.clear();
      toast.success("Signed out");
      router.replace("/");
    })();
  };
}

export function useLogoutAll() {
  const logoutStore = useAuthStore((s) => s.logout);
  const router = useRouter();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logoutAll(),
    onSuccess: () => {
      logoutStore();
      clearCartToken();
      qc.clear();
      toast.success("All sessions signed out");
      router.replace("/login");
    },
    onError: () => {
      toast.error("Could not revoke sessions. Try again.");
    },
  });
}

export function useMe(enabled = true) {
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const setUser = useAuthStore((s) => s.setUser);
  const canFetch =
    hasHydrated && (Boolean(user) || (typeof window !== "undefined" && hasUserLoggedInCookie()));

  return useQuery({
    queryKey: queryKeys.user.me,
    queryFn: async () => {
      const u = await userService.me();
      setUser(wpUserToAuthUser(u));
      return u;
    },
    enabled: enabled && canFetch,
    staleTime: 60_000,
  });
}

export function useImpersonation() {
  const [state, setState] = useState<{ active: boolean; displayName: string | null }>({
    active: false,
    displayName: null,
  });

  useEffect(() => {
    setState({ active: isImpersonating(), displayName: getImpersonatingDisplayName() });
  }, []);

  return state;
}

export function useSwitchUser() {
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (email: string) => authService.switchUser(email),
    onSuccess: ({ user }) => {
      setUser(user);
      clearCartToken();
      qc.clear();
      toast.success(`Now viewing as ${user.displayName}`);
      router.replace("/dashboard/my-learning");
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Could not switch to that user.");
    },
  });
}

export function useSwitchBack() {
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => authService.switchBack(),
    onSuccess: ({ user }) => {
      setUser(user);
      clearCartToken();
      qc.clear();
      toast.success(`Switched back to ${user.displayName}`);
      router.replace("/dashboard/admin/user-switching");
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Could not switch back.");
    },
  });
}
