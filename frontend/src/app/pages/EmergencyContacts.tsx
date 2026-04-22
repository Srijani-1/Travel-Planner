import { useState, useEffect } from 'react';
import { Phone, Plus, Trash2, Loader2, CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';
import { api } from '../../api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export default function EmergencyContacts() {
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: '', phone: '', relation: '' });
    const [saving, setSaving] = useState(false);

    // OTP / Verification state
    const [showOtp, setShowOtp] = useState(false);
    const [otp, setOtp] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [tempContact, setTempContact] = useState<any>(null);

    const load = () => api.sos.contacts.list().then(setContacts).catch(() => { }).finally(() => setLoading(false));
    useEffect(() => { load(); }, []);

    const validatePhone = (phone: string) => {
        const re = /^\+?[1-9]\d{1,14}$/;
        return re.test(phone.replace(/\s/g, ''));
    };

    const handleInitialAdd = async () => {
        if (!form.name || !form.phone) {
            toast.error("Please fill name and phone");
            return;
        }
        setSaving(true);
        try {
            await api.sos.contacts.sendOtp({
                name: form.name,
                phone: form.phone,
                relation: form.relation,
            });
            setTempContact({ ...form });
            setShowOtp(true);
            toast.success(`Verification code sent to ${form.phone}`);
        } catch (e: any) {
            // e.message will be the FastAPI detail string
            toast.error(e.message);
        } finally {
            setSaving(false);
        }
    };

    const verifyAndAdd = async () => {
        if (otp.length < 6) {
            toast.error("Enter the 6-digit code");
            return;
        }
        setVerifying(true);
        try {
            await api.sos.contacts.verifyOtp({
                phone: tempContact.phone,
                otp,
            });
            setForm({ name: "", phone: "", relation: "" });
            setShowOtp(false);
            setOtp("");
            setTempContact(null);
            load();
            toast.success("Contact verified and saved!");
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setVerifying(false);
        }
    };

    const remove = async (id: number) => {
        try {
            await api.sos.contacts.delete(id);
            setContacts(prev => prev.filter(c => c.id !== id));
            toast.success("Contact removed");
        } catch (e) {
            toast.error("Failed to remove contact");
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 dark:bg-red-950/30 rounded-2xl">
                    <Phone className="h-6 w-6 text-red-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter">Emergency Contacts</h1>
                    <p className="text-slate-500 text-sm font-medium">SOS alerts will be sent to these verified numbers.</p>
                </div>
            </div>

            {/* Add form */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden relative">
                <h2 className="font-black mb-6 text-[10px] uppercase tracking-[0.2em] text-slate-400">Security Checkpoint</h2>

                <AnimatePresence mode="wait">
                    {!showOtp ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                        >
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-500">Contact Name</label>
                                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                        placeholder="Full Name" className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 font-medium text-sm transition-all" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-500">Phone Number</label>
                                        <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                                            placeholder="+91 98765 43210" className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 font-medium text-sm transition-all" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-500">Relationship</label>
                                        <input value={form.relation} onChange={e => setForm(p => ({ ...p, relation: e.target.value }))}
                                            placeholder="e.g. Parent" className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 font-medium text-sm transition-all" />
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleInitialAdd} disabled={saving || !form.name || !form.phone}
                                className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                                Send Verification Code
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="otp"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6 py-4"
                        >
                            <div className="text-center space-y-2">
                                <p className="text-sm font-bold">Verify {tempContact?.phone}</p>
                                <p className="text-xs text-slate-500">Enter the 6-digit code sent to your contact. <span className="block mt-1 font-bold text-red-500">(SIMULATION: Use 1234)</span></p>
                            </div>
                            <div className="flex justify-center">
                                <input
                                    value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="• • • • • •"
                                    className="text-center text-3xl tracking-[0.5em] font-black w-48 py-4 rounded-2xl border-2 border-slate-200 dark:border-white/10 focus:border-red-500 outline-none bg-slate-50 dark:bg-white/5"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setShowOtp(false)} className="flex-1 py-3.5 border border-slate-200 dark:border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                                    Cancel
                                </button>
                                <button onClick={verifyAndAdd} disabled={verifying || otp.length < 4} className="flex-[2] py-3.5 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                                    {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                                    Verify & Save
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Contact list */}
            <div className="space-y-4">
                <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-1">Trusted Circle</h3>
                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-slate-300" /></div>
                ) : contacts.length === 0 ? (
                    <div className="text-center py-12 bg-slate-100 dark:bg-white/5 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-white/5">
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No trusted contacts added</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {contacts.map(c => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={c.id}
                                className="flex items-center justify-between bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-5 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 font-black">
                                        {c.name[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">{c.name}</p>
                                            {c.is_verified && (
                                                <Badge className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-green-200 dark:border-green-800 text-[10px] font-black uppercase py-0.5">
                                                    Verified
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm font-bold text-slate-500">{c.phone} · <span className="text-slate-400 uppercase text-[10px]">{c.relation || "Contact"}</span></p>
                                    </div>
                                </div>
                                <button onClick={() => remove(c.id)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function Badge({ children, className }: any) {
    return (
        <span className={`px-2 py-0.5 rounded-full ${className}`}>
            {children}
        </span>
    );
}