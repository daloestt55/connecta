import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard } from "@/app/components/design-system/GlassCard";
import { Input } from "@/app/components/design-system/Input";
import { Button } from "@/app/components/design-system/Button";
import { Lock, Mail, User, ArrowRight, ShieldCheck, Send } from "lucide-react";
import { supabase } from "@/app/utils/supabase";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import { toast, Toaster } from "sonner";

interface AuthProps {
  onLogin: () => void;
}

export function Auth({ onLogin }: AuthProps) {
  const [view, setView] = useState<"login" | "register" | "2fa" | "email-verify" | "forgot-password">("login");
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
    // Password reset handler
    const handlePasswordReset = async (e: React.FormEvent) => {
      e.preventDefault();
      setResetLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
        if (error) throw error;
        toast.success("Password reset email sent!", {
          description: "Check your inbox for further instructions."
        });
        setView("login");
        setResetEmail("");
      } catch (error: any) {
        toast.error(error.message || "Failed to send reset email");
      } finally {
        setResetLoading(false);
      }
    };
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [trustPassword, setTrustPassword] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  
  // Email Verification State
  const [verificationCode, setVerificationCode] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [codeInputs, setCodeInputs] = useState(["", "", "", "", "", ""]);
  const [twoFAInputs, setTwoFAInputs] = useState(["", "", "", "", "", ""]);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const trustedDeviceTtlMs = 30 * 24 * 60 * 60 * 1000;
  
  // Development mode - bypasses Telegram verification
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';

  const getTrustedDeviceKey = (userId: string) => `connecta_2fa_trusted_${userId}`;
  const getTrustedDevicesListKey = (userId: string) => `connecta_2fa_trusted_devices_${userId}`;
  const getDeviceId = () => {
    const key = "connecta_device_id";
    const existing = localStorage.getItem(key);
    if (existing) return existing;

    const generated = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    localStorage.setItem(key, generated);
    return generated;
  };

  const getDeviceLabel = () => {
    const platform = navigator.platform || "Device";
    const ua = navigator.userAgent || "Browser";
    const shortUa = ua.length > 80 ? `${ua.slice(0, 77)}...` : ua;
    return `${platform} | ${shortUa}`;
  };

  const isTrustedDevice = (userId: string) => {
    const raw = localStorage.getItem(getTrustedDeviceKey(userId));
    if (!raw) return false;

    try {
      const payload = JSON.parse(raw);
      if (!payload?.expiresAt || Date.now() > payload.expiresAt) {
        localStorage.removeItem(getTrustedDeviceKey(userId));
        return false;
      }
      return true;
    } catch {
      localStorage.removeItem(getTrustedDeviceKey(userId));
      return false;
    }
  };

  const trustDevice = (userId: string) => {
    const deviceId = getDeviceId();
    const payload = {
      deviceId,
      createdAt: Date.now(),
      expiresAt: Date.now() + trustedDeviceTtlMs
    };
    localStorage.setItem(getTrustedDeviceKey(userId), JSON.stringify(payload));

    const listKey = getTrustedDevicesListKey(userId);
    const rawList = localStorage.getItem(listKey);
    const existingList = rawList ? JSON.parse(rawList) : [];
    const filtered = Array.isArray(existingList) ? existingList : [];
    const updated = filtered.filter((item: any) => item?.id !== deviceId);

    updated.push({
      id: deviceId,
      label: getDeviceLabel(),
      createdAt: payload.createdAt,
      expiresAt: payload.expiresAt,
      lastVerifiedAt: Date.now()
    });

    localStorage.setItem(listKey, JSON.stringify(updated));
  };

  const updateStoredUser = (user: any, fallbackEmail?: string, fallbackUsername?: string) => {
    const raw = localStorage.getItem('connecta_current_user');
    let stored: any = {};
    try {
      stored = raw ? JSON.parse(raw) : {};
    } catch {
      stored = {};
    }

    const metadataName = user?.user_metadata?.name || user?.user_metadata?.username;
    const nextUser = {
      id: user?.id || stored.id || "user-1",
      username: stored.username || metadataName || fallbackUsername || "User",
      email: user?.email || fallbackEmail || stored.email || "user@example.com",
      role: stored.role || "admin",
      isVerified: stored.isVerified ?? false,
      verificationStatus: stored.verificationStatus || "none",
      avatar: stored.avatar
    };

    localStorage.setItem('connecta_current_user', JSON.stringify(nextUser));
  };

  // Email validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Generate 6-digit verification code
  const generateVerificationCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Send verification code via Telegram
  const sendTelegramCode = async (chatId: string, code: string): Promise<boolean> => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/send-telegram-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          chatId: chatId,
          code: code
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Telegram send error:', result);
        toast.error("Failed to send code", {
          description: result.error || "Check console for details"
        });
        return false;
      }
      
      console.log('Telegram code sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Failed to send Telegram message:', error);
      toast.error("Network error", {
        description: "Could not connect to Telegram service"
      });
      return false;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        throw userError || new Error("Failed to load user session");
      }

      updateStoredUser(userData.user, email);

      // Check 2FA status - fallback to disabled if Edge Function is not available
      let twoFAEnabled = false;
      try {
        const { data, error: statusError } = await supabase.functions.invoke("twofa", {
          body: { action: "status" }
        });

        if (!statusError && data?.enabled) {
          twoFAEnabled = true;
        }
      } catch (err) {
        console.warn("2FA check failed, continuing without 2FA:", err);
      }

      if (twoFAEnabled) {
        if (isTrustedDevice(userData.user.id)) {
          toast.success("Welcome back!", {
            description: "Trusted device recognized"
          });
          onLogin();
          return;
        }

        setTwoFAInputs(["", "", "", "", "", ""]);
        setRememberDevice(false);
        setView("2fa");
      } else {
        toast.success("Welcome back!", {
          description: "Successfully logged in"
        });
        onLogin();
      }
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.message === "Failed to fetch") {
        toast.error("Network error: Unable to connect to authentication server.");
      } else {
        toast.error(error.message || "Failed to sign in");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // In dev mode, skip to email verification directly
    if (isDevMode) {
      toast.success("Dev Mode: Verification bypassed", {
        description: "In development, no Telegram code needed"
      });
      const mockCode = "123456";
      setSentCode(mockCode);
      setView("email-verify");
      return;
    }
    
    // Validate Telegram Chat ID
    if (!telegramChatId || telegramChatId.trim().length === 0) {
      toast.error("Telegram Chat ID required", {
        description: "Please enter your Telegram Chat ID"
      });
      return;
    }
    
    // Validate email format
    if (!isValidEmail(email)) {
      toast.error("Invalid email format", {
        description: "Please enter a valid email address"
      });
      return;
    }
    
    // Validate password match
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    // Validate password strength
    if (password.length < 8) {
      toast.error("Password too weak", {
        description: "Password must be at least 8 characters"
      });
      return;
    }

    setLoading(true);

    try {
      // Generate and send verification code
      const code = generateVerificationCode();
      setSentCode(code);
      
      const codeSent = await sendTelegramCode(telegramChatId, code);
      
      if (!codeSent) {
        throw new Error("Failed to send verification code to Telegram");
      }
      
      toast.success("Check your Telegram!", {
        description: "We sent you a 6-digit verification code",
        duration: 5000
      });
      
      // Start resend timer
      setCanResend(false);
      setResendTimer(60);
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      setView("email-verify");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const enteredCode = codeInputs.join("");
    
    if (enteredCode.length !== 6) {
      toast.error("Please enter all 6 digits");
      return;
    }
    
    // In dev mode, accept any 6-digit code
    if (isDevMode && enteredCode.length === 6) {
      toast.success("Dev Mode: Code accepted", {
        description: "Proceeding with registration"
      });
    } else if (enteredCode !== sentCode) {
      toast.error("Invalid verification code", {
        description: "Please check the code and try again"
      });
      // Clear inputs
      setCodeInputs(["", "", "", "", "", ""]);
      return;
    }
    
    setLoading(true);

    try {
      // Now proceed with actual registration
      const functionUrl = `https://${projectId}.supabase.co/functions/v1/make-server-aaae2b4c/signup`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          email,
          password,
          name: username
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      toast.success("Email verified! Account created.", {
        description: "You can now sign in"
      });
      
      // Clear form and go to login
      setEmail("");
      setPassword("");
      setUsername("");
      setConfirmPassword("");
      setCodeInputs(["", "", "", "", "", ""]);
      setView("login");
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
         toast.error("Network error: Unable to reach registration server.");
      } else {
         toast.error(error.message || "Failed to create account");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    
    const code = generateVerificationCode();
    setSentCode(code);
    
    const sent = await sendTelegramCode(telegramChatId, code);
    
    if (sent) {
      toast.success("New code sent!", {
        description: "Check your Telegram"
      });
      
      setCanResend(false);
      setResendTimer(60);
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleCodeInput = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0];
    }
    
    if (!/^\d*$/.test(value)) {
      return;
    }
    
    const newInputs = [...codeInputs];
    newInputs[index] = value;
    setCodeInputs(newInputs);
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codeInputs[index] && index > 0) {
      const prevInput = document.getElementById(`code-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleTwoFAInput = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0];
    }

    if (!/^\d*$/.test(value)) {
      return;
    }

    const newInputs = [...twoFAInputs];
    newInputs[index] = value;
    setTwoFAInputs(newInputs);

    if (value && index < 5) {
      const nextInput = document.getElementById(`twofa-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleTwoFAKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !twoFAInputs[index] && index > 0) {
      const prevInput = document.getElementById(`twofa-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handle2FA = async (e: React.FormEvent) => {
    e.preventDefault();

    const enteredCode = twoFAInputs.join("");
    if (enteredCode.length !== 6) {
      toast.error("Please enter all 6 digits");
      return;
    }

    setLoading(true);

    const { error } = await supabase.functions.invoke("twofa", {
      body: { action: "verify", code: enteredCode }
    });

    if (error) {
      toast.error("Invalid 2FA code", {
        description: error.message || "Please try again"
      });
      setLoading(false);
      return;
    }

    if (rememberDevice) {
      if (!trustPassword || trustPassword !== password) {
        toast.error("Confirm your password to trust this device", {
          description: "Password confirmation is required"
        });
        setLoading(false);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        updateStoredUser(userData.user, email);
        trustDevice(userData.user.id);
      }
    }

    // Save to localStorage if "Remember Me" is checked
    if (rememberMe) {
      localStorage.setItem('connecta_remembered', 'true');
      localStorage.setItem('connecta_user_email', email);
    } else {
      localStorage.removeItem('connecta_remembered');
      localStorage.removeItem('connecta_user_email');
    }

    setLoading(false);
    setTwoFAInputs(["", "", "", "", "", ""]);
    setRememberDevice(false);
    onLogin();
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0A0C] flex items-center justify-center p-4 relative overflow-hidden">
      <Toaster position="top-right" theme="dark" />
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-cyan-900/10 rounded-full blur-[100px] pointer-events-none" />

      <GlassCard className="w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 mb-4 border border-white/5">
            <Lock className="w-6 h-6 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Connecta Secure</h1>
          <p className="text-gray-400 text-sm">End-to-end encrypted communication signal.</p>
        </div>

        <AnimatePresence mode="wait">
          {view === "login" && (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
              onSubmit={handleLogin}
            >
              <Input
                label="Email"
                type="email"
                placeholder="name@company.com"
                leftIcon={<Mail className="w-4 h-4" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {/* Remember Me Checkbox */}
              <div className="flex items-center gap-2 px-1">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-white/5 border-white/20 text-blue-500 focus:ring-2 focus:ring-blue-500/30 cursor-pointer transition-all"
                />
                <label htmlFor="rememberMe" className="text-sm text-gray-400 hover:text-gray-300 cursor-pointer select-none transition-colors">
                  Remember me
                </label>
              </div>
              <Button type="submit" className="w-full" isLoading={loading} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Sign In
              </Button>
              <div className="flex flex-col items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setView("forgot-password")}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  onClick={() => setView("register")}
                  className="text-sm text-gray-500 hover:text-blue-400 transition-colors"
                >
                  Create secure account
                </button>
              </div>
            </motion.form>
          )}

          {view === "forgot-password" && (
            <motion.form
              key="forgot-password"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
              onSubmit={handlePasswordReset}
            >
              <div className="text-center space-y-2">
                <ShieldCheck className="w-10 h-10 text-blue-400 mx-auto mb-2 opacity-80" />
                <h2 className="text-lg font-semibold text-white">Reset your password</h2>
                <p className="text-sm text-gray-400">Enter your email and we’ll send you a reset link.</p>
              </div>
              <Input
                label="Email"
                type="email"
                placeholder="name@company.com"
                leftIcon={<Mail className="w-4 h-4" />}
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" isLoading={resetLoading} rightIcon={<Send className="w-4 h-4" />}>
                Send reset link
              </Button>
              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() => setView("login")}
                  className="text-xs text-gray-500 hover:text-white transition-colors"
                >
                  Back to login
                </button>
              </div>
            </motion.form>
          )}

          {view === "register" && (
            <motion.form
              key="register"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
              onSubmit={handleRegister}
            >
              <Input
                label="Email"
                type="email"
                placeholder="name@company.com"
                leftIcon={<Mail className="w-4 h-4" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Username"
                type="text"
                placeholder="Choose a handle"
                leftIcon={<User className="w-4 h-4" />}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <div className="space-y-2">
                <Input
                  label="Telegram Chat ID"
                  type="text"
                  placeholder="123456789"
                  leftIcon={<Send className="w-4 h-4" />}
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500 px-1 space-y-1">
                  <span className="block">
                    1. Message{" "}
                    <a 
                      href="https://t.me/userinfobot" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      @userinfobot
                    </a>
                    {" "}to get your Chat ID
                  </span>
                  <span className="block text-yellow-500">
                    2. ⚠️ Write <span className="font-mono">/start</span> to your verification bot first!
                  </span>
                </p>
              </div>
              <Input
                label="Password"
                type="password"
                placeholder="Create strong password"
                leftIcon={<Lock className="w-4 h-4" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Repeat password"
                leftIcon={<Lock className="w-4 h-4" />}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" isLoading={loading}>
                Create Account
              </Button>
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setView("login")}
                  className="text-sm text-gray-500 hover:text-blue-400 transition-colors"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </motion.form>
          )}

          {view === "email-verify" && (
            <motion.form
              key="email-verify"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
              onSubmit={handleVerifyEmail}
            >
              <div className="text-center space-y-2">
                <Send className="w-12 h-12 text-blue-500 mx-auto mb-2 opacity-80" />
                <h3 className="text-lg font-semibold text-white">Verify via Telegram</h3>
                <p className="text-sm text-gray-400">
                  We sent a 6-digit code to your Telegram<br />
                  <span className="text-blue-400 font-medium">Check your messages</span>
                </p>
              </div>

              <div className="flex justify-center gap-2">
                {codeInputs.map((value, index) => (
                  <input
                    key={index}
                    id={`code-input-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value}
                    onChange={(e) => handleCodeInput(index, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                    className="w-12 h-14 rounded-lg bg-white/5 border border-white/10 text-center text-2xl font-bold text-white focus:border-blue-500 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <Button type="submit" className="w-full" isLoading={loading}>
                Verify Email
              </Button>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-500">
                  Didn't receive the code?
                </p>
                <button 
                  type="button" 
                  onClick={handleResendCode}
                  disabled={!canResend}
                  className="text-sm font-medium text-blue-400 hover:text-blue-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                  {canResend ? 'Resend code' : `Resend in ${resendTimer}s`}
                </button>
              </div>
              
              <div className="text-center">
                <button 
                  type="button" 
                  onClick={() => {
                    setView("register");
                    setCodeInputs(["", "", "", "", "", ""]);
                  }} 
                  className="text-xs text-gray-500 hover:text-white transition-colors"
                >
                  Back to registration
                </button>
              </div>
            </motion.form>
          )}

          {view === "2fa" && (
            <motion.form
              key="2fa"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
              onSubmit={handle2FA}
            >
              <div className="text-center space-y-2">
                 <ShieldCheck className="w-12 h-12 text-teal-500 mx-auto mb-2 opacity-80" />
                 <p className="text-sm text-gray-400">Enter the 6-digit code from your authenticator app.</p>
              </div>

                <div className="flex justify-center gap-2">
                  {twoFAInputs.map((value, index) => (
                    <input
                     key={index}
                     id={`twofa-input-${index}`}
                     type="text"
                     inputMode="numeric"
                     maxLength={1}
                     value={value}
                     onChange={(e) => handleTwoFAInput(index, e.target.value)}
                     onKeyDown={(e) => handleTwoFAKeyDown(index, e)}
                     className="w-10 h-12 rounded-lg bg-white/5 border border-white/10 text-center text-xl text-white focus:border-blue-500 focus:bg-white/10 focus:ring-1 focus:ring-blue-500/20 transition-all outline-none"
                     autoFocus={index === 0}
                    />
                  ))}
                </div>

              <div className="flex items-center gap-2 px-1">
                <input
                  type="checkbox"
                  id="rememberDevice"
                  checked={rememberDevice}
                  onChange={(e) => {
                    setRememberDevice(e.target.checked);
                    if (!e.target.checked) {
                      setTrustPassword("");
                    }
                  }}
                  className="w-4 h-4 rounded bg-white/5 border-white/20 text-blue-500 focus:ring-2 focus:ring-blue-500/30 cursor-pointer transition-all"
                />
                <label htmlFor="rememberDevice" className="text-sm text-gray-400 hover:text-gray-300 cursor-pointer select-none transition-colors">
                  Remember this device for 30 days
                </label>
              </div>

              {rememberDevice && (
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Re-enter your password"
                  leftIcon={<Lock className="w-4 h-4" />}
                  value={trustPassword}
                  onChange={(e) => setTrustPassword(e.target.value)}
                  required
                />
              )}

              <Button type="submit" className="w-full" isLoading={loading}>
                Verify Identity
              </Button>
              
                <div className="text-center">
                  <button type="button" onClick={async () => {
                   await supabase.auth.signOut();
                   setView("login");
                  }} className="text-xs text-gray-500 hover:text-white">
                    Back to login
                 </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
           <p className="text-xs text-gray-600 flex items-center justify-center gap-2">
             <Lock className="w-3 h-3" /> End-to-end encrypted by default
           </p>
        </div>
      </GlassCard>
    </div>
  );
}
