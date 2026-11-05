import { useEffect, useState } from "react";
import {
  listCandidates,
  STAGES,
  type Candidate,
  type SortBy,
  type Stage,
} from "../api/candidates";
import { formatDate, formatStage } from "../format";

interface CandidateListProps {
  onAdd: () => void; // the parent (App) decides what "add" and "select" navigate to
  onSelect: (candidateId: string) => void;
}

export function CandidateList({ onAdd, onSelect }: CandidateListProps) {
  // What the user has chosen. "" means "no filter" and is what an <option value=""> gives us.
  const [stage, setStage] = useState<Stage | "">("");
  const [role, setRole] = useState("");
  const [sort, setSort] = useState<SortBy>("dateAdded");
  const [includeArchived, setIncludeArchived] = useState(false);

  // What came back from the server
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true); // true only until the first response arrives
  const [error, setError] = useState<string | null>(null);

  // Fill the role dropdown once, from the unfiltered list. Doing this from the filtered list
  // would make options vanish: pick one role and every other role disappears from the dropdown.
  useEffect(() => {
    let ignore = false;
    listCandidates({ includeArchived: true })
      .then((all) => {
        if (!ignore)
          setRoles([...new Set(all.map((candidate) => candidate.role))].sort());
      })
      .catch(() => {
        // Nothing to do: if the API is down, the effect below shows the error to the user.
      });
    return () => {
      ignore = true;
    };
  }, []); // empty array = run once when this component appears

  // Re-fetch whenever a filter changes. The server does the filtering and sorting,
  // so those rules stay in one place (the service you tested in 2B).
  useEffect(() => {
    // If a filter changes while a request is in flight, React runs the cleanup below first.
    // `ignore` then stops the old, slower response from overwriting the newer one.
    let ignore = false;

    listCandidates({
      stage: stage || undefined, // "" -> undefined, so the param isn't sent at all
      role: role || undefined,
      sort,
      includeArchived,
    })
      .then((result) => {
        if (ignore) return;
        setCandidates(result);
        setError(null); // clears an earlier failure once a request succeeds
      })
      .catch((caught: unknown) => {
        if (!ignore)
          setError(
            caught instanceof Error ? caught.message : "Something went wrong"
          );
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [stage, role, sort, includeArchived]); // re-run when any of these change

  return (
    <section>
      <div className="toolbar">
        {/* "Controlled" inputs: React state holds the value, and onChange updates it */}
        <label>
          Stage
          <select
            value={stage}
            // The cast is safe: the only possible values are the <option>s below
            onChange={(event) => setStage(event.target.value as Stage | "")}
          >
            <option value="">All</option>
            {STAGES.map((option) => (
              <option key={option} value={option}>
                {formatStage(option)}
              </option>
            ))}
          </select>
        </label>

        <label>
          Role
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="">All</option>
            {roles.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          Sort by
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortBy)}
          >
            <option value="dateAdded">Date added (newest first)</option>
            <option value="stage">Stage (pipeline order)</option>
          </select>
        </label>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(event) => setIncludeArchived(event.target.checked)}
          />
          Show archived
        </label>

        <button className="primary" onClick={onAdd}>
          Add candidate
        </button>
      </div>

      {/* Exactly one of these four shows: error, loading, empty, or the table */}
      {error && <p className="error">{error}</p>}
      {!error && isLoading && <p>Loading...</p>}
      {!error && !isLoading && candidates.length === 0 && (
        <p>No candidates match these filters.</p>
      )}
      {!error && !isLoading && candidates.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Stage</th>
              <th>Source</th>
              <th>Added</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate) => (
              // key lets React track each row between renders; use a stable id, not the array index
              <tr key={candidate.id}>
                <td>
                  {/* A real button, not a clickable <tr>, so it also works from the keyboard */}
                  <button
                    className="link"
                    onClick={() => onSelect(candidate.id)}
                  >
                    {candidate.name}
                  </button>
                  {candidate.archived && <span className="tag">Archived</span>}
                </td>
                <td>{candidate.role}</td>
                <td>{formatStage(candidate.stage)}</td>
                <td>{candidate.source ?? "-"}</td>
                <td>{formatDate(candidate.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
