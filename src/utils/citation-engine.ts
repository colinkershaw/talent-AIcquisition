/**
 * Optimal approach: Uses text search to insert citations; it seems character offsets drift.
 * Processes in REVERSE to keep character indices stable during injection.
 */
export function injectCitationsFromMetadata(text: string, metadata: any): string {
  if (!metadata?.groundingSupports) return text;

  let enrichedText = text;

  // Sort by endIndex descending so character shifts don't break earlier indices
  const sortedSupports = [...metadata.groundingSupports].sort((a, b) =>
    (b.segment?.endIndex ?? 0) - (a.segment?.endIndex ?? 0)
  );

  for (const support of sortedSupports) {
    const segmentText = support.segment?.text;
    const providedEnd = support.segment?.endIndex;
    if (!segmentText || providedEnd === undefined) continue;

    // 2. The Anchor Search: Find where the text REALLY is
    let injectionIndex = enrichedText.indexOf(segmentText);

    if (injectionIndex !== -1) {
      // Success: Use the found location + text length
      injectionIndex += segmentText.length;
    } else {
      // Fallback: If AI hallucinated the text, trust the provided index
      injectionIndex = providedEnd;
    }

    // 3. Formatting Guard: Ensure we don't land inside a Markdown bold block
    // (e.g. text ends with "word" but rawText is "word**")
    while (injectionIndex < enrichedText.length && /[*_]/.test(enrichedText[injectionIndex])) {
      injectionIndex++;
    }

      // 4. SEPARATE BRACKETS: [1.1] [1.2]
      const labels = support.groundingChunkIndices
        .map((i: number) => ` [1.${ i + 1 }]`)
        .join(""); // This creates " [1.1] [1.2]"

      // 5. Inject at the verified location
      enrichedText =
      enrichedText.slice(0, injectionIndex) +
        labels +
      enrichedText.slice(injectionIndex);
  }

  return enrichedText;
}
