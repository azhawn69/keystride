import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { clearCurrentUser, setCurrentUserId, syncOnSignIn } from "@/lib/cloudSync";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const backgroundSyncedRef = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      const existingUser = data.session?.user;
      if (existingUser && !backgroundSyncedRef.current) {
        backgroundSyncedRef.current = true;
        setCurrentUserId(existingUser.id);
        // Quiet catch-up sync for a session restored on load — no reload,
        // just makes sure any cross-device changes land in localStorage.
        syncOnSignIn(existingUser.id).catch((err) => console.error("background sync failed", err));
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        setCurrentUserId(newSession.user.id);
      } else {
        clearCurrentUser();
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const signUp = useCallback((email: string, password: string) => supabase.auth.signUp({ email, password }), []);

  const signIn = useCallback(
    (email: string, password: string) => supabase.auth.signInWithPassword({ email, password }),
    [],
  );

  const signOut = useCallback(() => {
    clearCurrentUser();
    return supabase.auth.signOut();
  }, []);

  return { session, user: session?.user ?? null, loading, signUp, signIn, signOut };
}
