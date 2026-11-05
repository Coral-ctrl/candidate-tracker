import { useEffect, useState } from "react";
import {
  addNote,
  archiveCandidate,
  generateSummary,
  getCandidate,
  moveStage,
  STAGES,
  unarchiveCandidate,
  type Candidate,
  type Stage,
} from "../api/candidates";
import { formatDate, formatDateTime, formatStage } from "../format";
import { SummaryPanel } from "./SummaryPanel";

function errorMessage(caught: unknown): string {
  return caught instanceof Error ? caught.message : "Something went wrong";
}

interface CandidateDetailProps {
  candidateId: string;
  onBack: () => void;
}

export function CandidateDetail({ candidateId, onBack }: CandidateDetailProps) {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [noteText, setNoteText] = useState("");
  const [isBusy, setIsBusy] = useState(false); // true while a change is being saved

  // Separate errors, because they mean different things and belong in different places.
  // If loading failed there is nothing to show. If a change failed the page is still fine, so
  // keep it and show the message next to the control the user just used: the note form is at
  // the bottom of a long page, where an error at the top could be scrolled out of sight.
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);

  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false; // same stale-response guard as CandidateList
    getCandidate(candidateId)
      .then((result) => {
        if (ignore) return;
        setCandidate(result);
        // The "auto-generate": when a candidate without a summary is opened. StrictMode runs this
        // effect twice in development, but the first run is ignored by then, so only one AI call is made.
        if (!result.summary) {
          generateSummary(candidateId)
            .then(setCandidate)
            .catch((caught: unknown) => setSummaryError(errorMessage(caught)));
        }
      })
      .catch((caught: unknown) => {
        if (!ignore) setLoadError(errorMessage(caught));
      });
    return () => {
      ignore = true;
    };
  }, [candidateId]);

  // Every change works the same way: the API returns the updated candidate, and we show it.
  // The screen only ever displays what the server confirmed, so it can't drift from the database.
  // Returns whether it worked, so the caller can react (e.g. clear the note box).
  async function runAction(
    action: () => Promise<Candidate>,
    showError: (message: string) => void = setActionError
  ): Promise<boolean> {
    setActionError(null);
    setNoteError(null);
    setIsBusy(true); // disables the controls, so two changes can't overlap
    try {
      setCandidate(await action());
      return true;
    } catch (caught) {
      showError(errorMessage(caught));
      return false;
    } finally {
      setIsBusy(false);
    }
  }

  async function handleAddNote() {
    const saved = await runAction(
      () => addNote(candidateId, noteText),
      setNoteError
    );
    if (saved) setNoteText(""); // on failure, keep what was typed so it isn't lost
  }

  // These two early returns mean everything below can rely on `candidate` not being null
  if (loadError) {
    return (
      <section>
        <p className="error">{loadError}</p>
        <button onClick={onBack}>Back to list</button>
      </section>
    );
  }
  if (!candidate) return <p>Loading...</p>;

  return (
    <section>
      <button className="back" onClick={onBack}>
        Back to list
      </button>

      <div className="detail-header">
        <h2>{candidate.name}</h2>
        {candidate.archived && <span className="tag">Archived</span>}

        <div className="detail-actions">
          <label>
            Stage
            {/* No local state: the select always shows the server's value. If a move fails,
                it simply stays on the old stage. Any stage can go to any other, as the brief says. */}
            <select
              value={candidate.stage}
              disabled={isBusy}
              onChange={(event) =>
                void runAction(() =>
                  moveStage(candidateId, event.target.value as Stage)
                )
              }
            >
              {STAGES.map((option) => (
                <option key={option} value={option}>
                  {formatStage(option)}
                </option>
              ))}
            </select>
          </label>

          {/* No "are you sure?" prompt: archiving is reversible, which is why we chose it over delete */}
          <button
            disabled={isBusy}
            onClick={() =>
              void runAction(() =>
                candidate.archived
                  ? unarchiveCandidate(candidateId)
                  : archiveCandidate(candidateId)
              )
            }
          >
            {candidate.archived ? "Unarchive" : "Archive"}
          </button>
        </div>
      </div>

      {actionError && <p className="error">{actionError}</p>}

      <dl className="profile">
        <dt>Email</dt>
        <dd>{candidate.email}</dd>
        <dt>Phone</dt>
        <dd>{candidate.phone ?? "-"}</dd>
        <dt>Role</dt>
        <dd>{candidate.role}</dd>
        <dt>Source</dt>
        <dd>{candidate.source ?? "-"}</dd>
        <dt>Added</dt>
        <dd>{formatDate(candidate.createdAt)}</dd>
      </dl>

      <SummaryPanel summary={candidate.summary} error={summaryError} />

      <h3>Resume or cover letter</h3>
      {/* Plain text in JSX is escaped by React, so a resume containing <script> or other HTML
          displays as harmless text. Never use dangerouslySetInnerHTML for this: it is untrusted input. */}
      <pre className="resume">{candidate.resumeText}</pre>

      <h3>Notes</h3>
      {candidate.notes.length === 0 && <p>No notes yet.</p>}
      <ul className="notes">
        {/* Notes have no id. The index is a safe key here because the list is append-only:
            items are never removed or reordered, so an index always means the same note. */}
        {candidate.notes.map((note, index) => (
          <li key={index}>
            <time dateTime={note.createdAt}>
              {formatDateTime(note.createdAt)}
            </time>
            <p>{note.text}</p>
          </li>
        ))}
      </ul>

      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          void handleAddNote();
        }}
      >
        <label>
          Add a note
          <textarea
            required
            rows={3}
            value={noteText}
            onChange={(event) => setNoteText(event.target.value)}
          />
        </label>
        {noteError && <p className="error">{noteError}</p>}
        <div className="form-actions">
          <button type="submit" className="primary" disabled={isBusy}>
            Add note
          </button>
        </div>
      </form>
    </section>
  );
}
