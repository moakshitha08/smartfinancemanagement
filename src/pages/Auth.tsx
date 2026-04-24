import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PasswordInput } from "@/components/PasswordInput";
import { toast } from "sonner";

const signUpSchema = z
  .object({
    username: z.string().trim().min(3, "Username must be at least 3 chars").max(30),
    password: z.string().min(6, "Password must be at least 6 characters").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] });

const signInSchema = z.object({
  username: z.string().trim().min(3, "Enter your username").max(30),
  password: z.string().min(1, "Password required").max(72),
});

// Username -> synthetic email mapping (Supabase requires email under the hood)
const usernameToEmail = (u: string) => `${u.trim().toLowerCase()}@app.local`;

const Auth = () => {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) nav("/app", { replace: true });
  }, [user, loading, nav]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signUpSchema.safeParse({
      username: fd.get("username"),
      password: fd.get("password"),
      confirm: fd.get("confirm"),
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (!/^[a-zA-Z0-9_.-]+$/.test(parsed.data.username))
      return toast.error("Username can only contain letters, numbers, _ . -");
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: usernameToEmail(parsed.data.username),
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: { username: parsed.data.username, display_name: parsed.data.username },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created! You can sign in now.");
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signInSchema.safeParse({ username: fd.get("username"), password: fd.get("password") });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(parsed.data.username),
      password: parsed.data.password,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in-up">
        <div className="flex flex-col items-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-[image:var(--gradient-primary)] flex items-center justify-center shadow-[var(--shadow-glow)] mb-4">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Smart Budget Planner</h1>
          <p className="text-sm text-muted-foreground mt-1">CIICP Lab — Your finances, in real time</p>
        </div>

        <div className="glass-strong rounded-2xl p-6">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary/40">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-5">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="si-email">Email</Label>
                  <Input id="si-email" name="email" type="email" placeholder="you@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="si-password">Password</Label>
                  <PasswordInput id="si-password" name="password" placeholder="••••••••" required />
                </div>
                <Button type="submit" disabled={busy} className="w-full bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-90 shadow-[var(--shadow-glow)]">
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-5">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="su-username">Username</Label>
                  <Input id="su-username" name="username" placeholder="johndoe" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" name="email" type="email" placeholder="you@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-password">Password</Label>
                  <PasswordInput id="su-password" name="password" placeholder="At least 6 characters" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-confirm">Confirm password</Label>
                  <PasswordInput id="su-confirm" name="confirm" placeholder="Repeat password" required />
                </div>
                <Button type="submit" disabled={busy} className="w-full bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-90 shadow-[var(--shadow-glow)]">
                  {busy ? "Creating…" : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Secured by Lovable Cloud · INR ₹
        </p>
      </div>
    </div>
  );
};

export default Auth;