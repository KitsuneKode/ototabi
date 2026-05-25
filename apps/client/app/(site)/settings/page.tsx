"use client";

import { authClient } from "@ototabi/auth/client";
import { Input } from "@ototabi/ui/components/input";
import { Label } from "@ototabi/ui/components/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { LedInline } from "@/components/ui/led";
import { MonoLabel, PanelTitle, MechButton } from "@/components/ui/retro-primitives";
import { formatDate } from "@/lib/date-utils";
import {
  ArrowLeft,
  User,
  Mail,
  Save,
  LogOut,
  Trash2,
  ShieldAlert,
  Moon,
  Sun,
  Monitor,
} from "@/lib/icons";
import { useTRPC } from "@/trpc/client";

const THEMES = [
  { value: "light", label: "Light Mode", icon: Sun },
  { value: "dark", label: "Dark Mode", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export default function SettingsPage() {
  const router = useRouter();
  const trpc = useTRPC();
  const { theme, setTheme } = useTheme();

  const [displayName, setDisplayName] = useState("");
  const [nameInitialized, setNameInitialized] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const me = useQuery(
    trpc.user.getMe.queryOptions({
      onSuccess: (data: { name: string }) => {
        if (!nameInitialized && data.name) {
          setDisplayName(data.name);
          setNameInitialized(true);
        }
      },
    } as any),
  );

  const updateProfile = useMutation(
    trpc.user.updateProfile.mutationOptions({
      onSuccess: () => {
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 2500);
        me.refetch();
      },
      onError: (err: any) => setProfileError(err.message ?? "Failed to update profile"),
    }),
  );

  const deleteAccount = useMutation(
    trpc.user.deleteAccount.mutationOptions({
      onSuccess: async () => {
        await authClient.signOut();
        router.push("/");
      },
    }),
  );

  const subscription = useQuery(trpc.billing.getSubscription.queryOptions());
  const checkout = useMutation(
    trpc.billing.checkout.mutationOptions({
      onSuccess: (data) => {
        if (data.url) window.location.href = data.url;
      },
    }),
  );

  const startCheckout = useCallback(
    (plan: "creator" | "pro" | "studio") => {
      const successUrl = `${window.location.origin}/settings?billing=success`;
      checkout.mutate({ plan, successUrl });
    },
    [checkout],
  );

  const handleSaveProfile = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setProfileError("");
      updateProfile.mutate({ name: displayName });
    },
    [displayName, updateProfile],
  );

  const handleSignOut = useCallback(async () => {
    await authClient.signOut();
    router.push("/");
  }, [router]);

  const handleDeleteAccount = useCallback(() => {
    deleteAccount.mutate();
  }, [deleteAccount]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (me.isLoading) {
    return (
      <div className="bg-background flex min-h-[100dvh] items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="border-border border-t-accent h-8 w-8 animate-spin rounded-full border-2" />
          <span className="animate-pulse font-mono text-xs font-bold tracking-widest uppercase">
            Loading Operator Profile...
          </span>
        </div>
      </div>
    );
  }

  const user = me.data;
  const confirmMatch = deleteConfirm.toLowerCase() === "delete my account";

  return (
    <AppShell maxWidth="max-w-2xl">
      <div className="space-y-8">
        <PageHeader
          label="Operator profile"
          title="Settings"
          actions={
            <MechButton onClick={() => router.push("/dashboard")} className="h-9 px-2.5 py-2">
              <ArrowLeft className="h-4 w-4" />
            </MechButton>
          }
        />

        {/* ── Profile Info Banner ───────────────────────────────────────── */}
        {user && (
          <AnalogCard className="flex items-center gap-4 p-5">
            <div className="bg-accent/10 border-accent/30 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2">
              <span className="text-accent text-2xl font-bold uppercase">
                {user.name?.[0] ?? user.email?.[0] ?? "?"}
              </span>
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight uppercase">{user.name}</p>
              <MonoLabel>{user.email}</MonoLabel>
              <MonoLabel className="mt-1 text-[9px]">
                Joined: {formatDate(user.createdAt)}
              </MonoLabel>
            </div>
          </AnalogCard>
        )}

        {/* ── Display Settings ──────────────────────────────────────────── */}
        <AnalogCard className="space-y-4 p-6">
          <PanelTitle label="Display Console" title="Appearance" />
          <div>
            <MonoLabel className="mb-3 block">Theme Mode</MonoLabel>
            <div className="grid grid-cols-3 gap-3">
              {THEMES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex flex-col items-center gap-2 rounded border p-4 transition-[border-color,background-color] ${
                    theme === value
                      ? "border-accent bg-accent/5 text-accent"
                      : "border-border bg-card text-muted-foreground hover:border-border/80"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <MonoLabel className={theme === value ? "text-accent" : ""}>{label}</MonoLabel>
                </button>
              ))}
            </div>
          </div>
        </AnalogCard>

        {/* ── Profile Edit ──────────────────────────────────────────────── */}
        <AnalogCard className="space-y-5 p-6">
          <PanelTitle label="Operator Profile" title="Edit Account" />

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="display-name"
                className="text-muted-foreground font-mono text-[10px] font-bold tracking-widest uppercase"
              >
                Display Name
              </Label>
              <div className="relative">
                <User className="text-muted-foreground/60 absolute top-3 left-3 h-4 w-4" />
                <Input
                  id="display-name"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="border-border bg-popover text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-accent/60 h-11 rounded border pl-10 font-mono text-sm shadow-inner focus-visible:ring-1"
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="space-y-1.5">
              <Label className="text-muted-foreground font-mono text-[10px] font-bold tracking-widest uppercase">
                Email Address (Read-Only)
              </Label>
              <AnalogInset className="flex h-11 items-center gap-2 px-3">
                <Mail className="text-muted-foreground/60 h-4 w-4 shrink-0" />
                <span className="text-muted-foreground font-mono text-sm">{user?.email}</span>
              </AnalogInset>
            </div>

            {profileError && (
              <div className="border-destructive/40 bg-destructive/10 flex items-start gap-2.5 rounded border p-3">
                <ShieldAlert className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-destructive font-mono text-xs uppercase">{profileError}</p>
              </div>
            )}

            {profileSuccess && (
              <div className="border-led-green/30 bg-led-green/10 flex items-center gap-2 rounded border p-3">
                <LedInline color="green" size="sm" />
                <MonoLabel className="text-led-green">Profile updated successfully.</MonoLabel>
              </div>
            )}

            <MechButton
              type="submit"
              disabled={updateProfile.isPending}
              className="h-11 w-full justify-center text-sm"
            >
              <Save className="h-4 w-4" />
              {updateProfile.isPending ? "SAVING..." : "SAVE PROFILE"}
            </MechButton>
          </form>
        </AnalogCard>

        {/* ── Billing ───────────────────────────────────────────────────── */}
        <AnalogCard className="space-y-4 p-6">
          <PanelTitle label="Subscription" title="Billing" />
          <AnalogInset className="space-y-1 p-4">
            <MonoLabel>Current plan</MonoLabel>
            <p className="font-mono text-sm font-bold tracking-wide uppercase">
              {subscription.data?.plan ?? "TRIAL"} · {subscription.data?.status ?? "TRIALING"}
            </p>
          </AnalogInset>
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                { plan: "creator" as const, label: "Creator", price: "$15/mo" },
                { plan: "pro" as const, label: "Pro", price: "$29/mo" },
                { plan: "studio" as const, label: "Studio", price: "$59/mo" },
              ] as const
            ).map(({ plan, label, price }) => (
              <MechButton
                key={plan}
                onClick={() => startCheckout(plan)}
                disabled={checkout.isPending}
                className="h-auto flex-col gap-1 py-3"
              >
                <span className="text-sm">{label}</span>
                <MonoLabel>{price}</MonoLabel>
              </MechButton>
            ))}
          </div>
        </AnalogCard>

        {/* ── Session ───────────────────────────────────────────────────── */}
        <AnalogCard className="space-y-4 p-6">
          <PanelTitle label="Auth Module" title="Session" />
          <MechButton
            onClick={handleSignOut}
            variant="danger"
            className="h-11 w-full justify-center text-sm"
          >
            <LogOut className="h-4 w-4" />
            Sign Out of All Devices
          </MechButton>
        </AnalogCard>

        {/* ── Danger Zone ───────────────────────────────────────────────── */}
        <AnalogCard className="border-led-on/20 space-y-4 p-6">
          <PanelTitle label="⚠ Danger Zone" title="Delete Account" />
          <p className="text-muted-foreground font-mono text-xs leading-relaxed">
            Permanently deletes your operator profile and all associated data. Uploaded recordings
            in object storage are not removed. This action cannot be undone.
          </p>
          <MechButton
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
            className="h-11 w-full justify-center text-sm"
          >
            <Trash2 className="h-4 w-4" />
            Delete My Account
          </MechButton>
        </AnalogCard>

        {/* ── Delete Confirmation Modal ─────────────────────────────────────── */}
        {showDeleteModal && (
          <div
            className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Confirm deletion"
            tabIndex={-1}
          >
            <AnalogCard className="animate-in fade-in zoom-in-95 w-full max-w-md space-y-6 p-8 duration-200">
              <div role="document">
                <div className="flex items-start gap-4">
                  <div className="bg-led-on/10 border-led-on/30 mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border">
                    <ShieldAlert className="text-led-on h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-tight uppercase">
                      Confirm Account Deletion
                    </h3>
                    <p className="text-muted-foreground mt-1 font-mono text-xs leading-relaxed">
                      Type <span className="text-accent font-bold">delete my account</span> to
                      confirm.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground font-mono text-[10px] font-bold tracking-widest uppercase">
                    Confirmation Phrase
                  </Label>
                  <Input
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="delete my account"
                    className="border-border bg-popover text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-led-on/40 h-11 rounded border font-mono text-sm shadow-inner focus-visible:ring-1"
                  />
                </div>

                <div className="flex gap-3">
                  <MechButton
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteConfirm("");
                    }}
                    className="flex-1 justify-center"
                  >
                    Cancel
                  </MechButton>
                  <MechButton
                    variant="danger"
                    onClick={handleDeleteAccount}
                    disabled={!confirmMatch || deleteAccount.isPending}
                    className="flex-1 justify-center"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deleteAccount.isPending ? "DELETING..." : "CONFIRM"}
                  </MechButton>
                </div>
              </div>
            </AnalogCard>
          </div>
        )}
      </div>
    </AppShell>
  );
}
