"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/ui/user-avatar";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      email: "",
    },
  });

  useEffect(() => {
    if (me) {
      reset({
        first_name: me.first_name ?? "",
        last_name: me.last_name ?? "",
        email: me.email ?? "",
      });
    }
  }, [me, reset]);

  const updateMutation = useMutation({
    mutationFn: (input: ProfileInput) =>
      userService.updateMe({
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
      }),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.user.me, updated);
      qc.invalidateQueries({ queryKey: queryKeys.user.me });
      if (authUser) {
        setUser({
          ...authUser,
          displayName:
            updated.display_name ||
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

  const avatarMutation = useMutation({
    mutationFn: (file: File) => userService.uploadAvatar(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.user.me });
      toast.success("Avatar updated");
    },
    onError: () => toast.error("Could not upload avatar"),
  });

  const onSubmit = (values: ProfileInput) => updateMutation.mutate(values);

  return (
    <div className="mx-auto max-w-3xl py-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#2e4450]">Profile</h1>
        <p className="text-[#586973]">Update your personal info and contact details.</p>
      </header>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Profile photo</CardTitle>
          <CardDescription>Upload a photo to personalize your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <UserAvatar user={me} size="xl" />
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) avatarMutation.mutate(file);
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={avatarMutation.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="mr-2 h-4 w-4" />
                )}
                Change photo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
          <CardDescription>This is how your name will appear on your courses.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !me ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
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

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!isDirty || updateMutation.isPending}
                  className="hover:bg-lms-primary/90 bg-lms-primary"
                >
                  {updateMutation.isPending ? <Loader2 className="animate-spin" /> : null}
                  Save changes
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6 border-red-100">
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
