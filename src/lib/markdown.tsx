import React from 'react';

/**
 * Parses markdown-style formatting in text and returns React elements
 * Supports standard Markdown conventions:
 * - *text* or _text_ for italic
 * - **text** or __text__ for bold
 * - ***text*** or ___text___ for bold italic
 */
export function formatMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];

  const parts: React.ReactNode[] = [];
  let currentIndex = 0;
  let key = 0;

  // Regex to match markdown patterns (bold italic first, then bold, then italic)
  // Using non-greedy matching and ensuring content is not empty
  const patterns = [
    { regex: /\*\*\*([^*]+?)\*\*\*/g, style: { fontWeight: 'bold', fontStyle: 'italic' } },
    { regex: /___([^_]+?)___/g, style: { fontWeight: 'bold', fontStyle: 'italic' } },
    { regex: /\*\*([^*]+?)\*\*/g, style: { fontWeight: 'bold' } },
    { regex: /__([^_]+?)__/g, style: { fontWeight: 'bold' } },
    { regex: /\*([^*]+?)\*/g, style: { fontStyle: 'italic' } },
    { regex: /_([^_]+?)_/g, style: { fontStyle: 'italic' } },
  ];

  // Find all matches with their positions
  const matches: Array<{
    start: number;
    end: number;
    content: string;
    style: React.CSSProperties;
  }> = [];

  for (const pattern of patterns) {
    const regex = new RegExp(pattern.regex.source, 'g');
    let match;
    while ((match = regex.exec(text)) !== null) {
      // Only add if content is not empty
      if (match[1].trim().length > 0) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          content: match[1],
          style: pattern.style,
        });
      }
    }
  }

  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start);

  // Remove overlapping matches (keep the first/longer one)
  const nonOverlappingMatches: typeof matches = [];
  for (const match of matches) {
    const overlaps = nonOverlappingMatches.some(
      (existing) =>
        (match.start >= existing.start && match.start < existing.end) ||
        (match.end > existing.start && match.end <= existing.end) ||
        (match.start <= existing.start && match.end >= existing.end)
    );
    if (!overlaps) {
      nonOverlappingMatches.push(match);
    }
  }

  // Sort again after removing overlaps
  nonOverlappingMatches.sort((a, b) => a.start - b.start);

  // Build the result by inserting formatted spans
  for (const match of nonOverlappingMatches) {
    // Add text before the match
    if (match.start > currentIndex) {
      const plainText = text.substring(currentIndex, match.start);
      if (plainText) {
        parts.push(plainText);
      }
    }

    // Add the formatted match
    parts.push(
      <span key={key++} style={match.style}>
        {match.content}
      </span>
    );

    currentIndex = match.end;
  }

  // Add remaining text after the last match
  if (currentIndex < text.length) {
    const remainingText = text.substring(currentIndex);
    if (remainingText) {
      parts.push(remainingText);
    }
  }

  // If no matches were found, return the original text
  if (parts.length === 0) {
    return [text];
  }

  return parts;
}

