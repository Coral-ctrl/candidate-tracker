import { useState } from "react";
import { CandidateList } from "./components/CandidateList";
import { CandidateForm } from "./components/CandidateForm";
import { CandidateDetail } from "./components/CandidateDetail";

// Which screen is showing. A "discriminated union": `name` tells TypeScript which shape it has,
// so candidateId can only be read once we've checked we're on the detail screen.
type View =
  | { name: "list" }
  | { name: "new" }
  | { name: "detail"; candidateId: string };

function App() {
  const [view, setView] = useState<View>({ name: "list" });
  const showList = () => setView({ name: "list" });

  return (
    <main>
      <h1>Candidate Tracker</h1>

      {view.name === "list" && (
        <CandidateList
          onAdd={() => setView({ name: "new" })}
          onSelect={(candidateId) => setView({ name: "detail", candidateId })}
        />
      )}

      {view.name === "new" && (
        <CandidateForm
          onCreated={(candidate) =>
            setView({ name: "detail", candidateId: candidate.id })
          }
          onCancel={showList}
        />
      )}

      {view.name === "detail" && (
        <CandidateDetail candidateId={view.candidateId} onBack={showList} />
      )}
    </main>
  );
}

export default App;
