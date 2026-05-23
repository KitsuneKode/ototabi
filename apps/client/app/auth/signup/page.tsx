'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@ototabi/auth/client'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@ototabi/ui/components/button'
import { Input } from '@ototabi/ui/components/input'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@ototabi/ui/components/form'
import { Key, Mail, ShieldAlert, User } from 'lucide-react'

const signUpSchema = z.object({
  name: z
    .string()
    .min(1, 'Display name is required')
    .max(100, 'Name must be under 100 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
})

type SignUpValues = z.infer<typeof signUpSchema>

export default function SignUpPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState('')

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  const handleSignUp = async (values: SignUpValues) => {
    setServerError('')
    const { error } = await authClient.signUp.email({
      email: values.email,
      password: values.password,
      name: values.name,
    })
    if (error) {
      setServerError(error.message || 'Failed to create account')
      return
    }
    router.push('/dashboard')
  }

  const fields = [
    {
      id: 'name' as const,
      label: 'Display Name',
      type: 'text',
      Icon: User,
      placeholder: 'e.g. John Doe',
    },
    {
      id: 'email' as const,
      label: 'Email Address',
      type: 'email',
      Icon: Mail,
      placeholder: 'you@example.com',
    },
    {
      id: 'password' as const,
      label: 'Password',
      type: 'password',
      Icon: Key,
      placeholder: 'Min. 8 characters',
    },
  ] as const

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-background px-4 font-sans">
      <div className="noise-texture pointer-events-none fixed inset-0" />

      <div className="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="bg-card border border-border rounded-lg chassis-shadow p-8">

          {/* Header */}
          <div className="flex items-end justify-between border-b-2 border-border pb-5 mb-7">
            <div>
              <h1 className="text-3xl font-bold uppercase leading-none tracking-tight">Register</h1>
              <span className="font-mono text-[10px] tracking-widest text-muted-foreground block mt-1.5 uppercase">
                Model 16-A // New Operator Init
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-3 h-3 rounded-full led-amber animate-pulse" />
                <span className="font-mono text-[9px] font-bold tracking-widest text-muted-foreground uppercase">PWR</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-3 h-3 rounded-full led-red-off" />
                <span className="font-mono text-[9px] font-bold tracking-widest text-muted-foreground uppercase">NEW</span>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-5">
              {fields.map(({ id, label, type, Icon, placeholder }) => (
                <FormField
                  key={id}
                  control={form.control}
                  name={id}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {label}
                      </FormLabel>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground/60">
                          <Icon className="h-4 w-4" />
                        </span>
                        <Input
                          {...field}
                          type={type}
                          placeholder={placeholder}
                          className="pl-10 h-11 border border-border bg-popover text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-accent/60 rounded font-mono text-sm shadow-inner"
                        />
                      </div>
                      <FormMessage className="text-xs font-mono text-destructive" />
                    </FormItem>
                  )}
                />
              ))}

              {serverError && (
                <div className="flex items-start gap-2.5 border border-destructive/40 bg-destructive/10 p-3 rounded">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
                  <p className="text-xs font-mono text-destructive uppercase">{serverError}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="btn-mechanical w-full h-11 rounded font-bold uppercase tracking-widest text-secondary-foreground"
              >
                {form.formState.isSubmitting ? 'INITIALIZING...' : 'CREATE ACCOUNT'}
              </Button>
            </form>
          </Form>

          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-center font-mono text-[10px] text-muted-foreground uppercase tracking-wide">
              Already registered?{' '}
              <Link href="/auth/signin" className="font-bold text-accent hover:underline underline-offset-2 transition-all">
                Authenticate Here
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full led-green" />
          <span className="font-mono text-[9px] font-bold tracking-widest text-muted-foreground uppercase">
            Secure Local Auth — System Online
          </span>
        </div>
      </div>
    </div>
  )
}
