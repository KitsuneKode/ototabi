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

import { Key, Mail, ShieldAlert, User } from "@/lib/icons";

const signUpSchema = z.object({
  name: z.string().min(1, "Display name is required").max(100, "Name must be under 100 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignUpValues = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const router = useRouter();
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
    router.push("/dashboard");
  };

  const fields = [
    {
      id: "name" as const,
      label: "Display Name",
      type: "text",
      Icon: User,
      placeholder: "e.g. John Doe",
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

  return (
    <div className="bg-background relative flex min-h-svh flex-col items-center justify-center px-4 font-sans">
      <div className="noise-texture pointer-events-none fixed inset-0" />

      <div className="animate-in fade-in slide-in-from-bottom-6 relative z-10 w-full max-w-md duration-700">
        <div className="bg-card border-border chassis-shadow rounded-lg border p-8">
          {/* Header */}
          <div className="border-border mb-7 flex items-end justify-between border-b-2 pb-5">
            <div>
              <h1 className="text-3xl leading-none font-bold tracking-tight uppercase">Register</h1>
              <span className="text-muted-foreground mt-1.5 block font-mono text-[10px] tracking-widest uppercase">
                Model 16-A // New Operator Init
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1.5">
                <div className="led-amber h-3 w-3 animate-pulse rounded-full" />
                <span className="text-muted-foreground font-mono text-[9px] font-bold tracking-widest uppercase">
                  PWR
                </span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="led-red-off h-3 w-3 rounded-full" />
                <span className="text-muted-foreground font-mono text-[9px] font-bold tracking-widest uppercase">
                  NEW
                </span>
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

              {serverError && (
                <div className="border-destructive/40 bg-destructive/10 flex items-start gap-2.5 rounded border p-3">
                  <ShieldAlert className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
                  <p className="text-destructive font-mono text-xs uppercase">{serverError}</p>
                </div>
              )}

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
                className="text-accent font-bold underline-offset-2 transition-all hover:underline"
              >
                Authenticate Here
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="led-green h-2 w-2 rounded-full" />
          <span className="text-muted-foreground font-mono text-[9px] font-bold tracking-widest uppercase">
            Secure Local Auth — System Online
          </span>
        </div>
      </div>
    </div>
  );
}
