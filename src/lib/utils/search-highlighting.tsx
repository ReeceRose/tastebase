/**
 * Search result highlighting utilities
 */

import type { JSX } from "react";

interface HighlightProps {
  text: string;
  searchQuery: string;
  className?: string;
}

/**
 * Component that highlights search terms within text
 */
export function HighlightedText({
  text,
  searchQuery,
  className = "bg-yellow-200 dark:bg-yellow-800 px-1 rounded",
}: HighlightProps) {
  if (!searchQuery || !text) {
    return <span>{text}</span>;
  }

  // Escape special regex characters in search query
  const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Create regex for case-insensitive matching with word boundaries
  const regex = new RegExp(`(${escapedQuery})`, "gi");

  // Split text by search query matches
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) => {
        // Check if this part matches the search query (case-insensitive)
        const isMatch = part.toLowerCase() === searchQuery.toLowerCase();

        return isMatch ? (
          <mark key={`highlight-${index}-${part}`} className={className}>
            {part}
          </mark>
        ) : (
          <span key={`text-${index}-${part}`}>{part}</span>
        );
      })}
    </span>
  );
}

/**
 * Extracts a snippet from text around the search query match
 */
export function extractSnippet(
  text: string,
  searchQuery: string,
  maxLength: number = 200,
): string {
  if (!searchQuery || !text) {
    return text.slice(0, maxLength) + (text.length > maxLength ? "..." : "");
  }

  const query = searchQuery.toLowerCase();
  const lowerText = text.toLowerCase();
  const queryIndex = lowerText.indexOf(query);

  if (queryIndex === -1) {
    // No match found, return beginning of text
    return text.slice(0, maxLength) + (text.length > maxLength ? "..." : "");
  }

  // Calculate snippet bounds around the match
  const halfLength = Math.floor((maxLength - searchQuery.length) / 2);
  let start = Math.max(0, queryIndex - halfLength);
  let end = Math.min(text.length, queryIndex + searchQuery.length + halfLength);

  // Adjust bounds to avoid cutting words in half
  if (start > 0) {
    // Find the next space to avoid cutting a word
    const spaceIndex = text.indexOf(" ", start);
    if (spaceIndex !== -1 && spaceIndex < queryIndex) {
      start = spaceIndex + 1;
    }
  }

  if (end < text.length) {
    // Find the previous space to avoid cutting a word
    const spaceIndex = text.lastIndexOf(" ", end);
    if (spaceIndex !== -1 && spaceIndex > queryIndex + searchQuery.length) {
      end = spaceIndex;
    }
  }

  let snippet = text.slice(start, end);

  // Add ellipsis if we're not at the beginning or end
  if (start > 0) snippet = `...${snippet}`;
  if (end < text.length) snippet = `${snippet}...`;

  return snippet;
}

/**
 * Utility to get search relevance score for ranking results
 */
export function getSearchRelevance(
  text: string,
  searchQuery: string,
  weights: {
    exactMatch: number;
    wordStart: number;
    wordContains: number;
    caseSensitive: number;
  } = {
    exactMatch: 10,
    wordStart: 5,
    wordContains: 2,
    caseSensitive: 1.5,
  },
): number {
  if (!searchQuery || !text) return 0;

  const query = searchQuery.trim().toLowerCase();
  const lowerText = text.toLowerCase();
  let score = 0;

  // Exact match bonus
  if (lowerText === query) {
    score += weights.exactMatch;
  }

  // Check for exact phrase match
  if (lowerText.includes(query)) {
    score += weights.exactMatch * 0.8;
  }

  // Case sensitive match bonus
  if (text.includes(searchQuery)) {
    score += weights.caseSensitive;
  }

  // Word-based scoring
  const queryWords = query.split(/\s+/);
  const textWords = lowerText.split(/\s+/);

  for (const queryWord of queryWords) {
    if (!queryWord) continue;

    for (const textWord of textWords) {
      // Exact word match
      if (textWord === queryWord) {
        score += weights.exactMatch * 0.6;
      }
      // Word starts with query
      else if (textWord.startsWith(queryWord)) {
        score += weights.wordStart;
      }
      // Word contains query
      else if (textWord.includes(queryWord)) {
        score += weights.wordContains;
      }
    }
  }

  // Proximity bonus - closer words get higher scores
  for (let i = 0; i < queryWords.length - 1; i++) {
    const word1 = queryWords[i];
    const word2 = queryWords[i + 1];

    const index1 = lowerText.indexOf(word1);
    const index2 = lowerText.indexOf(word2, index1 + word1.length);

    if (index1 !== -1 && index2 !== -1) {
      const distance = index2 - (index1 + word1.length);
      if (distance < 50) {
        // Words within 50 characters
        score += Math.max(0, 5 - distance / 10);
      }
    }
  }

  return score;
}

/**
 * Highlights multiple search terms in different colors
 */
export function HighlightMultipleTerms({
  text,
  searchTerms,
  className = "px-1 rounded",
}: {
  text: string;
  searchTerms: string[];
  className?: string;
}) {
  if (!searchTerms.length || !text) {
    return <span>{text}</span>;
  }

  const colors = [
    "bg-yellow-200 dark:bg-yellow-800",
    "bg-blue-200 dark:bg-blue-800",
    "bg-green-200 dark:bg-green-800",
    "bg-purple-200 dark:bg-purple-800",
    "bg-orange-200 dark:bg-orange-800",
  ];

  // Create a map of terms to colors for consistent highlighting
  const termColorMap = new Map<string, string>();
  searchTerms.forEach((term, index) => {
    if (term.trim()) {
      termColorMap.set(term.toLowerCase(), colors[index % colors.length]);
    }
  });

  // Split text by all search terms and render as safe React components
  const renderHighlightedText = (): (string | JSX.Element)[] => {
    let parts: (string | JSX.Element)[] = [text];

    searchTerms.forEach((term) => {
      if (!term.trim()) return;

      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${escapedTerm})`, "gi");
      const colorClass = termColorMap.get(term.toLowerCase());

      const newParts: (string | JSX.Element)[] = [];

      parts.forEach((part, partIndex) => {
        if (typeof part === "string") {
          const splitParts = part.split(regex);

          splitParts.forEach((splitPart) => {
            if (splitPart && regex.test(splitPart)) {
              // Create highlighted component for matching text
              newParts.push(
                <mark
                  key={`highlight-${term}-${partIndex}-${splitPart}`}
                  className={`${className} ${colorClass}`}
                >
                  {splitPart}
                </mark>,
              );
            } else if (splitPart) {
              // Keep plain text as string
              newParts.push(splitPart);
            }
          });
        } else {
          // Keep existing JSX elements
          newParts.push(part);
        }
      });

      parts = newParts;
      // Reset regex lastIndex to avoid issues with global flag
      regex.lastIndex = 0;
    });

    return parts;
  };

  return <span>{renderHighlightedText()}</span>;
}
