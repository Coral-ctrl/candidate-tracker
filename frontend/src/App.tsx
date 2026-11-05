import { useEffect, useState } from "react";

// The shape of the JSON our /api/health route returns
interface HealthResponse {
  status: string;
  database: "connected" | "disconnected";
}

function App() {
  const [healthMessage, setHealthMessage] = useState("Checking connection...");

  useEffect(() => {
    // Goes React → Vite proxy → Express → MongoDB status → back
    fetch("/api/health")
      .then((response) => response.json() as Promise<HealthResponse>)
      .then((data) =>
        setHealthMessage(`API: ${data.status} · Database: ${data.database}`)
      )
      .catch(() =>
        setHealthMessage("Can't reach the API. Is the server running?")
      );
  }, []); // empty array = run once when the page loads

  return (
    <main>
      <h1>Candidate Tracker</h1>
      <p>{healthMessage}</p>
    </main>
  );
}

export default App;
