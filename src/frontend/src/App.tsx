import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import {
  CheckSquare,
  CreditCard,
  HardHat,
  Loader2,
  LogOut,
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
import { useInternetIdentity } from "./hooks/useInternetIdentity";

type Tab = "contracts" | "labours" | "advances" | "payments" | "settled";

const NAV_ITEMS: { id: Tab; label: string; icon: typeof HardHat }[] = [
  { id: "contracts", label: "Contracts", icon: HardHat },
  { id: "labours", label: "Labours", icon: Users },
  { id: "advances", label: "Advances", icon: Wallet },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "settled", label: "Settled", icon: CheckSquare },
];

function LoginScreen() {
  const { login, isLoggingIn, isInitializing } = useInternetIdentity();

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
          <div className="bg-card border border-border rounded-2xl shadow-xl p-8 text-center space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-amber flex items-center justify-center shadow-lg">
                <HardHat className="w-9 h-9 text-yellow-950" />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-bold text-foreground">
                Welcome to AttendPay
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Sign in to manage your contracts, track attendance, and
                calculate salaries securely.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 gap-2 text-left">
              {[
                "Track attendance for Bed, Paper & Mesh work",
                "Auto-calculate salaries from contract amounts",
                "Manage advances and final payments",
              ].map((feature) => (
                <div key={feature} className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-dim mt-0.5 shrink-0" />
                  <span className="text-xs text-muted-foreground">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* Sign in button */}
            {isInitializing ? (
              <div
                data-ocid="login.loading_state"
                className="flex items-center justify-center gap-2 text-muted-foreground py-2"
              >
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Initializing…</span>
              </div>
            ) : (
              <Button
                data-ocid="login.primary_button"
                onClick={login}
                disabled={isLoggingIn}
                className="w-full bg-amber hover:bg-amber/90 text-yellow-950 font-semibold py-5 rounded-xl text-base transition-all shadow-md hover:shadow-lg"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Signing in…
                  </>
                ) : (
                  "Sign in to Continue"
                )}
              </Button>
            )}

            <p className="text-xs text-muted-foreground">
              Uses Internet Identity for secure, passwordless authentication.
            </p>
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
  const { identity, clear, isInitializing } = useInternetIdentity();
  const { isFetching: actorLoading } = useActor();

  // Show login screen if not authenticated
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Toaster richColors position="top-right" />
        <div
          data-ocid="app.loading_state"
          className="flex items-center gap-3 text-muted-foreground"
        >
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="font-display text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  if (!identity) {
    return <LoginScreen />;
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

          {/* Right side: actor loading indicator + sign out */}
          <div className="flex items-center gap-3">
            {actorLoading && (
              <div
                data-ocid="header.loading_state"
                className="flex items-center gap-1.5 text-white/50"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-xs hidden sm:inline">Syncing…</span>
              </div>
            )}
            <button
              type="button"
              data-ocid="header.signout.button"
              onClick={clear}
              title="Sign out"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/10 hover:border-white/25"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
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
