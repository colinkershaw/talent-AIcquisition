import {describe, it, expect} from 'vitest';
import {generateAssessmentHtml} from '@src/utils/html-generator';
import {GroundedResult} from '@src/grounding-supports';

describe('generateAssessmentHtml', () => {
  const mockResult: GroundedResult = {
    text: "### Header\n* Bullet 1\n* Bullet 2 [1.1]\n\nConclusion text.",
    rawText: "### Header\n* Bullet 1\n* Bullet 2\n\nConclusion text.",
    citationMap: [
      {
        id: 1,
        source: "test.md",
        citedText: "Detailed source content here."
      }
    ],
    rawGroundingMetadata: { groundingChunks: [] } // Simplified for test
  };

  it('should transform markdown headers into <h3> tags', () => {
    const html = generateAssessmentHtml(mockResult);
    expect(html).toContain('<h3>Header</h3>');
    // Ensure it's NOT wrapped in a <p> tag
    expect(html).not.toContain('<p><h3>');
  });

  it('should correctly wrap bullet points in a single <ul> block', () => {
    const html = generateAssessmentHtml(mockResult);
    const ulMatch = html.match(/<ul>(.*?)<\/ul>/s);
    expect(ulMatch).toBeTruthy();
    expect(ulMatch![0]).toContain('<li>Bullet 1</li>');
    expect(ulMatch![0]).toContain('<li>Bullet 2');
  });

  it('should inject interactive citation badges with correct tooltip content', () => {
    const html = generateAssessmentHtml(mockResult);
    // Check for badge class
    expect(html).toContain('class="cite-badge"');
    // Check if ID is present
    expect(html).toContain('>1<');
    // Check if tooltip contains the source and cited text
    expect(html).toContain('Source: test.md');
    expect(html).toContain('Detailed source content here.');
  });

  it('should handle special characters in cited text to prevent HTML breakage', () => {
    const complexResult: GroundedResult = {
      ...mockResult,
      citationMap: [{
        id: 1,
        source: "file.md",
        citedText: 'Text with "quotes" and <tags>'
      }]
    };
    const html = generateAssessmentHtml(complexResult);
    expect(html).toContain('&quot;quotes&quot;');
    expect(html).toContain('&lt;tags&gt;');
  });

  it('should only wrap plain text in <p> tags, skipping existing HTML tags', () => {
    const html = generateAssessmentHtml(mockResult);
    // "Conclusion text." should be in a paragraph
    expect(html).toContain('<p>Conclusion text.</p>');
    // The <ul> and <h3> should not be inside <p>
    const pTags = html.match(/<p>(.*?)<\/p>/g) || [];
    const hasInvalidNesting = pTags.some(p => p.includes('<h3') || p.includes('<ul'));
    expect(hasInvalidNesting).toBe(false);
  });

  it('should render bold text and citations together on the same line', () => {
    const result: GroundedResult = {
      text: "This is **bold** and has a citation [1.1].",
      rawText: "This is **bold** and has a citation.",
      citationMap: [{ id: 1, source: "src.md", citedText: "Source text" }],
      rawGroundingMetadata: { groundingChunks: [] }
    };

    const html = generateAssessmentHtml(result);

    // Assert both bold and citation are rendered as HTML
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('class="cite-badge"');
    expect(html).toContain('>1<');
  });

  it('should render citations inside table cells', () => {
    const result: GroundedResult = {
      text: "| Column A | Column B |\n| --- | --- |\n| Data [1.1] | More Data |",
      rawText: "| Column A | Column B |\n| --- | --- |\n| Data | More Data |",
      citationMap: [{ id: 1, source: "src.md", citedText: "Table info" }],
      rawGroundingMetadata: { groundingChunks: [] }
    };

    const html = generateAssessmentHtml(result);

    expect(html).toContain('<table>');
    expect(html).toContain('<td>Data');
    expect(html).toContain('class="cite-badge"');
  });

  it('should not break bold formatting when a citation is inside or adjacent', () => {
    const result: GroundedResult = {
      // Bug: Citation immediately before the closing stars
      text: "This is **important evidence [1.1]**.",
      rawText: "This is **important evidence**.",
      citationMap: [{ id: 1, source: "test.md", citedText: "Source data" }],
      rawGroundingMetadata: { groundingChunks: [] }
    };

    const html = generateAssessmentHtml(result);

    // If the bug exists, this will likely contain literal "**" because
    // the parser didn't see the closing stars as part of the opening ones.
    expect(html).toContain('<strong>important evidence');
    expect(html).not.toContain('**');
  });

  it('should not break table structure when a citation is in the last cell', () => {
    const result: GroundedResult = {
      // Bug: Citation immediately before the closing pipe of a table
      text: "| Goal | Status |\n| --- | --- |\n| Speed | Fast [1.1] |",
      rawText: "| Goal | Status |\n| --- | --- |\n| Speed | Fast |",
      citationMap: [{ id: 1, source: "test.md", citedText: "Source data" }],
      rawGroundingMetadata: { groundingChunks: [] }
    };

    const html = generateAssessmentHtml(result);

    // If the bug exists, the table will fail to render because the pipe '|'
    // was detached from the row by the citation injection.
    expect(html).toContain('<table>');
    expect(html).toContain('<td>Fast');
  });

  it('should render a table even if the very first cell contains a citation', () => {
    const result: GroundedResult = {
      // If we use regex-replace before marked, the first line becomes:
      // "| <span...>1</span> | Header |"
      // Many MD parsers will fail to see the leading pipe as a table start.
      text: "| [1.1] | Evidence |\n| --- | --- |\n| High | Seniority |",
      rawText: "| [1.1] | Evidence |\n| --- | --- |\n| High | Seniority |",
      citationMap: [{ id: 1, source: "resume.md", citedText: "25 years" }],
      rawGroundingMetadata: { groundingChunks: [] }
    };

    const html = generateAssessmentHtml(result);

    // FAILURE MODE: Returns raw pipes and text instead of <table>
    expect(html).toContain('<table');
    expect(html).toContain('<td');
  });

  it('should render bold correctly when the citation is the ONLY thing inside the stars', () => {
    const result: GroundedResult = {
      // Testing: **[1.1]**
      // Regex replace makes this **<span>...</span>**
      // Most MD parsers will NOT bold this because they see stars touching HTML tags.
      text: "The evidence is **[1.1]**.",
      rawText: "The evidence is **[1.1]**.",
      citationMap: [{ id: 1, source: "resume.md", citedText: "25 years" }],
      rawGroundingMetadata: { groundingChunks: [] }
    };

    const html = generateAssessmentHtml(result);

    // FAILURE MODE: Returns <strong></strong> or just **<span>...</span>**
    expect(html).toContain('<strong><span');
  });

  const mockCitation = { id: 1, source: "res.md", citedText: "Senior logic" };

  it('should render a table correctly when a citation is immediately adjacent to a pipe', () => {
    // BUG: Regex replacement transforms this into: | Data <span...>1</span> |
    // Many parsers fail to see the final '|' as a table closer if it's separated by HTML tags.
    const result: GroundedResult = {
      text: "| Header |\n| --- |\n| Data[1.1] |",
      rawText: "| Header |\n| --- |\n| Data |",
      citationMap: [mockCitation],
      rawGroundingMetadata: { groundingChunks: [] }
    };

    const html = generateAssessmentHtml(result);
    expect(html).toContain('<table');
    expect(html).toContain('<td>Data');
    expect(html).toContain('class="cite-badge"');
  });

  it('should handle citations nested deeply inside bold and italic formatting', () => {
    // BUG: Regex replace makes this ***<span...>1</span>***
    // Parser often sees * * * <span and fails to find the closing * * *
    const result: GroundedResult = {
      text: "This is ***[1.1]*** important.",
      rawText: "This is ***important***.",
      citationMap: [mockCitation],
      rawGroundingMetadata: { groundingChunks: [] }
    };

    const html = generateAssessmentHtml(result);
    expect(html).toContain('<strong><em><span');
  });

  it('should not break a list if a citation starts the line', () => {
    const result: GroundedResult = {
      text: "* [1.1] lead engineer",
      rawText: "* lead engineer",
      citationMap: [mockCitation],
      rawGroundingMetadata: { groundingChunks: [] }
    };

    const html = generateAssessmentHtml(result);
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>');
  });

  it('should convert this simple markdown into bold html', () => {
    // BUG: Regex replacement transforms this into: | Data <span...>1</span> |
    // Many parsers fail to see the final '|' as a table closer if it's separated by HTML tags.
    const result: GroundedResult = {
      text: "**Evidence:** alpha beta **omicron**.",
      rawText: "**Evidence:** alpha beta **omicron**.",
      citationMap: [],
      rawGroundingMetadata: { groundingChunks: [] }
    };

    const html = generateAssessmentHtml(result);
    expect(html).toContain('<strong>Evidence:</strong> alpha beta <strong>omicron</strong>.');
  });

});