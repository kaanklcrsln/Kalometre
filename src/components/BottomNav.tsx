import { lazy, Suspense } from "react";
import { NavLink, useLocation } from "react-router";
import { HomeIcon, PlusIcon, SettingsIcon } from "./Icons";

// Avatar kütüphanesi ayrı parçada; yüklenene kadar aynı boyutta boş bir daire görünür.
const MascotIcon = lazy(() => import("../avatar/Mascot").then((m) => ({ default: m.MascotIcon })));
const NAV_AVATAR = 26;

/** Sol: Kalo (yapay zekâ sohbeti) · orta: ana sayfada kalori ekle (+), diğer sayfalarda ana sayfaya dön (ev) · sağ: ayarlar. */
export function BottomNav() {
  // Ana ekranda geçmiş bir gün seçiliyse + o güne kayıt ekler.
  const { pathname, search } = useLocation();
  const onHome = pathname === "/";
  const addTo = onHome && search.includes("date=") ? `/add${search}` : "/add";
  return (
    <nav className="bottom">
      <div>
        <NavLink to="/chat" className="side-left">
          <Suspense fallback={<span className="nav-avatar" style={{ width: NAV_AVATAR, height: NAV_AVATAR }} />}>
            <MascotIcon size={NAV_AVATAR} />
          </Suspense>
          Kalo
        </NavLink>
        {onHome ? (
          <NavLink to={addTo} className="plus" aria-label="Kalori ekle">
            <PlusIcon />
          </NavLink>
        ) : (
          <NavLink to="/" end className="plus" aria-label="Ana sayfa">
            <HomeIcon />
          </NavLink>
        )}
        <NavLink to="/settings" className="side-right">
          <SettingsIcon />
          Ayarlar
        </NavLink>
      </div>
    </nav>
  );
}
