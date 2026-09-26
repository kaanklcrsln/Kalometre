import { NavLink, useLocation } from "react-router";
import { ChatIcon, PlusIcon, SettingsIcon } from "./Icons";

/** Sol: sohbet · orta: kalori ekle · sağ: ayarlar. */
export function BottomNav() {
  // Ana ekranda geçmiş bir gün seçiliyse + o güne kayıt ekler.
  const { pathname, search } = useLocation();
  const addTo = pathname === "/" && search.includes("date=") ? `/add${search}` : "/add";
  return (
    <nav className="bottom">
      <div>
        <NavLink to="/chat" className="side-left">
          <ChatIcon />
          Sohbet
        </NavLink>
        <NavLink to={addTo} className="plus" aria-label="Kalori ekle">
          <PlusIcon />
        </NavLink>
        <NavLink to="/settings" className="side-right">
          <SettingsIcon />
          Ayarlar
        </NavLink>
      </div>
    </nav>
  );
}
