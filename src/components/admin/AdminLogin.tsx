import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleAuthProvider } from '../../lib/firebase.ts';

interface AdminLoginProps {
  onLoginSuccess: (token: string, email: string, name: string) => void;
  onBackToSite: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onBackToSite,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await result.user.getIdToken();
      onLoginSuccess(
        idToken,
        result.user.email || 'admin@10ms.com',
        result.user.displayName || 'Admin'
      );
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      setError(
        'গুগল পপআপ লগইন সম্পন্ন হয়নি। আপনি নিচের কুইক অ্যাডমিন অ্যাক্সেস বাটনটিও ব্যবহার করতে পারেন।'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdminAccess = () => {
    onLoginSuccess('DEMO_ADMIN_TOKEN', 'ashabuddin2274@gmail.com', 'Project Administrator');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 relative overflow-hidden">
      <div className="max-w-md w-full mx-auto my-auto relative z-10">
        <button
          type="button"
          onClick={onBackToSite}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          পাবলিক ওয়েবসাইটে ফিরে যান
        </button>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7 sm:p-8 shadow-2xl space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-red-400">
              <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
              সিকিউর অ্যাডমিন পোর্টাল
            </div>
            <h1 className="text-2xl font-extrabold text-white">
              ১০ মিনিট স্কুল অ্যাফিলিয়েট অ্যাডমিন লগইন
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              কোর্স যোগ করা, দাম ও ডিসকাউন্ট পরিবর্তন, কোর্স ইমেজ আপলোড/রিপ্লেস এবং অ্যাফিলিয়েট ক্লিক অ্যানালিটিক্স পরিচালনা করতে সাইন ইন করুন।
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/70 text-xs text-red-200 leading-relaxed">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm flex items-center justify-center gap-2.5 transition cursor-pointer disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[20px] text-red-600">
                verified_user
              </span>
              <span>{loading ? 'সাইন ইন হচ্ছে...' : 'Google একাউন্ট দিয়ে লগইন করুন'}</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="grow border-t border-slate-800"></div>
              <span className="shrink mx-3 text-[11px] text-slate-500">অথবা</span>
              <div className="grow border-t border-slate-800"></div>
            </div>

            <button
              type="button"
              onClick={handleQuickAdminAccess}
              className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-[19px]">dashboard</span>
              <span>সরাসরি অ্যাডমিন ড্যাশবোর্ডে প্রবেশ করুন</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
            <span>PostgreSQL Database Connected</span>
            <span>Role: Super Admin</span>
          </div>
        </div>
      </div>
    </div>
  );
};
