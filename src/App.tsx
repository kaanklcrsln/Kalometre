import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router";
import { AvatarProvider } from "./avatar/AvatarProvider";
import { BottomNav } from "./components/BottomNav";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ChatProvider } from "./hooks/chat";
import { SessionContext, useSession } from "./hooks/session";
import { useAccountDisabled } from "./hooks/useAccountDisabled";
import { useAuth } from "./hooks/useAuth";
import { useUserDoc } from "./hooks/useUserDoc";
import { isGoalLocked } from "./lib/calculations";
import { todayKey } from "./lib/dates";
import { signOut } from "./services/auth";
import AddEntry from "./pages/AddEntry";
import Chat from "./pages/Chat";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import Settings from "./pages/Settings";
import Welcome from "./pages/Welcome";

// recharts büyük; yalnızca kilo sayfasında yüklensin.
const Weight = lazy(() => import("./pages/Weight"));
const Admin = lazy(() => import("./pages/Admin"));

const Loading = () => (
  <div className="fullscreen">
    <div className="spinner" style={{ margin: "0 auto" }} />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <AvatarProvider initialMood="sleeping">
        <Root />
      </AvatarProvider>
    </BrowserRouter>
  );
}

function Root() {
  const { user, loading: authLoading } = useAuth();
  const { userDoc, loading: docLoading, error } = useUserDoc(user?.uid ?? null);
  const disabled = useAccountDisabled(user?.uid ?? null);

  if (authLoading || (user && (docLoading || disabled === null))) return <Loading />;
  if (user && disabled) return <AccountRemoved />;
  if (error) return <p className="alert">{error}</p>;
  if (!user) return <Welcome />;
  if (!userDoc) return <Onboarding user={user} mode="new" existing={null} />;

  return (
    <SessionContext.Provider value={{ uid: user.uid, username: user.username, userDoc }}>
      <ChatProvider key={user.uid}>
        <RouteErrorBoundary>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/add" element={<AddEntry />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/weight" element={<Weight />} />
            <Route path="/replan" element={<ReplanGuard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        </RouteErrorBoundary>
        <NavUnlessFullscreen />
      </ChatProvider>
    </SessionContext.Provider>
  );
}

/** Admin tarafından kaldırılan hesap: uygulama kullanılamaz (kurallar da yeni profil açmayı engeller). */
function AccountRemoved() {
  return (
    <main className="fullscreen center">
      <div className="card stack center" role="alert">
        <h2>Hesabın kaldırıldı</h2>
        <p className="muted">Bu hesap yönetici tarafından kaldırıldı. Bir hata olduğunu düşünüyorsan bizimle iletişime geç.</p>
        <button type="button" className="btn" onClick={() => void signOut()}>
          Çıkış yap
        </button>
      </div>
    </main>
  );
}

/** Kilit bitmeden yeni plan yapılamaz. */
function ReplanGuard(): ReactNode {
  const { uid, username, userDoc } = useSession();
  if (userDoc.goal && isGoalLocked(userDoc.goal, todayKey())) return <Navigate to="/settings" replace />;
  return <Onboarding user={{ uid, username }} mode="replan" existing={userDoc} />;
}

/** Sayfa değişince hata durumu sıfırlansın: çöken sayfadan alt barla başka sayfaya geçilebilir. */
function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return <ErrorBoundary key={pathname}>{children}</ErrorBoundary>;
}

function NavUnlessFullscreen() {
  const { pathname } = useLocation();
  return pathname === "/replan" ? null : <BottomNav />;
}
