import { Routes, Route } from "react-router-dom";

function Home() {
  return <div className="p-8 text-center text-2xl">Flowing AI Main</div>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}
