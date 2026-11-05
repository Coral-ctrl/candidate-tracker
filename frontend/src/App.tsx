import { useState } from "react";
import { CandidateList } from "./components/CandidateList";
import { CandidateForm } from "./components/CandidateForm";

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

      {/* Temporary placeholder: replaced in 3C */}
      {view.name === "detail" && (
        <section>
          <p>The detail page for candidate {view.candidateId} arrives in 3C.</p>
          <button onClick={showList}>Back to list</button>
        </section>
      )}
    </main>
  );
}

export default App;
