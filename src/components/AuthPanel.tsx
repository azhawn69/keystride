import { useState } from "react";
import { LogOut, User, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { syncOnSignIn } from "@/lib/cloudSync";

export function AuthPanel() {
  const { session, user, loading, signIn, signUp, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const resetFormMessages = () => {
    setError(null);
    setInfo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormMessages();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error, data } = await signUp(email, password);
        if (error) throw error;
        if (!data.session) {
          setInfo("check your email to confirm your account, then sign in.");
          setBusy(false);
          return;
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
      const {
        data: { user: signedInUser },
      } = await supabase.auth.getUser();
      if (signedInUser) {
        await syncOnSignIn(signedInUser.id);
        window.location.reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "something went wrong");
      setBusy(false);
    }
  };

  if (loading) return null;

  if (session && user) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="hidden max-w-[10rem] truncate text-muted-foreground sm:inline">{user.email}</span>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-1 rounded px-2 py-1 text-muted-foreground transition-colors hover:text-foreground"
          title="sign out"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded border border-border px-3 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <User className="h-3.5 w-3.5" />
        sign in
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-md border border-border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-lg font-semibold tracking-tight">
              {mode === "signin" ? "sign in" : "create account"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">sync your stats and lesson progress across devices</p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-border bg-secondary px-3 py-2 text-sm outline-none focus:border-amber-400/40"
              />
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border border-border bg-secondary px-3 py-2 text-sm outline-none focus:border-amber-400/40"
              />

              {error && <p className="text-xs text-red-400">{error}</p>}
              {info && <p className="text-xs text-amber-400">{info}</p>}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded bg-amber-400 px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "working…" : mode === "signin" ? "sign in" : "sign up"}
              </button>
            </form>

            <button
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                resetFormMessages();
              }}
              className="mt-3 text-xs text-muted-foreground hover:text-foreground"
            >
              {mode === "signin" ? "need an account? sign up" : "already have an account? sign in"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
