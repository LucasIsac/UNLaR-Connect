/**
 * Extract plain text content from a document file buffer.
 * Supports PDF (via pdf-parse), TXT, and MD formats natively.
 */
export async function extractTextFromBuffer(buffer: Buffer, fileType: string): Promise<string> {
  const normalizedType = fileType.toLowerCase();

  if (normalizedType === 'pdf') {
    try {
      // Dynamic require to prevent browser/bundler resolution crash
      const pdf = require('pdf-parse');
      const data = await pdf(buffer);
      return data.text || '';
    } catch (error) {
      console.error("Parser Error: Failed to parse PDF file.", error);
      throw new Error("No se pudo extraer el texto del archivo PDF.");
    }
  }

  // Raw text, markdown or generic textual files
  if (normalizedType === 'txt' || normalizedType === 'md' || normalizedType === 'text' || normalizedType === 'markdown') {
    return buffer.toString('utf-8');
  }

  // Fallback: try decoding as UTF-8 string
  return buffer.toString('utf-8');
}

/**
 * Split text into semantic sliding window chunks of a given size with overlap.
 * Attempts to align splits with sentence boundaries or word boundaries to preserve coherence.
 */
export function chunkText(text: string, chunkSize: number = 700, overlap: number = 150): string[] {
  if (!text || text.trim() === '') return [];

  // Normalize multiple spaces or linebreaks to a single space
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < cleanText.length) {
    let endIndex = startIndex + chunkSize;

    if (endIndex >= cleanText.length) {
      chunks.push(cleanText.slice(startIndex));
      break;
    }

    // Search for a sentence boundary (.!? followed by space) within the last 100 characters of the window
    let optimalEnd = endIndex;
    const windowSlice = cleanText.slice(Math.max(startIndex, endIndex - 100), Math.min(cleanText.length, endIndex + 20));
    
    // Find sentence ends
    const matches = Array.from(windowSlice.matchAll(/[.!?](?:\s|$)/g));
    if (matches.length > 0) {
      // Pick the last matching sentence boundary inside the window
      const lastMatch = matches[matches.length - 1];
      const matchIndex = lastMatch.index !== undefined ? lastMatch.index : -1;
      if (matchIndex !== -1) {
        optimalEnd = Math.max(startIndex, endIndex - 100) + matchIndex + 1; // split after the punctuation mark
      }
    } else {
      // Fallback: split at the last space to avoid cutting words in half
      const lastSpaceIndex = cleanText.slice(endIndex - 30, endIndex).lastIndexOf(' ');
      if (lastSpaceIndex !== -1) {
        optimalEnd = (endIndex - 30) + lastSpaceIndex;
      }
    }

    const chunk = cleanText.slice(startIndex, optimalEnd).trim();
    if (chunk.length > 10) {
      chunks.push(chunk);
    }

    startIndex = optimalEnd - overlap;

    // Safeguard to prevent potential infinite loops
    if (startIndex >= optimalEnd) {
      startIndex = optimalEnd;
    }
  }

  return chunks.filter(c => c.length > 15);
}
