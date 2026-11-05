import type { CandidateSummary } from "../api/candidates";

interface SummaryPanelProps {
  summary?: CandidateSummary;
  error: string | null;
}

// Only displays what it's given: the request lives in CandidateDetail.
// The text comes from an applicant's resume, so it's rendered as plain text, which React escapes.
export function SummaryPanel({ summary, error }: SummaryPanelProps) {
  return (
    <section>
      <h3>AI summary</h3>

      {error && <p className="error">{error}</p>}
      {!error && !summary && <p>Generating summary...</p>}

      {summary && (
        <>
          {summary.injectionSuspected && (
            <p className="error">
              This text seems to contain instructions aimed at the AI. Read the
              original below before relying on this summary.
            </p>
          )}
          {summary.contentQuality === "unusable" && (
            <p>
              This text couldn't be summarised: it's unreadable, or it isn't a
              resume or cover letter.
            </p>
          )}
          {summary.contentQuality === "limited" && (
            <p>
              There's very little detail in this text, so the summary is
              limited.
            </p>
          )}

          {summary.skills.length > 0 && (
            <p>Skills: {summary.skills.join(", ")}</p>
          )}
          {summary.highlights.length > 0 && (
            <ul>
              {summary.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          )}

          <p>AI-generated. Check anything important against the original.</p>
        </>
      )}
    </section>
  );
}
