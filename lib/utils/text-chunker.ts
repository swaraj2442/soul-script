export function chunkText(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200
): string[] {
  // Normalize whitespace and clean the text
  const cleanText = text
    .replace(/\s+/g, ' ')
    .trim();
  
  // If text is smaller than chunk size, return it as a single chunk
  if (cleanText.length <= chunkSize) {
    return [cleanText];
  }
  
  const chunks: string[] = [];
  let startIndex = 0;
  
  while (startIndex < cleanText.length) {
    let endIndex = startIndex + chunkSize;
    
    // If we're not at the end of the text, try to find a good breaking point
    if (endIndex < cleanText.length) {
      // Find the last period, question mark, or exclamation point followed by a space
      const lastSentenceBreak = cleanText.substring(startIndex, endIndex).search(/[.!?]\s[A-Z]/i);
      
      if (lastSentenceBreak !== -1) {
        // Add 2 to include the punctuation and space
        endIndex = startIndex + lastSentenceBreak + 2;
      } else {
        // If no sentence break, try to find the last space
        const lastSpace = cleanText.lastIndexOf(' ', endIndex);
        if (lastSpace > startIndex) {
          endIndex = lastSpace;
        }
      }
    } else {
      // We're at the end of the text
      endIndex = cleanText.length;
    }
    
    // Add the chunk
    chunks.push(cleanText.substring(startIndex, endIndex).trim());
    
    // Move the start index for the next chunk, considering overlap
    startIndex = endIndex - overlap;
    
    // Ensure we're making progress
    if (startIndex <= 0 || startIndex >= cleanText.length) {
      break;
    }
  }
  
  return chunks;
}