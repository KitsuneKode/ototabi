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

import { Key, Mail, ShieldAlert } from "@/lib/icons";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type SignInValues = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleSignIn = async (values: SignInValues) => {
    setServerError("");
    const { error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });
    if (error) {
      setServerError(error.message || "Failed to sign in");
      return;
    }
    router.push("/dashboard");
  };

  const fields = [
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
      placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
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
              <h1 className="text-3xl leading-none font-bold tracking-tight uppercase">Sign In</h1>
              <span className="text-muted-foreground mt-1.5 block font-mono text-[10px] tracking-widest uppercase">
                Model 16-A // Auth Terminal
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
                  AUTH
                </span>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSignIn)} className="space-y-5">
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
                {form.formState.isSubmitting ? "AUTHENTICATING..." : "SIGN IN"}
              </Button>
            </form>
          </Form>

          <div className="border-border mt-6 flex flex-col gap-4 border-t pt-5">
            <p className="text-muted-foreground text-center font-mono text-[10px] tracking-wide uppercase">
              No account?{" "}
              <Link
                href="/auth/signup"
                className="text-accent font-bold underline-offset-2 transition-[text-decoration] hover:underline"
              >
                Register Terminal
              </Link>
            </p>
            <div className="space-y-1.5">
              <span className="text-muted-foreground block text-center font-mono text-[9px] tracking-widest uppercase">
                — External Auth Modules (Offline) —
              </span>
              <div className="flex gap-2">
                {["Google", "GitHub"].map((p) => (
                  <button
                    key={p}
                    disabled
                    className="border-border/60 bg-popover/40 text-muted-foreground/40 h-9 flex-1 cursor-not-allowed rounded border border-dashed font-mono text-[10px] font-bold tracking-wider uppercase"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
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
