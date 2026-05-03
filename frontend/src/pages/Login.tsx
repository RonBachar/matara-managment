import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { FullscreenSpinner, useAuth } from "@/context/AuthContext";
import { auth, googleProvider } from "@/lib/firebase";

export function Login() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return <FullscreenSpinner />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleGoogleSignIn() {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/", { replace: true });
    } catch {
      setErrorMessage("ההתחברות נכשלה. נסה שוב.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 text-foreground">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="space-y-3 text-center">
          <div className="text-sm font-medium tracking-[0.25em] text-muted-foreground">
            MATARA
          </div>
          <h1 className="text-3xl font-semibold">כניסה למערכת</h1>
          <p className="text-sm text-muted-foreground">
            התחבר עם חשבון Google כדי להמשיך.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <Button
            type="button"
            className="w-full"
            onClick={() => void handleGoogleSignIn()}
            disabled={submitting}
          >
            {submitting ? "מתחבר..." : "התחבר עם Google"}
          </Button>

          {errorMessage ? (
            <p className="text-center text-sm text-destructive">{errorMessage}</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
