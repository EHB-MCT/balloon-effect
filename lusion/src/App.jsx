// src/App.jsx
import { useState } from "react";
import "./App.css";
import Canvas3D from "./components/Canvas3D";

function App() {
  // "home" = landing 3D, "menu" = page blanche
  const [page, setPage] = useState("home");

  // Si on est sur la page MENU → on affiche uniquement ça
  if (page === "menu") {
    return <MenuPage onBack={() => setPage("home")} />;
  }

  // Sinon on affiche la landing comme avant
  return (
    <div className="page">
      {/* HEADER */}
      <header className="top-bar">
        <div className="container top-bar-inner">
          <div className="logo">LUSION</div>

          <div className="top-bar-actions">
            <button className="icon-btn">
              <span>↯</span>
            </button>
            <button className="pill-btn pill-btn--dark">LET'S TALK •</button>

            {/* ICI : on change juste le bouton MENU */}
            <button
              className="pill-btn pill-btn--light"
              onClick={() => setPage("menu")}
            >
              MENU …
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <main className="hero">
        <div className="container hero-inner">
          {/* Texte */}
          <section className="hero-text">
            <h1>
              We help brands create digital
              <br />
              experiences that connect
              <br />
              with their audience
            </h1>
          </section>

          {/* Carte 3D */}
          <section className="hero-3d-wrapper">
            <div className="hero-3d-card">
              <Canvas3D />
            </div>
          </section>

          {/* Bas de page */}
          <footer className="hero-footer"></footer>
        </div>
      </main>
    </div>
  );
}

export default App;
