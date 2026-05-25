"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@ototabi/auth/client";
import { Button } from "@ototabi/ui/components/button";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@ototabi/ui/components/form";
import { Input } from "@ototabi/ui/components/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { RedirectIfAuthenticated } from "@/components/auth/redirect-if-authenticated";
import { AuthShell } from "@/components/layout/auth-shell";
import { useRefreshAuthSession } from "@/lib/hooks/use-session";
import { Key, Mail, ShieldAlert, User } from "@/lib/icons";

const signUpSchema = z.object({
  name: z.string().min(1, "Display name is required").max(100, "Name must be under 100 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignUpValues = z.infer<typeof signUpSchema>;

const fields = [
  {
    id: "name" as const,
    label: "Display Name",
    type: "text",
    Icon: User,
    placeholder: "e.g. Mira Okonkwo",
  },
  {
    id: "email" as const,
    label: "Email Address",
    type: "email",
    Icon: Mail,
    placeholder: "you@example.com",
  },
  {
    id: "password" as const,
    label: "Password",
    type: "password",
    Icon: Key,
    placeholder: "Min. 8 characters",
  },
] as const;

export default function SignUpPage() {
  const router = useRouter();
  const refreshAuthSession = useRefreshAuthSession();
  const [serverError, setServerError] = useState("");

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const handleSignUp = async (values: SignUpValues) => {
    setServerError("");
    const { error } = await authClient.signUp.email({
      email: values.email,
      password: values.password,
      name: values.name,
    });
    if (error) {
      setServerError(error.message || "Failed to create account");
      return;
    }
    const session = await refreshAuthSession();
    if (!session?.user) {
      setServerError("Account created but session could not be established. Sign in.");
      return;
    }
    router.replace("/dashboard");
  };

  return (
    <RedirectIfAuthenticated>
      <AuthShell title="Register" subtitle="Model 16-A // New Operator Init">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-5">
            {fields.map(({ id, label, type, Icon, placeholder }) => (
              <FormField
                key={id}
                control={form.control}
                name={id}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground font-mono text-[10px] font-bold tracking-widest uppercase">
                      {label}
                    </FormLabel>
                    <div className="relative">
                      <span className="text-muted-foreground/60 absolute inset-y-0 left-3 flex items-center">
                        <Icon className="h-4 w-4" />
                      </span>
                      <Input
                        {...field}
                        type={type}
                        placeholder={placeholder}
                        className="border-border bg-popover text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-accent/60 h-11 rounded border pl-10 font-mono text-sm shadow-inner focus-visible:ring-1"
                      />
                    </div>
                    <FormMessage className="text-destructive font-mono text-xs" />
                  </FormItem>
                )}
              />
            ))}

            {serverError ? (
              <div className="border-destructive/40 bg-destructive/10 flex items-start gap-2.5 rounded border p-3">
                <ShieldAlert className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-destructive font-mono text-xs uppercase">{serverError}</p>
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="btn-mechanical text-secondary-foreground h-11 w-full rounded font-bold tracking-widest uppercase"
            >
              {form.formState.isSubmitting ? "INITIALIZING..." : "CREATE ACCOUNT"}
            </Button>
          </form>
        </Form>

        <div className="border-border mt-6 border-t pt-5">
          <p className="text-muted-foreground text-center font-mono text-[10px] tracking-wide uppercase">
            Already registered?{" "}
            <Link
              href="/auth/signin"
              className="text-accent font-bold underline-offset-2 transition-[text-decoration] hover:underline"
            >
              Authenticate Here
            </Link>
          </p>
        </div>
      </AuthShell>
    </RedirectIfAuthenticated>
  );
}
