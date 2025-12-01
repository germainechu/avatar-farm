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
  // Important: Process longer patterns first to avoid partial matches
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
    // Create a fresh regex for each pattern to avoid state issues
    // Use matchAll for cleaner iteration (if available) or ensure proper state management
    const regex = new RegExp(pattern.regex.source, 'g');
    let match;
    // Reset regex lastIndex to ensure we search from the beginning each time
    regex.lastIndex = 0;
    while ((match = regex.exec(text)) !== null) {
      // Only add if content is not empty (after trimming)
      const content = match[1]?.trim() || '';
      if (content.length > 0 && match.index !== undefined) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          content: content,
          style: pattern.style,
        });
      }
      // Prevent infinite loop if regex doesn't advance
      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
      }
    }
  }

  // Remove overlapping matches (keep the longer/more specific one)
  // Sort by length (descending) first, then by start position, so longer matches are processed first
  // This ensures that ***text*** and **text** are matched before *text*
  matches.sort((a, b) => {
    const aLength = a.end - a.start;
    const bLength = b.end - b.start;
    if (bLength !== aLength) {
      return bLength - aLength; // Longer matches first
    }
    return a.start - b.start; // Then by position
  });

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

