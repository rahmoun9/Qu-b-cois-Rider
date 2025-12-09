import Catalogue from "./Catalogue";

export default function App() {
  return (
    <div style={{ background: "#f5f5f5", minHeight: "100vh" }}>
          <header
          style={{
          background: "black",
          color: "white",
          padding: "1rem",
          fontFamily: "sans-serif",
          fontWeight: 600,
          fontSize: "1rem",
         }}>
        Québécois Rider – Accessoires moto
      </header>

      <Catalogue />

      <footer
        style={{
          marginTop: "2rem",
          padding: "1rem",
          textAlign: "center",
          fontSize: "0.8rem",
          color: "#666",
        }}
      >
        Projet de stage – version de développement
      </footer>
    </div>
  );
}
