import {describe, it, expect} from 'vitest';
import {injectCitationsFromMetadata} from '@src/utils/citation-engine';

describe('Grounding Citation Injection Logic', () => {

  it('should find the correct injection point using the text anchor despite index drift', () => {
    // Reality: "Kafka" is at index 10. Metadata says index 14 (+4 drift).
    const rawText = "Expert in Kafka. Next sentence.";
    const metadata = {
      groundingSupports: [{
        segment: {
          startIndex: 14,
          endIndex: 19,
          text: "Kafka" // The engine will find this at index 10 instead
        },
        groundingChunkIndices: [0]
      }]
    };

    const result = injectCitationsFromMetadata(rawText, metadata);
    expect(result).toBe("Expert in Kafka [1.1]. Next sentence.");
  });

  it('should snap outside of Markdown bold formatting by searching for the text anchor', () => {
    const rawText = "He is an **expert** in SRE.";
    const metadata = {
      groundingSupports: [{
        segment: {
          startIndex: 9,
          endIndex: 15,
          text: "expert"
        },
        groundingChunkIndices: [1]
      }]
    };

    const result = injectCitationsFromMetadata(rawText, metadata);
    // Finds "expert", but the while loop snaps past the "**"
    expect(result).toBe("He is an **expert** [1.2] in SRE.");
  });

  it('should snap outside of Markdown italic formatting by searching for the text anchor', () => {
    const rawText = "He is an _expert_ in SRE.";
    const metadata = {
      groundingSupports: [{
        segment: {
          startIndex: 9,
          endIndex: 15,
          text: "expert"
        },
        groundingChunkIndices: [1]
      }]
    };

    const result = injectCitationsFromMetadata(rawText, metadata);
    expect(result).toBe("He is an _expert_ [1.2] in SRE.");
  });


  it.skip('should snap outside of Markdown header formatting by searching for the text anchor', () => {
    const rawText = "## Expert in SRE";
    const metadata = {
      groundingSupports: [{
        segment: {
          startIndex: 9,
          endIndex: 15,
          text: "expert"
        },
        groundingChunkIndices: [1]
      }]
    };

    const result = injectCitationsFromMetadata(rawText, metadata);
    expect(result).toBe("## Expert in SRE [1.2]");
  });

  it('should handle the 3589/3590 case with explicit text anchors', () => {
    const rawText = "Operational excellence.\n* Leadership";
    const metadata = {
      groundingSupports: [
        {
          segment: { startIndex: 0, endIndex: 23, text: "Operational excellence." },
          groundingChunkIndices: [3]
        },
        {
          segment: { startIndex: 24, endIndex: 36, text: "* Leadership" },
          groundingChunkIndices: [0]
        }
      ]
    };

    const result = injectCitationsFromMetadata(rawText, metadata);

    // Result should place [1.4] at the end of line 1, and [1.1] at the end of line 2.
    // If it fails, [1.1] might shift and land inside the word "* Lead[1.1]ership"
    expect(result).toBe("Operational excellence. [1.4]\n* Leadership [1.1]");
  });

  it('should handle multi-paragraph drift without breaking Markdown headers', () => {
    const rawText = "Paragraph One.\n\n### Section 2\nParagraph Two.";
    const metadata = {
      groundingSupports: [
        {
          segment: { startIndex: 0, endIndex: 14, text: "Paragraph One." },
          groundingChunkIndices: [0]
        },
        {
          segment: { startIndex: 30, endIndex: 44, text: "Paragraph Two." },
          groundingChunkIndices: [1]
        }
      ]
    };

    const result = injectCitationsFromMetadata(rawText, metadata);

    // Validates that the injection in paragraph 1 didn't shift
    // the index of the citation in paragraph 2.
    expect(result).toBe("Paragraph One. [1.1]\n\n### Section 2\nParagraph Two. [1.2]");
  });

  it('should recover from 4-character drift by using text-anchor search', () => {
    // SCENARIO: The metadata is shifted 4 characters ahead (e.g. AI internal mismatch)
    // "Quality" starts at index 4 in reality.
    // Metadata says it starts at index 8.
    const rawText = "ABC Quality increases agility. ### Next Section";

    const metadata = {
      groundingSupports: [
        {
          segment: {
            startIndex: 8, // DRIFTED: Points to "ity "
            endIndex: 34,  // DRIFTED: Points into "###"
            text: "Quality increases agility."
          },
          groundingChunkIndices: [2]
        }
      ]
    };

    const result = injectCitationsFromMetadata(rawText, metadata);

    // If it used absolute indices, we'd see: "ABC Quality increases agili [1.3]ty..."
    // If it uses anchors, we see the citation exactly after the period.
    expect(result).toBe("ABC Quality increases agility. [1.3] ### Next Section");
  });

  it('should prevent "Header Mashing" by finding the true end of the claim', () => {
    // The "## [1.3]#" bug simulation
    const rawText = "Last claim.### Summary";
    const metadata = {
      groundingSupports: [{
        segment: {
          startIndex: 4, // Wrong
          endIndex: 14,  // Wrong (Points to "### Su")
          text: "Last claim."
        },
        groundingChunkIndices: [0]
      }]
    };

    const result = injectCitationsFromMetadata(rawText, metadata);

    // Citation must land between the period and the first '#'
    expect(result).toBe("Last claim. [1.1]### Summary");
  });

  it('should correctly stack multiple citations at a single surgical index', () => {
    const rawText = "This claim is supported twice.";
    const metadata = {
      groundingSupports: [{
        segment: { startIndex: 0, endIndex: 30, text: "This claim is supported twice." },
        groundingChunkIndices: [0, 1]
      }]
    };

    const result = injectCitationsFromMetadata(rawText, metadata);
    expect(result).toBe("This claim is supported twice. [1.1] [1.2]");
  });

  /**
   * TEST 5: TABLE INTEGRITY
   * Ensures pipe characters and spacing in tables remain intact.
   */
  it('should maintain Markdown table integrity', () => {
    const rawText = `
| Skill | Level |
|-------|-------|
| Kafka | Senior |`;

    const metadata = {
      groundingSupports: [{
        segment: { startIndex: 18, endIndex: 23, text: "Kafka" },
        groundingChunkIndices: [0]
      }]
    };

    const result = injectCitationsFromMetadata(rawText, metadata);

    // Verify Kafka is cited but the pipe is still the boundary
    expect(result).toContain("| Kafka [1.1] |");
    // Verify the table structure isn't shifted into the next line
    expect(result).toMatch(/\| Kafka \[1\.1\] \| Senior \|/);
  });

  it('should fallback to provided index if the text anchor cannot be found', () => {
    const rawText = "The original text has changed.";
    const metadata = {
      groundingSupports: [{
        segment: {
          startIndex: 4,
          endIndex: 12,
          text: "MISSING_TEXT"
        },
        groundingChunkIndices: [0]
      }]
    };

    const result = injectCitationsFromMetadata(rawText, metadata);
    // Should fall back to index 12 since "MISSING_TEXT" isn't there
    expect(result).toBe("The original [1.1] text has changed.");
  });


})
;