"use client";

import { useState } from "react";
import { Loader2, ShieldAlert, UserRoundSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMe, useSwitchUser } from "@/lib/hooks/useAuth";
import { isImpersonating } from "@/lib/api/bff-client";

function isAdministrator(roles: string[] | undefined): boolean {
  return Boolean(roles?.includes("administrator"));
}

export default function UserSwitchingPage() {
  const { data: me, isLoading } = useMe();
  const switchUser = useSwitchUser();
  const [email, setEmail] = useState("");

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdministrator(me?.roles)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-6">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-destructive" />
          <div>
            <h1 className="text-lg font-semibold">Access denied</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              You need WordPress administrator privileges to switch users.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isImpersonating()) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">User switching</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You are currently impersonating another user. Use the banner at the top of the page to
            switch back before starting a new session.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <UserRoundSearch className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">User switching</h1>
            <p className="text-sm text-muted-foreground">
              Enter a user&apos;s email to view the site as them. All actions are logged.
            </p>
          </div>
        </div>

        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!email.trim()) return;
            switchUser.mutate(email.trim());
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="switch-email">User email</Label>
            <Input
              id="switch-email"
              type="email"
              autoComplete="off"
              placeholder="student@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={switchUser.isPending}
              required
            />
          </div>
          <Button type="submit" disabled={switchUser.isPending || !email.trim()}>
            {switchUser.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Switching...
              </>
            ) : (
              "Switch to user"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
