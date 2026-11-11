import { PaperlessConfig, PaperlessDocument } from '../types';

export async function testPaperlessConnection(
  serverUrl: string,
  apiToken: string
): Promise<{ success: boolean; message: string; isSimulated?: boolean }> {
  try {
    const res = await fetch('/api/paperless/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serverUrl, apiToken }),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Verbindung zum Backend fehlgeschlagen.',
    };
  }
}

export async function searchPaperlessDocuments(
  config: PaperlessConfig,
  query?: string,
  tags?: string[]
): Promise<{ success: boolean; results: PaperlessDocument[]; isSimulated?: boolean }> {
  try {
    const res = await fetch('/api/paperless/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serverUrl: config.serverUrl,
        apiToken: config.apiToken,
        query,
        tags,
      }),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      results: [],
    };
  }
}

export async function uploadSettlementToPaperless(
  config: PaperlessConfig,
  title: string,
  pdfBase64: string,
  tags: string[],
  correspondent?: string
): Promise<{ success: boolean; documentId?: number; message?: string; isSimulated?: boolean }> {
  try {
    const res = await fetch('/api/paperless/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serverUrl: config.serverUrl,
        apiToken: config.apiToken,
        title,
        documentBase64: pdfBase64,
        tags,
        correspondent,
      }),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Upload nach Paperless fehlgeschlagen.',
    };
  }
}
