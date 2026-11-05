import { useState } from "react";
import { createCandidate, type Candidate } from "../api/candidates";

// Roughly the API's body limit. Checking here gives a friendlier message,
// and stops a huge file being read into the browser's memory for nothing.
const MAX_FILE_BYTES = 100_000;

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  role: "",
  source: "",
  resumeText: "",
};
type FormField = keyof typeof EMPTY_FORM;

interface CandidateFormProps {
  onCreated: (candidate: Candidate) => void;
  onCancel: () => void;
}

export function CandidateForm({ onCreated, onCancel }: CandidateFormProps) {
  // One state object rather than six useStates, since the fields always travel together
  const [fields, setFields] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Copy the object and change one field. React only re-renders if it gets a NEW object,
  // so changing the existing one in place would leave the screen out of date.
  function updateField(field: FormField, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
  }

  // The file is read here in the browser and goes into the same box as pasted text.
  // That means one code path for both, and the backend only ever receives text.
  async function handleFile(file: File | undefined) {
    if (!file) return; // the user cancelled the file picker
    setError(null);

    // `accept` on the input is only a hint, and a PDF read as text would be garbage
    if (!file.name.toLowerCase().endsWith(".txt")) {
      setError("Please choose a .txt file, or paste the text instead.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("That file is too large (the limit is 100 KB).");
      return;
    }

    try {
      updateField("resumeText", await file.text());
    } catch {
      setError("Could not read that file.");
    }
  }

  async function handleSubmit() {
    setError(null);
    setIsSaving(true); // disables the button, so a double-click can't create two candidates
    try {
      // Blank optional fields can be sent as "": the backend trims them and treats them as missing
      onCreated(await createCandidate(fields));
    } catch (caught) {
      // The API's own message, e.g. "a valid email is required"
      setError(
        caught instanceof Error ? caught.message : "Something went wrong"
      );
      setIsSaving(false);
    }
  }

  return (
    <form
      className="form"
      onSubmit={(event) => {
        event.preventDefault(); // otherwise the browser reloads the page on submit
        void handleSubmit(); // `void` says: we handle this promise's errors inside the function
      }}
    >
      <h2>Add candidate</h2>

      {/* `required` and type="email" give instant feedback. They are a convenience, not the
          real check: the service validates everything again, because any client can call the API. */}
      <label>
        Name *
        <input
          required
          value={fields.name}
          onChange={(event) => updateField("name", event.target.value)}
        />
      </label>

      <label>
        Email *
        <input
          required
          type="email"
          value={fields.email}
          onChange={(event) => updateField("email", event.target.value)}
        />
      </label>

      <label>
        Phone
        <input
          type="tel"
          value={fields.phone}
          onChange={(event) => updateField("phone", event.target.value)}
        />
      </label>

      <label>
        Role applied for *
        <input
          required
          value={fields.role}
          onChange={(event) => updateField("role", event.target.value)}
        />
      </label>

      <label>
        Source
        <input
          placeholder="Referral, LinkedIn, ..."
          value={fields.source}
          onChange={(event) => updateField("source", event.target.value)}
        />
      </label>

      <label>
        Upload resume or cover letter (.txt)
        <input
          type="file"
          accept=".txt,text/plain"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
      </label>

      <label>
        Resume or cover letter text *
        <textarea
          required
          rows={12}
          placeholder="Paste the text here, or upload a .txt file above"
          value={fields.resumeText}
          onChange={(event) => updateField("resumeText", event.target.value)}
        />
      </label>

      {error && <p className="error">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="primary" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save candidate"}
        </button>
        {/* type="button" matters: inside a form, a plain <button> would submit it */}
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
