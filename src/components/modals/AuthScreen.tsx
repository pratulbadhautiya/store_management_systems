import React, { useState } from 'react';
import { Store, ShieldCheck, Lock, Mail, Phone, MapPin, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

export const AuthScreen: React.FC = () => {
  const { login, register, switchDemoTenant } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('rahul@sharmastore.in');
  const [loginPassword, setLoginPassword] = useState('password123');

  // Register Form State
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('password123');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      await register({
        shopName,
        ownerName,
        email: regEmail,
        phone: regPhone,
        address: regAddress,
        password: regPassword,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
      {/* Container */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center font-bold text-white text-2xl mx-auto shadow-lg shadow-emerald-950">
            M
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-1.5">
            MyShoply
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
              Multi-Tenant SaaS
            </span>
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            AI-powered shop management operating system for grocery & retail shopkeepers
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 rounded-xl text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Form Toggle Tabs */}
        <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs font-semibold">
          <button
            onClick={() => { setIsRegisterMode(false); setErrorMsg(''); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              !isRegisterMode ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In to Shop
          </button>
          <button
            onClick={() => { setIsRegisterMode(true); setErrorMsg(''); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              isRegisterMode ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register New Store
          </button>
        </div>

        {/* Login Form */}
        {!isRegisterMode ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Email / Store Login</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isLoading ? 'Signing In...' : 'Enter Shop Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* Register New Shop Form */
          <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Shop / Business Name *</label>
              <div className="relative">
                <Store className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Super Mart"
                  value={shopName}
                  onChange={e => setShopName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Owner Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rohit Mehra"
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98000 11223"
                  value={regPhone}
                  onChange={e => setRegPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Email / Login ID *</label>
              <input
                type="email"
                required
                placeholder="rohit@apexmart.in"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Store Address</label>
              <input
                type="text"
                placeholder="Shop 10, Sector 4, Indirapuram"
                value={regAddress}
                onChange={e => setRegAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Password *</label>
              <input
                type="password"
                required
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              <span>{isLoading ? 'Creating Tenant Workspace...' : 'Create Shop & Start Operating'}</span>
            </button>
          </form>
        )}

        {/* Quick Demo Shop Presets */}
        <div className="pt-2 border-t border-slate-800 text-xs">
          <p className="text-[10px] uppercase font-semibold text-slate-500 text-center tracking-wider mb-2">
            Instant Demo Multi-Tenant Launch:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => switchDemoTenant('sharma')}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-left transition-colors"
            >
              <p className="font-bold text-white text-[11px]">Sharma General Store</p>
              <p className="text-[10px] text-slate-400">Delhi · Grocery / Kirana</p>
            </button>

            <button
              onClick={() => switchDemoTenant('green')}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-left transition-colors"
            >
              <p className="font-bold text-white text-[11px]">Green Basket Supermarket</p>
              <p className="text-[10px] text-slate-400">Mumbai · Mini Supermarket</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
