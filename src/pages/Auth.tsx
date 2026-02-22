import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

   if (!isLogin) {
  if (!fullName.trim()) {
    toast({
      title: "Name required",
      description: "Please enter your full name.",
      variant: "destructive",
    });
    setLoading(false);
    return;
  }

  const { error } = await signUp(email, password, fullName, {
    redirectTo: "https://fanciful-semifreddo-b15973.netlify.app/auth"
  });

  if (error) {
    toast({
      title: "Signup failed",
      description: error.message,
      variant: "destructive",
    });
  } else {
    toast({
      title: "Check your email",
      description: "We sent you a confirmation link.",
    });
  }
}

    setLoading(false);
  };

  return (
    <div className="relative min-h-screen flex flex-col md:flex-row overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600">
      {/* Background Glow */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-3xl"></div>

      {/* LEFT SIDE */}
      <div className="hidden md:flex w-1/2 text-white p-20 flex-col justify-center relative z-10 space-y-16">
        {/* Logo */}
        <div>
          <h1 className="text-5xl font-bold tracking-tight">Dmless</h1>
          <p className="mt-2 text-indigo-100">
            Smart hiring platform for modern recruiters.
          </p>
        </div>

        {/* Hero Text */}
        <div>
          <h2 className="text-3xl lg:text-4xl font-semibold leading-snug">
            Screen candidates faster.
            <br />
            Hire smarter.
          </h2>
          <p className="mt-6 text-indigo-200 text-lg max-w-md">
            Manage job posts, evaluate applicants and streamline your hiring
            workflow — all in one intuitive dashboard.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-6 text-indigo-100">
          <div className="flex items-start gap-4">
            <div className="w-3 h-3 mt-2 rounded-full bg-white"></div>
            <p>Track applicants in real-time with a unified dashboard</p>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-3 h-3 mt-2 rounded-full bg-white"></div>
            <p>Collaborate with your hiring team seamlessly</p>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-3 h-3 mt-2 rounded-full bg-white"></div>
            <p>Make data-driven hiring decisions faster</p>
          </div>
        </div>

        <p className="text-sm text-indigo-200 pt-6">
          © {new Date().getFullYear()} Dmless. All rights reserved.
        </p>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 md:py-0 relative z-10">
        <div className={`w-full transition-all duration-500 ${isLogin ? "max-w-md" : "max-w-lg"}`}>
          <Card className="rounded-3xl border border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl transition-all duration-500 hover:shadow-[0_25px_70px_rgba(0,0,0,0.2)] hover:-translate-y-1">
            <CardHeader className="space-y-2 text-center pb-6">
              <CardTitle className="text-3xl font-bold tracking-tight">
                {isLogin ? "Welcome back" : "Create your account"}
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                {isLogin
                  ? "Sign in to access your dashboard"
                  : "Start hiring in minutes"}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form
                onSubmit={handleSubmit}
                className={`transition-all duration-300 ${isLogin ? "space-y-5" : "space-y-6"}`}
              >
                {!isLogin && (
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className="h-12 rounded-xl focus-visible:ring-2 focus-visible:ring-indigo-500"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="h-12 rounded-xl focus-visible:ring-2 focus-visible:ring-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-12 rounded-xl focus-visible:ring-2 focus-visible:ring-indigo-500"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
                >
                  {loading
                    ? "Please wait..."
                    : isLogin
                    ? "Sign In"
                    : "Create Account"}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-muted-foreground hover:text-indigo-600 transition-colors duration-200"
                >
                  {isLogin
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Sign in"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
