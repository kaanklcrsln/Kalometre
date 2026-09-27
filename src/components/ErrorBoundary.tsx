import { Component, type ReactNode } from "react";

interface State {
  error: Error | null;
}

/** Bir sayfa çökerse bütün uygulama beyaz ekrana düşmesin; kullanıcıya yenileme seçeneği sun. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[Kalometre] Sayfa hatası", error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="fullscreen center">
        <div className="card stack center" role="alert">
          <h2>Bir şeyler ters gitti</h2>
          <p className="muted">Sayfayı yenileyip tekrar dene. Sorun sürerse Ayarlar'dan bize not bırakabilirsin.</p>
          <button type="button" className="btn" onClick={() => window.location.reload()}>
            Sayfayı yenile
          </button>
        </div>
      </main>
    );
  }
}
