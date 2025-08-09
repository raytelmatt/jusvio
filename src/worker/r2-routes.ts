import { Hono } from "hono";
import { R2StorageService } from "../shared/r2storage";
import type { Env } from "./types";

const r2Routes = new Hono<{ Bindings: Env }>();

// Serve files directly from R2
r2Routes.get('/files/:fileKey{.+}', async (c) => {
  const fileKey = c.req.param('fileKey');
  
  try {
    const r2Storage = new R2StorageService(c.env.DOCUMENTS_BUCKET);
    const file = await r2Storage.getFile(fileKey);
    
    if (!file) {
      return c.json({ error: 'File not found' }, 404);
    }

    // Set appropriate headers
    c.header('Content-Type', file.httpMetadata?.contentType || 'application/octet-stream');
    c.header('Content-Length', file.size.toString());
    c.header('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    return new Response((file as any).body, {
      headers: c.res.headers,
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return c.json({ error: 'Failed to serve file' }, 500);
  }
});

// Get file metadata
r2Routes.get('/files/:fileKey{.+}/metadata', async (c) => {
  const fileKey = c.req.param('fileKey');
  
  try {
    const r2Storage = new R2StorageService(c.env.DOCUMENTS_BUCKET);
    const metadata = await r2Storage.getFileMetadata(fileKey);
    
    if (!metadata) {
      return c.json({ error: 'File not found' }, 404);
    }

    return c.json({
      key: metadata.key,
      size: metadata.size,
      uploaded: metadata.uploaded,
      httpMetadata: metadata.httpMetadata,
    });
  } catch (error) {
    console.error('Error getting file metadata:', error);
    return c.json({ error: 'Failed to get file metadata' }, 500);
  }
});

export default r2Routes;
