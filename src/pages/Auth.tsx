import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StarField from "@/components/StarField";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import tiEmblem from "@/assets/ti-emblem.png";

const emailSchema = z.string().trim().email({ message: "Invalid email address" }).max(255);
const passwordSchema = z.string().min(8, { message: "Password must be at least 8 characters" }).max(72);

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/";

  useEffect(() => {
    if (!loading && user) {
      navigate(from, { replace: true });
    }
  }, [loading, user, from, navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailParse = emailSchema.safeParse(email);
    if (!emailParse.success) {
      toast.error(emailParse.error.errors[0].message);
      return;
    }
    const passParse = passwordSchema.safeParse(password);
    if (!passParse.success) {
      toast.error(passParse.error.errors[0].message);
      return;
    }
    setBusy(true);
    if (tab === "signup") {
      const { error } = await supabase.auth.signUp({
        email: emailParse.data,
        password: passParse.data,
        options: { emailRedirectTo: window.location.origin },
      });
      setBusy(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Account created. Welcome!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailParse.data,
        password: passParse.data,
      });
      setBusy(false);
      if (error) {
        toast.error(error.message);
        return;
      }
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      setBusy(false);
      return;
    }
    // If redirected, browser will navigate away. Otherwise tokens are set.
  };

  return (
    <div className="min-h-screen relative">
      <StarField />
      <div className="relative z-10 max-w-md mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <img src={tiEmblem} alt="Twilight Imperium Emblem" className="w-20 h-20 mx-auto mb-4 drop-shadow-[0_0_15px_hsl(42_85%_55%/0.3)]" />
          <div className="imperial-divider w-48 mx-auto mb-4" />
          <h1 className="font-display text-2xl md:text-3xl font-black tracking-[0.15em] text-primary text-glow mb-2">
            Sign In
          </h1>
          <p className="font-display text-xs uppercase tracking-[0.4em] text-muted-foreground">
            To Begin Your Reign
          </p>
          <div className="imperial-divider w-48 mx-auto mt-4" />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass imperial-border rounded p-6 space-y-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger value="signin" className="font-display text-xs uppercase tracking-[0.15em]">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="font-display text-xs uppercase tracking-[0.15em]">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" />
            <TabsContent value="signup" />
          </Tabs>

          <form onSubmit={handleEmailAuth} className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="bg-input border-border font-body text-foreground focus:border-primary/40 rounded"
            />
            <Input
              type="password"
              placeholder="Password (8+ chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={tab === "signup" ? "new-password" : "current-password"}
              className="bg-input border-border font-body text-foreground focus:border-primary/40 rounded"
            />
            <Button
              type="submit"
              disabled={busy}
              className="w-full font-display text-sm uppercase tracking-[0.2em] glow-primary bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {busy ? "..." : tab === "signup" ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 font-body text-xs uppercase tracking-wider text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleGoogle}
            disabled={busy}
            variant="outline"
            className="w-full font-display text-sm uppercase tracking-[0.15em] border-border text-muted-foreground hover:text-primary hover:border-primary/40"
          >
            Continue with Google
          </Button>
        </motion.div>

        <div className="flex justify-center mt-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="font-display text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-primary">
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
