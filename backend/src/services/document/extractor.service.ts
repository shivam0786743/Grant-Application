import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import path from 'path';
import { logger } from '../../utils/logger';

export interface ExtractedDocument {
  text: string;
  pageCount?: number;
  wordCount: number;
}

export class DocumentExtractorService {
  /**
   * Extracts plain text from an uploaded file buffer based on mimetype or filename extension.
   */
  public async extractText(
    buffer: Buffer,
    filename: string,
    mimetype?: string
  ): Promise<ExtractedDocument> {
    const ext = path.extname(filename).toLowerCase();
    logger.info(`Extracting text from file "${filename}" (ext: ${ext}, mimetype: ${mimetype})`);

    let extracted = '';
    let pageCount: number | undefined;

    try {
      if (ext === '.pdf' || mimetype === 'application/pdf') {
        const pdfData = await pdfParse(buffer);
        extracted = pdfData.text || '';
        pageCount = pdfData.numpages;
      } else if (
        ext === '.docx' ||
        mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        const result = await mammoth.extractRawText({ buffer });
        extracted = result.value || '';
      } else if (
        ext === '.txt' ||
        ext === '.md' ||
        ext === '.json' ||
        mimetype?.startsWith('text/')
      ) {
        extracted = buffer.toString('utf-8');
      } else {
        throw new Error(
          `Unsupported file format: "${ext}". Supported formats are .pdf, .docx, and .txt`
        );
      }
    } catch (err: any) {
      logger.error(`Error parsing document "${filename}": ${err.message}`);
      throw new Error(`Failed to extract content from ${filename}: ${err.message}`);
    }

    const cleanedText = this.cleanExtractedText(extracted);

    if (!cleanedText || cleanedText.trim().length === 0) {
      throw new Error(`The document "${filename}" contains no extractable text or is empty.`);
    }

    const wordCount = cleanedText.trim().split(/\s+/).filter(Boolean).length;

    logger.info(
      `Extracted ${wordCount} words from "${filename}"${pageCount ? ` (${pageCount} pages)` : ''}`
    );

    return {
      text: cleanedText,
      pageCount,
      wordCount
    };
  }

  private cleanExtractedText(raw: string): string {
    return raw
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[\t ]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}

export const documentExtractorService = new DocumentExtractorService();
