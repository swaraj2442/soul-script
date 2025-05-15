import PDFParse from 'pdf-parse';
import * as mammoth from 'mammoth';

export async function extractTextFromFile(
  file: Blob,
  mimeType: string
): Promise<string> {
  try {
    switch (mimeType) {
      case 'application/pdf':
        return extractTextFromPdf(file);
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return extractTextFromDocx(file);
      
      case 'text/plain':
        return extractTextFromTxt(file);
      
      default:
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    throw new Error(`Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function extractTextFromPdf(file: Blob): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const data = await PDFParse(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

async function extractTextFromDocx(file: Blob): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('DOCX extraction error:', error);
    throw new Error('Failed to extract text from DOCX');
  }
}

async function extractTextFromTxt(file: Blob): Promise<string> {
  try {
    return await file.text();
  } catch (error) {
    console.error('TXT extraction error:', error);
    throw new Error('Failed to extract text from TXT');
  }
}