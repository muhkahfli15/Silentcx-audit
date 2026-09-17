import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { formatApiError } from "@/lib/api";
import { Logo } from "@/components/silentcx/primitives";
import { Loader2 } from "lucide-react";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", email: "", whatsapp: "", password: "" });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(f);
      toast.success("Account created. Let's complete your onboarding.");
      nav("/onboarding");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#06080C] sx-grid-bg">
      <div className="w-full max-w-md sx-fade-up">
        <div className="mb-8"><Logo /></div>
        <div className="sx-card p-7">
          <h2 className="font-head text-2xl font-bold text-white">Create your client account</h2>
          <p className="text-sm text-slate-400 mt-1 mb-6">Start your first Customer Experience audit in minutes.</p>
          <form onSubmit={submit} className="space-y-4">
            <div><label className="sx-label">Full Name</label><input className="sx-input" value={f.name} onChange={set("name")} required data-testid="register-name-input" /></div>
            <div><label className="sx-label">Email</label><input className="sx-input" type="email" value={f.email} onChange={set("email")} required data-testid="register-email-input" /></div>
            <div><label className="sx-label">WhatsApp</label><input className="sx-input" value={f.whatsapp} onChange={set("whatsapp")} required data-testid="register-whatsapp-input" placeholder="+62 ..." /></div>
            <div><label className="sx-label">Password</label><input className="sx-input" type="password" value={f.password} onChange={set("password")} required data-testid="register-password-input" /></div>
            <button className="sx-btn-primary w-full" disabled={loading} data-testid="register-submit-button">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
            </button>
          </form>
          <p className="text-sm text-slate-400 mt-6">Already have an account? <Link to="/login" className="text-[#E5A93C] hover:underline" data-testid="to-login-link">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
