'use client'

import { useState, useCallback } from 'react'
import { useTRPC } from '@/trpc/client'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { authClient } from '@ototabi/auth/client'
import { Input } from '@ototabi/ui/components/input'
import { Label } from '@ototabi/ui/components/label'
import { AnalogCard, AnalogInset } from '@/components/ui/analog-card'
import { Led, LedInline } from '@/components/ui/led'
import {
  MonoLabel,
  PanelTitle,
  NoiseBackground,
  MechButton,
} from '@/components/ui/retro-primitives'
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
} from 'lucide-react'
import { useTheme } from 'next-themes'

const THEMES = [
  { value: 'light', label: 'Light Mode', icon: Sun },
  { value: 'dark',  label: 'Dark Mode',  icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const

export default function SettingsPage() {
  const router = useRouter()
  const trpc = useTRPC()
  const { theme, setTheme } = useTheme()

  const [displayName, setDisplayName] = useState('')
  const [nameInitialized, setNameInitialized] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const me = useQuery(
    trpc.user.getMe.queryOptions({
      onSuccess: (data: { name: string }) => {
        if (!nameInitialized && data.name) {
          setDisplayName(data.name)
          setNameInitialized(true)
        }
      },
    } as any),
  )

  const updateProfile = useMutation(
    trpc.user.updateProfile.mutationOptions({
      onSuccess: () => {
        setProfileSuccess(true)
        setTimeout(() => setProfileSuccess(false), 2500)
        me.refetch()
      },
      onError: (err: any) => setProfileError(err.message ?? 'Failed to update profile'),
    }),
  )

  const deleteAccount = useMutation(
    trpc.user.deleteAccount.mutationOptions({
      onSuccess: async () => {
        await authClient.signOut()
        router.push('/')
      },
    }),
  )

  const handleSaveProfile = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      setProfileError('')
      updateProfile.mutate({ name: displayName })
    },
    [displayName, updateProfile],
  )

  const handleSignOut = useCallback(async () => {
    await authClient.signOut()
    router.push('/')
  }, [router])

  const handleDeleteAccount = useCallback(() => {
    deleteAccount.mutate()
  }, [deleteAccount])

  // ── Loading ──────────────────────────────────────────────────────────────
  if (me.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-border border-t-accent animate-spin" />
          <span className="font-mono text-xs uppercase font-bold tracking-widest animate-pulse">
            Loading Operator Profile...
          </span>
        </div>
      </div>
    )
  }

  const user = me.data
  const confirmMatch = deleteConfirm.toLowerCase() === 'delete my account'

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-4 md:p-8 relative">
      <NoiseBackground />

      <div className="max-w-2xl w-full mx-auto relative z-10 space-y-8">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="flex items-end justify-between border-b-2 border-border pb-4">
          <div className="flex items-end gap-4">
            <MechButton onClick={() => router.push('/dashboard')} aria-label="Back to Dashboard" className="px-2.5 py-2 h-9">
              <ArrowLeft className="h-4 w-4" />
            </MechButton>
            <div>
              <h1 className="text-3xl font-bold leading-none tracking-tight uppercase">
                Settings
              </h1>
              <MonoLabel className="block mt-1.5">
                Operator Profile Management Console
              </MonoLabel>
            </div>
          </div>
          <Led color="amber" size="md" pulse label="ACTIVE" />
        </header>

        {/* ── Profile Info Banner ───────────────────────────────────────── */}
        {user && (
          <AnalogCard className="p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-accent/10 border-2 border-accent/30 flex items-center justify-center shrink-0">
              <span className="font-bold text-2xl text-accent uppercase">
                {user.name?.[0] ?? user.email?.[0] ?? '?'}
              </span>
            </div>
            <div>
              <p className="text-lg font-bold uppercase tracking-tight">{user.name}</p>
              <MonoLabel>{user.email}</MonoLabel>
              <MonoLabel className="mt-1 text-[9px]">
                Joined: {new Date(user.createdAt).toLocaleDateString()}
              </MonoLabel>
            </div>
          </AnalogCard>
        )}

        {/* ── Display Settings ──────────────────────────────────────────── */}
        <AnalogCard className="p-6 space-y-4">
          <PanelTitle label="Display Console" title="Appearance" />
          <div>
            <MonoLabel className="block mb-3">Theme Mode</MonoLabel>
            <div className="grid grid-cols-3 gap-3">
              {THEMES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex flex-col items-center gap-2 p-4 border rounded transition-[border-color,background-color] ${
                    theme === value
                      ? 'border-accent bg-accent/5 text-accent'
                      : 'border-border bg-card text-muted-foreground hover:border-border/80'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <MonoLabel className={theme === value ? 'text-accent' : ''}>{label}</MonoLabel>
                </button>
              ))}
            </div>
          </div>
        </AnalogCard>

        {/* ── Profile Edit ──────────────────────────────────────────────── */}
        <AnalogCard className="p-6 space-y-5">
          <PanelTitle label="Operator Profile" title="Edit Account" />

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="display-name" className="font-mono text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                Display Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
                <Input
                  id="display-name"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10 h-11 border border-border bg-popover text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-accent/60 rounded font-mono text-sm shadow-inner"
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                Email Address (Read-Only)
              </Label>
              <AnalogInset className="h-11 flex items-center px-3 gap-2">
                <Mail className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                <span className="font-mono text-sm text-muted-foreground">{user?.email}</span>
              </AnalogInset>
            </div>

            {profileError && (
              <div className="flex items-start gap-2.5 border border-destructive/40 bg-destructive/10 p-3 rounded">
                <ShieldAlert className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="font-mono text-xs text-destructive uppercase">{profileError}</p>
              </div>
            )}

            {profileSuccess && (
              <div className="flex items-center gap-2 border border-led-green/30 bg-led-green/10 p-3 rounded">
                <LedInline color="green" size="sm" />
                <MonoLabel className="text-led-green">Profile updated successfully.</MonoLabel>
              </div>
            )}

            <MechButton
              type="submit"
              disabled={updateProfile.isPending}
              className="w-full justify-center h-11 text-sm"
            >
              <Save className="h-4 w-4" />
              {updateProfile.isPending ? 'SAVING...' : 'SAVE PROFILE'}
            </MechButton>
          </form>
        </AnalogCard>

        {/* ── Session ───────────────────────────────────────────────────── */}
        <AnalogCard className="p-6 space-y-4">
          <PanelTitle label="Auth Module" title="Session" />
          <MechButton
            onClick={handleSignOut}
            variant="danger"
            className="w-full justify-center h-11 text-sm"
          >
            <LogOut className="h-4 w-4" />
            Sign Out of All Devices
          </MechButton>
        </AnalogCard>

        {/* ── Danger Zone ───────────────────────────────────────────────── */}
        <AnalogCard className="p-6 border-led-on/20 space-y-4">
          <PanelTitle label="⚠ Danger Zone" title="Delete Account" />
          <p className="font-mono text-xs text-muted-foreground leading-relaxed">
            Permanently deletes your operator profile and all associated data. Uploaded recordings in object storage are not removed. This action cannot be undone.
          </p>
          <MechButton
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
            className="w-full justify-center h-11 text-sm"
          >
            <Trash2 className="h-4 w-4" />
            Delete My Account
          </MechButton>
        </AnalogCard>

      </div>

      {/* ── Delete Confirmation Modal ─────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label="Confirm deletion" tabIndex={-1}>
          <AnalogCard className="p-8 max-w-md w-full space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div role="document">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-led-on/10 border border-led-on/30 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldAlert className="h-5 w-5 text-led-on" />
              </div>
              <div>
                <h3 className="text-lg font-bold uppercase tracking-tight">Confirm Account Deletion</h3>
                <p className="font-mono text-xs text-muted-foreground mt-1 leading-relaxed">
                  Type <span className="text-accent font-bold">delete my account</span> to confirm.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                Confirmation Phrase
              </Label>
              <Input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="delete my account"
                className="h-11 border border-border bg-popover text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-led-on/40 rounded font-mono text-sm shadow-inner"
              />
            </div>

            <div className="flex gap-3">
              <MechButton
                onClick={() => { setShowDeleteModal(false); setDeleteConfirm('') }}
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
                {deleteAccount.isPending ? 'DELETING...' : 'CONFIRM'}
              </MechButton>
            </div>
            </div>
          </AnalogCard>
        </div>
      )}
    </div>
  )
}
