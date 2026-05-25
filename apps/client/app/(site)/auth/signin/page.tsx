"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@ototabi/auth/client";
import { Button } from "@ototabi/ui/components/button";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@ototabi/ui/components/form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { RedirectIfAuthenticated } from "@/components/auth/redirect-if-authenticated";
import { AuthShell } from "@/components/layout/auth-shell";
import { AnalogInput } from "@/components/ui/analog-input";
import { useRefreshAuthSession } from "@/lib/hooks/use-session";
import { Key, Mail, ShieldAlert } from "@/lib/icons";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type SignInValues = z.infer<typeof signInSchema>;

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

export default function SignInPage() {
  const router = useRouter();
  const refreshAuthSession = useRefreshAuthSession();
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
    const session = await refreshAuthSession();
    if (!session?.user) {
      setServerError("Signed in but session could not be established. Try again.");
      return;
    }
    router.replace("/dashboard");
  };

  return (
    <RedirectIfAuthenticated>
      <AuthShell title="Sign In" subtitle="Model 16-A // Auth Terminal">
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
                      <AnalogInput
                        {...field}
                        type={type}
                        placeholder={placeholder}
                        className="h-11 pl-10"
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
              variant="analog"
              size="lg"
              disabled={form.formState.isSubmitting}
              className="h-11 w-full"
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
                  type="button"
                  disabled
                  className="border-border/60 bg-popover/40 text-muted-foreground/40 h-9 flex-1 cursor-not-allowed rounded border border-dashed font-mono text-[10px] font-bold tracking-wider uppercase"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </AuthShell>
    </RedirectIfAuthenticated>
  );
}
