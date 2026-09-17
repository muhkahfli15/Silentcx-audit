import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { formatApiError } from "@/lib/api";
import { Logo } from "@/components/silentcx/primitives";
import { Loader2, CheckCircle2 } from "lucide-react";

const INDUSTRIES = ["F&B", "Retail", "Hospitality", "Beauty & Wellness", "Healthcare", "Automotive", "Other"];

export default function ShopperRegister() {
  const { shopperRegister } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({
    name: "", email: "", whatsapp: "", password: "", dob: "", city: "", address: "",
    gender: "", occupation: "", available_cities: "", transportation: "", experience: "",
    preferred_industry: "F&B", bank: "",
  });
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!agree) return toast.error("Please accept the agreement to continue.");
    setLoading(true);
    try {
      await shopperRegister({ ...f, available_cities: f.available_cities.split(",").map((s) => s.trim()).filter(Boolean) });
      toast.success("Application submitted! Status: Pending Verification.");
      nav("/shopper");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Registration failed");
    } finally { setLoading(false); }
  };

  const Field = ({ k, label, type = "text", ph }) => (
    <div><label className="sx-label">{label}</label><input className="sx-input" type={type} value={f[k]} onChange={set(k)} placeholder={ph} data-testid={`shopper-${k}-input`} /></div>
  );

  return (
    <div className="min-h-screen bg-[#06080C] sx-grid-bg py-10 px-5">
      <div className="max-w-2xl mx-auto sx-fade-up">
        <div className="mb-6"><Logo /></div>
        <div className="sx-card p-7">
          <span className="sx-eyebrow">Join the network</span>
          <h2 className="font-head text-2xl font-bold text-white mt-1">Become a SilentCX Shopper</h2>
          <p className="text-sm text-slate-400 mt-1 mb-6">Get paid to evaluate real customer experiences. Applications are reviewed by our team.</p>
          <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
            <Field k="name" label="Full Name" />
            <Field k="email" label="Email" type="email" />
            <Field k="whatsapp" label="WhatsApp" ph="+62 ..." />
            <Field k="password" label="Password" type="password" />
            <Field k="dob" label="Date of Birth" type="date" />
            <Field k="city" label="City" />
            <div className="sm:col-span-2"><Field k="address" label="Address" /></div>
            <div>
              <label className="sx-label">Gender</label>
              <select className="sx-input" value={f.gender} onChange={set("gender")} data-testid="shopper-gender-select">
                <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <Field k="occupation" label="Occupation" />
            <Field k="available_cities" label="Available Cities" ph="Jakarta, Bogor" />
            <Field k="transportation" label="Transportation" ph="Motorcycle / Car" />
            <div className="sm:col-span-2"><Field k="experience" label="Experience" ph="Describe any mystery shopping experience" /></div>
            <div>
              <label className="sx-label">Preferred Industry</label>
              <select className="sx-input" value={f.preferred_industry} onChange={set("preferred_industry")} data-testid="shopper-industry-select">
                {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
              </select>
            </div>
            <Field k="bank" label="Bank Information" ph="BCA 1234567890" />
            <label className="sm:col-span-2 flex items-start gap-3 text-sm text-slate-300 mt-2 cursor-pointer">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 accent-[#E5A93C]" data-testid="shopper-agree-checkbox" />
              I agree to conduct audits honestly and keep client information confidential.
            </label>
            <button className="sx-btn-primary sm:col-span-2 w-full" disabled={loading} data-testid="shopper-submit-button">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Submit Application</>}
            </button>
          </form>
          <p className="text-sm text-slate-400 mt-5">Already registered? <Link to="/login" className="text-[#E5A93C] hover:underline">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
