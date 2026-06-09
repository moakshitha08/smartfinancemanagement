import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { toast } from "sonner";
import { z } from "zod";
import { toUserMessage } from "@/lib/errors";

const Settings = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [pw, setPw] = useState("");
  const [busyP, setBusyP] = useState(false);
  const [busyPw, setBusyPw] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("username,display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setUsername(data.username ?? "");
          setDisplayName(data.display_name ?? "");
        }
      });
  }, [user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = z
      .object({
        username: z.string().trim().min(3).max(30),
        display_name: z.string().trim().min(1).max(60),
      })
      .safeParse({ username, display_name: displayName });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusyP(true);
    const { error } = await supabase.from("profiles").update(parsed.data).eq("id", user.id);
    setBusyP(false);
    if (error) return toast.error(toUserMessage(error, "Could not update profile."));
    toast.success("Profile updated");
  };

  const changePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) return toast.error("Password must be at least 6 characters");
    setBusyPw(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusyPw(false);
    if (error) return toast.error(toUserMessage(error, "Could not update password."));
    setPw("");
    toast.success("Password updated");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your profile and security</p>
      </div>

      <form onSubmit={saveProfile} className="glass rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold">Profile</h3>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={user?.email ?? ""} disabled className="bg-secondary/40" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="uname">Username</Label>
          <Input
            id="uname"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-secondary/60"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dname">Display name</Label>
          <Input
            id="dname"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="bg-secondary/60"
            required
          />
        </div>
        <Button
          type="submit"
          disabled={busyP}
          className="bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-90"
        >
          {busyP ? "Saving…" : "Save profile"}
        </Button>
      </form>

      <form onSubmit={changePw} className="glass rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold">Change password</h3>
        <div className="space-y-2">
          <Label htmlFor="newpw">New password</Label>
          <PasswordInput
            id="newpw"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="At least 6 characters"
            required
          />
        </div>
        <Button
          type="submit"
          disabled={busyPw}
          className="bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-90"
        >
          {busyPw ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
};
export default Settings;