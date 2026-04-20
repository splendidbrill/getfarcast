export function extractJSON(raw: string): string {
  raw = raw.trim();

  // Strip markdown code fences
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "").trim();
  }

  // Find the first { or [ (whichever comes first)
  const objIdx = raw.indexOf("{");
  const arrIdx = raw.indexOf("[");
  let start = -1;
  let openChar: string;
  let closeChar: string;

  if (objIdx === -1 && arrIdx === -1) throw new Error("No JSON found in response");

  if (objIdx === -1) { start = arrIdx; openChar = "["; closeChar = "]"; }
  else if (arrIdx === -1) { start = objIdx; openChar = "{"; closeChar = "}"; }
  else if (objIdx < arrIdx) { start = objIdx; openChar = "{"; closeChar = "}"; }
  else { start = arrIdx; openChar = "["; closeChar = "]"; }

  // Walk forward with bracket matching, respecting strings
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\" && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === openChar) depth++;
    if (ch === closeChar) {
      depth--;
      if (depth === 0) return raw.slice(start, i + 1);
    }
  }

  throw new Error("Unterminated JSON structure in response");
}
