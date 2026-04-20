import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Sparkles, TrendingUp, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";

type Mode = "signin" | "signup";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const { signIn, signUp } = useAuth();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        await signIn(form.email, form.password);
        toast.success("Welcome back!");
      } else {
        if (form.name.trim().length < 2) throw new Error("Please enter your name");
        if (form.password.length < 6) throw new Error("Password must be at least 6 characters");
        await signUp(form.name.trim(), form.email, form.password);
        toast.success("Account created!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Branding side */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 text-primary-foreground bg-gradient-hero overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="h-11 w-11 rounded-2xl bg-primary-foreground/15 backdrop-blur flex items-center justify-center border border-primary-foreground/20">
            <Wallet className="h-6 w-6" />
          </div>
          <span className="font-display font-bold text-xl">Finly</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 space-y-6 max-w-md"
        >
          <h1 className="font-display text-5xl font-bold leading-[1.05]">
            Money clarity,<br />in seconds.
          </h1>
          <p className="text-primary-foreground/80 text-lg">
            Track every dollar, visualize your habits, and make smarter decisions —
            all wrapped in a delightfully simple experience.
          </p>
          <div className="grid gap-3 pt-4">
            {[
              { icon: TrendingUp, text: "Beautiful, real-time insights" },
              { icon: Sparkles, text: "Animated dashboards & smooth flows" },
              { icon: ShieldCheck, text: "Your data stays on your device" },
            ].map((f, i) => (
              <motion.div
                key={f.text}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex items-center gap-3 text-sm text-primary-foreground/90"
              >
                <div className="h-8 w-8 rounded-lg bg-primary-foreground/15 flex items-center justify-center">
                  <f.icon className="h-4 w-4" />
                </div>
                {f.text}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <p className="text-xs text-primary-foreground/60 relative z-10">
          © {new Date().getFullYear()} Finly — A premium personal finance tracker
        </p>

        {/* floating orbs */}
        <motion.div
          aria-hidden
          className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary-glow/30 blur-3xl"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute -top-20 -left-20 h-80 w-80 rounded-full bg-accent/20 blur-3xl"
          animate={{ scale: [1.1, 1, 1.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-10 w-10 rounded-xl bg-gradient-brand flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">Finly</span>
          </div>

          {/* Toggle */}
          <div className="relative inline-flex p-1 rounded-full bg-muted mb-8">
            {(["signin", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="relative px-5 py-1.5 text-sm font-medium rounded-full transition-colors z-10"
              >
                {mode === m && (
                  <motion.span
                    layoutId="auth-pill"
                    className="absolute inset-0 bg-card shadow-soft rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className={`relative ${mode === m ? "text-foreground" : "text-muted-foreground"}`}>
                  {m === "signin" ? "Sign in" : "Sign up"}
                </span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="font-display text-3xl font-bold mb-2">
                {mode === "signin" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-muted-foreground mb-8">
                {mode === "signin"
                  ? "Sign in to continue tracking your finances."
                  : "Start your journey to financial clarity."}
              </p>

              <form onSubmit={onSubmit} className="space-y-4">
                <AnimatePresence>
                  {mode === "signup" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      <Label htmlFor="name">Full name</Label>
                      <Input
                        id="name"
                        placeholder="Jane Doe"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="h-11"
                        required={mode === "signup"}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="h-11"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-gradient-brand hover:opacity-95 text-primary-foreground font-semibold shadow-glow transition-all"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : mode === "signin" ? "Sign in" : "Create account"}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
                <button
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                  className="text-primary font-semibold hover:underline"
                >
                  {mode === "signin" ? "Create an account" : "Sign in"}
                </button>
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
