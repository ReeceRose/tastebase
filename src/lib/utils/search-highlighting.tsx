/**
 * Search result highlighting utilities
 */

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

  let charOffset = 0;
  return (
    <span>
      {parts.map((part) => {
        const key = `part-${charOffset}`;
        charOffset += part.length;
        const isMatch = part.toLowerCase() === searchQuery.toLowerCase();
        return isMatch ? (
          <mark key={key} className={className}>
            {part}
          </mark>
        ) : (
          <span key={key}>{part}</span>
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
