"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth, useMe, useLogoutAll } from "@/lib/hooks/useAuth";
import { profileSchema, type ProfileInput } from "@/lib/schemas/profile";
import { userService } from "@/lib/services/user";
import { useAuthStore } from "@/lib/stores/auth.store";
import { queryKeys } from "@/lib/utils/query-keys";
import type { ApiError } from "@/lib/api/error";

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const { data: me, isLoading } = useMe();
  const logoutAll = useLogoutAll();
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      description: "",
      url: "",
      email: "",
    },
  });

  useEffect(() => {
    if (me) {
      reset({
        first_name: me.first_name ?? "",
        last_name: me.last_name ?? "",
        description: me.description ?? "",
        url: me.url ?? "",
        email: me.email ?? "",
      });
    }
  }, [me, reset]);

  const updateMutation = useMutation({
    mutationFn: (input: ProfileInput) => userService.updateMe(input),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.user.me, updated);
      qc.invalidateQueries({ queryKey: queryKeys.user.me });
      if (authUser) {
        setUser({
          ...authUser,
          displayName:
            updated.name ||
            `${updated.first_name ?? ""} ${updated.last_name ?? ""}`.trim() ||
            authUser.displayName,
          email: updated.email ?? authUser.email,
        });
      }
      toast.success("Profile updated");
    },
    onError: (err: ApiError) => toast.error(err.message || "Could not update profile"),
  });

  const onSubmit = (values: ProfileInput) => updateMutation.mutate(values);

  return (
    <div className="container max-w-3xl py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Update your personal info and contact details.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
          <CardDescription>This is how your name will appear on your courses.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !me ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First name</Label>
                  <Input id="first_name" {...register("first_name")} />
                  {errors.first_name ? (
                    <p className="text-sm text-destructive">{errors.first_name.message}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last name</Label>
                  <Input id="last_name" {...register("last_name")} />
                  {errors.last_name ? (
                    <p className="text-sm text-destructive">{errors.last_name.message}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email ? (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">Website</Label>
                <Input id="url" type="url" placeholder="https://" {...register("url")} />
                {errors.url ? (
                  <p className="text-sm text-destructive">{errors.url.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Bio</Label>
                <textarea
                  id="description"
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register("description")}
                />
                {errors.description ? (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                ) : null}
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={!isDirty || updateMutation.isPending}>
                  {updateMutation.isPending ? <Loader2 className="animate-spin" /> : null}
                  Save changes
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
      <Card className="border-red-100">
        <CardHeader>
          <CardTitle className="text-base">Security</CardTitle>
          <CardDescription>
            Sign out of all devices. Use this if you suspect unauthorized access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            disabled={logoutAll.isPending}
            onClick={() => logoutAll.mutate()}
          >
            {logoutAll.isPending ? <Loader2 className="animate-spin" /> : null}
            Sign out all devices
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
