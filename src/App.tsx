import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router";
import { AvatarProvider } from "./avatar/AvatarProvider";
import { BottomNav } from "./components/BottomNav";
import { ChatProvider } from "./hooks/chat";
import { SessionContext, useSession } from "./hooks/session";
import { useAuth } from "./hooks/useAuth";
import { useUserDoc } from "./hooks/useUserDoc";
import { isGoalLocked } from "./lib/calculations";
import { todayKey } from "./lib/dates";
import AddEntry from "./pages/AddEntry";
import Chat from "./pages/Chat";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import Settings from "./pages/Settings";
import Welcome from "./pages/Welcome";

// recharts büyük; yalnızca kilo sayfasında yüklensin.
const Weight = lazy(() => import("./pages/Weight"));
// Avatar yalnızca hesap oluştururken görünür; giriş yapmış kullanıcı bu kodu indirmez.
const LazyRoamingAvatar = lazy(() => import("./avatar/RoamingAvatar").then((m) => ({ default: m.RoamingAvatar })));
const RoamingAvatar = () => (
  <Suspense fallback={null}>
    <LazyRoamingAvatar />
  </Suspense>
);

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

  if (authLoading || (user && docLoading)) return <Loading />;
  if (error) return <p className="alert">{error}</p>;
  // Hesap oluşturma boyunca avatar ekranın boş alanlarında gezer.
  if (!user)
    return (
      <>
        <Welcome />
        <RoamingAvatar />
      </>
    );
  if (!userDoc)
    return (
      <>
        <Onboarding user={user} mode="new" existing={null} />
        <RoamingAvatar />
      </>
    );

  return (
    <SessionContext.Provider value={{ uid: user.uid, username: user.username, userDoc }}>
      <ChatProvider key={user.uid}>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/add" element={<AddEntry />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/weight" element={<Weight />} />
            <Route path="/replan" element={<ReplanGuard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <NavUnlessFullscreen />
      </ChatProvider>
    </SessionContext.Provider>
  );
}

/** Kilit bitmeden yeni plan yapılamaz. */
function ReplanGuard(): ReactNode {
  const { uid, username, userDoc } = useSession();
  if (userDoc.goal && isGoalLocked(userDoc.goal, todayKey())) return <Navigate to="/settings" replace />;
  return (
    <>
      <Onboarding user={{ uid, username }} mode="replan" existing={userDoc} />
      <RoamingAvatar />
    </>
  );
}

function NavUnlessFullscreen() {
  const { pathname } = useLocation();
  return pathname === "/replan" ? null : <BottomNav />;
}
