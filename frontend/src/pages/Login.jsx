import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { formatApiError } from "@/lib/api";
import { homePath } from "@/App";
import { Logo } from "@/components/silentcx/primitives";
import { Loader2 } from "lucide-react";

const DEMOS = [
  { label: "Admin", key: "admin", email: "admin@silentcx.demo" },
  { label: "Client · Essential", key: "essential", email: "essential@silentcx.demo" },
  { label: "Client · Insight", key: "insight", email: "insight@silentcx.demo" },
  { label: "Client · Performance", key: "performance", email: "performance@silentcx.demo" },
  { label: "Shopper", key: "shopper", email: "shopper@silentcx.demo" },
];

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const user = await login({ email, password });
      toast.success(`Welcome back, ${user.name}`);
      nav(homePath(user));
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Login failed");
    } finally { setLoading(false); }
  };

  const quick = (em) => { setEmail(em); setPassword("demo123"); };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#06080C]">
      <div className="hidden lg:flex flex-col justify-between p-12 sx-grid-bg border-r border-[#212836]">
        <Logo showTag />
        <div>
          <h1 className="font-head text-4xl font-extrabold text-white leading-tight">See your business through your customer's eyes.</h1>
          <p className="text-slate-400 mt-4 max-w-md">Discreet mystery shopping, rigorous CX audits and evidence-based recommendations — in one premium portal.</p>
        </div>
        <p className="text-xs text-slate-600">Experience. Evidence. Insight. Improvement.</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md sx-fade-up">
          <div className="lg:hidden mb-8"><Logo /></div>
          <h2 className="font-head text-2xl font-bold text-white">Sign in to your portal</h2>
          <p className="text-sm text-slate-400 mt-1 mb-6">Client, Shopper & Admin access.</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="sx-label">Email</label>
              <input className="sx-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="login-email-input" placeholder="you@company.com" />
            </div>
            <div>
              <label className="sx-label">Password</label>
              <input className="sx-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required data-testid="login-password-input" placeholder="••••••••" />
            </div>
            <button className="sx-btn-primary w-full" disabled={loading} data-testid="login-submit-button">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
            </button>
          </form>

          <div className="mt-6">
            <p className="text-xs uppercase tracking-wider text-slate-600 mb-2">Quick demo login (password: demo123)</p>
            <div className="flex flex-wrap gap-2">
              {DEMOS.map((d) => (
                <button key={d.email} onClick={() => quick(d.email)} className="sx-chip border-[#212836] text-slate-300 hover:border-[#E5A93C]/50" data-testid={`demo-${d.key}-button`}>{d.label}</button>
              ))}
            </div>
          </div>

          <p className="text-sm text-slate-400 mt-8">
            New client? <Link to="/register" className="text-[#E5A93C] hover:underline" data-testid="to-register-link">Create an account</Link>
            {" · "}
            <Link to="/become-shopper" className="text-[#E5A93C] hover:underline" data-testid="to-shopper-link">Become a shopper</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
