import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import {
  AlertCircle,
  CheckSquare,
  CreditCard,
  Eye,
  HardHat,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { AdvancesTab } from "./components/AdvancesTab";
import { ContractsTab } from "./components/ContractsTab";
import { LaboursTab } from "./components/LaboursTab";
import { PaymentsTab } from "./components/PaymentsTab";
import { SettledTab } from "./components/SettledTab";
import { useActor } from "./hooks/useActor";
import { useAuth } from "./hooks/useAuthContext";

type Tab = "contracts" | "labours" | "advances" | "payments" | "settled";

const NAV_ITEMS: { id: Tab; label: string; icon: typeof HardHat }[] = [
  { id: "contracts", label: "Contracts", icon: HardHat },
  { id: "labours", label: "Labours", icon: Users },
  { id: "advances", label: "Advances", icon: Wallet },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "settled", label: "Settled", icon: CheckSquare },
];

function LoginScreen() {
  const { login, enterGuestMode } = useAuth();

  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const ok = login(loginUsername, loginPassword);
    if (!ok) {
      setLoginError("Invalid username or password.");
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster richColors position="top-right" />

      {/* Header */}
      <header className="nav-bg shadow-lg border-b border-white/10">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-amber flex items-center justify-center">
              <HardHat className="w-5 h-5 text-yellow-950" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold nav-fg leading-none">
                AttendPay
              </h1>
              <p className="text-xs text-white/50 leading-none mt-0.5">
                Attendance & Salary Manager
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Login content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-2xl shadow-xl p-8 space-y-6">
            {/* Icon + Title */}
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-amber flex items-center justify-center shadow-lg">
                  <HardHat className="w-9 h-9 text-yellow-950" />
                </div>
              </div>
              <div className="space-y-1.5">
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Welcome to AttendPay
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Manage contracts, track attendance, and calculate salaries.
                </p>
              </div>
            </div>

            {/* Admin section */}
            <div className="space-y-3">
              {/* ── Admin Login ── */}
              <div className="rounded-xl border border-amber/30 bg-amber/5 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber flex items-center justify-center shrink-0 mt-0.5">
                    <Settings className="w-4.5 h-4.5 text-yellow-950" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-sm">
                        Admin Login
                      </span>
                      <Badge className="text-[10px] px-1.5 py-0 h-4 bg-amber/20 text-amber-900 border border-amber/40 hover:bg-amber/20">
                        Full Access
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Create, edit, and delete contracts, labours, attendance
                      &amp; advances
                    </p>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="login-username"
                      className="text-xs text-foreground font-medium"
                    >
                      Username
                    </Label>
                    <Input
                      id="login-username"
                      data-ocid="login.admin.input"
                      type="text"
                      autoComplete="username"
                      placeholder="Enter username"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="login-password"
                      className="text-xs text-foreground font-medium"
                    >
                      Password
                    </Label>
                    <Input
                      id="login-password"
                      data-ocid="login.admin.textarea"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Enter password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>

                  {loginError && (
                    <div
                      data-ocid="login.admin.error_state"
                      className="flex items-center gap-2 text-destructive text-xs bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {loginError}
                    </div>
                  )}

                  <Button
                    data-ocid="login.admin.primary_button"
                    type="submit"
                    className="w-full bg-amber hover:bg-amber/90 text-yellow-950 font-semibold py-2.5 rounded-lg text-sm transition-all shadow-sm hover:shadow-md"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                </form>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Guest mode */}
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <Eye className="w-4.5 h-4.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-sm">
                        Continue as Guest
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-4 border-amber-400/50 text-amber-700"
                      >
                        View Only
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Browse all data — contracts, attendance, payments —
                      without making changes
                    </p>
                  </div>
                </div>
                <Button
                  data-ocid="login.guest.secondary_button"
                  variant="outline"
                  onClick={enterGuestMode}
                  className="w-full font-medium py-2.5 rounded-lg text-sm"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Browse as Guest
                </Button>
              </div>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 gap-1.5 pt-1">
              {[
                "Track attendance for Bed, Paper & Mesh work",
                "Auto-calculate salaries from contract amounts",
                "Manage advances and final payments",
              ].map((feature) => (
                <div key={feature} className="flex items-start gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-dim mt-0.5 shrink-0" />
                  <span className="text-xs text-muted-foreground">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 px-4 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              window.location.hostname,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("contracts");
  const { isLoggedIn, isGuest, logout, exitGuestMode } = useAuth();
  const { isFetching: actorLoading } = useActor();

  // Show login screen only if: not logged in as admin AND not in guest mode
  if (!isLoggedIn && !isGuest) {
    return <LoginScreen />;
  }

  function handleSignOut() {
    logout();
    exitGuestMode();
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster richColors position="top-right" />

      {/* Header */}
      <header className="nav-bg shadow-lg border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-amber flex items-center justify-center">
              <HardHat className="w-5 h-5 text-yellow-950" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold nav-fg leading-none">
                AttendPay
              </h1>
              <p className="text-xs text-white/50 leading-none mt-0.5">
                Attendance & Salary Manager
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2.5">
            {actorLoading && (
              <div
                data-ocid="header.loading_state"
                className="flex items-center gap-1.5 text-white/50"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-xs hidden sm:inline">Syncing…</span>
              </div>
            )}

            {/* Role badge */}
            {isLoggedIn ? (
              <Badge className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 hover:bg-emerald-500/20">
                Admin
              </Badge>
            ) : (
              <Badge className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-200 border border-amber-400/30 hover:bg-amber-500/20">
                Guest
              </Badge>
            )}

            {/* Guest: show Sign In button */}
            {!isLoggedIn && isGuest && (
              <button
                type="button"
                data-ocid="header.signin.button"
                onClick={exitGuestMode}
                title="Sign in as Admin"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white/80 hover:text-white bg-amber/20 hover:bg-amber/30 transition-all border border-amber/30 hover:border-amber/50"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            {/* Authenticated admin: show Sign Out button */}
            {isLoggedIn && (
              <button
                type="button"
                data-ocid="header.signout.button"
                onClick={handleSignOut}
                title="Sign out"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/10 hover:border-white/25"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Nav tabs */}
        <nav className="max-w-[1400px] mx-auto px-4 flex gap-1 pb-0 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                type="button"
                key={item.id}
                data-ocid={`nav.${item.id}.tab`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-md transition-all whitespace-nowrap border-b-2 ${
                  isActive
                    ? "bg-background text-foreground border-amber"
                    : "nav-fg border-transparent hover:bg-white/10 hover:border-white/30"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 py-6">
        {activeTab === "contracts" && <ContractsTab />}
        {activeTab === "labours" && <LaboursTab />}
        {activeTab === "advances" && <AdvancesTab />}
        {activeTab === "payments" && <PaymentsTab />}
        {activeTab === "settled" && <SettledTab />}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 px-4 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              window.location.hostname,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
