'use client';

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signIn, signUp } from "@/src/lib/auth";
import type { UserRole } from "@/src/types/auth";
import { useAuth } from "@/src/hooks/useAuth";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";

type Mode = "login" | "signup";

interface AuthFormProps {
  mode: Mode;
}

function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case "auth/user-not-found":
      return "No account found with this email.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/email-already-in-use":
      return "This email is already in use. Try logging in instead.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  const isSignup = mode === "signup";

  const redirectByRole = (userRole: UserRole) => {
    if (userRole === "mechanic") {
      router.push("/dashboard/mechanic");
    } else {
      router.push("/dashboard/user");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignup) {
        const cred = await signUp(email, password, role, firstName, lastName);
        const userRole = role;
        redirectByRole(userRole);
      } else {
        const cred = await signIn(email, password);
        const token = await cred.user.getIdTokenResult();
        // Prefer role from Firestore via custom claims if configured,
        // but default to "user" until fetched by context.
        const userRole = (token.claims.role as UserRole | undefined) ?? "user";
        redirectByRole(userRole);
      }
    } catch (err: any) {
      const code = err?.code ?? "unknown";
      setError(getFirebaseErrorMessage(code));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (user) {
      redirectByRole(user.role);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-2xl border border-border bg-card/80 p-6 shadow-xl shadow-black/20 backdrop-blur"
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="space-y-1">
        <h1 className="text-xl md:text-3xl font-semibold tracking-tight text-foreground">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          {isSignup
            ? "Track your cars and collaborate with mechanics."
            : "Sign in to manage your services and clients."}
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {isSignup && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            id="first-name"
            type="text"
            required
            label="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
          />
          <Input
            id="last-name"
            type="text"
            required
            label="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
          />
        </div>
      )}

      <Input
        id="email"
        type="email"
        required
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />

      <Input
        id="password"
        type="password"
        required
        minLength={6}
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete={isSignup ? "new-password" : "current-password"}
      />

      {isSignup && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Role</span>
            <span>Select how you&apos;ll use CarTrack.</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={role === "user" ? "solid" : "outline"}
              size="md"
              onClick={() => setRole("user")}
            >
              Car owner
            </Button>
            <Button
              type="button"
              variant={role === "mechanic" ? "solid" : "outline"}
              size="md"
              onClick={() => setRole("mechanic")}
            >
              Mechanic
            </Button>
          </div>
        </div>
      )}

      <Button type="submit" disabled={loading} className="mt-1">
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 animate-spin rounded-full border-[2px] border-white/50 border-t-transparent" />
            {isSignup ? "Creating account..." : "Signing in..."}
          </span>
        ) : isSignup ? (
          "Sign up"
        ) : (
          "Sign in"
        )}
      </Button>

      <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
        <Badge variant="outline">
          Secure by Firebase Authentication
        </Badge>
        {isSignup ? (
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Already have an account?
          </button>
        ) : (
          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Create an account
          </button>
        )}
      </div>
    </motion.form>
  );
}

