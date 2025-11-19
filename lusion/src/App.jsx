// src/App.jsx
import Canvas3D from "./components/Canvas3D";
import "./app.css"; // laat dit staan als je css hebt, anders mag dit weg

function App() {
  return (
    <div className="app-container">
      <Canvas3D />
    </div>
  );
}

export default App;
