/**
 * Origin Private File System (OPFS) chunk storage.
 *
 * OPFS provides persistent, non-evictable browser storage.
 * Used as the primary chunk store with IndexedDB as query-only fallback.
 */

const ROOT_DIR = "ototabi-chunks";

const SESSION_ID_RE =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})_(.+)_chunk(\d+)\.webm$/i;

type OpfsDir = {
  entries?: () => AsyncIterable<[string, FileSystemHandle]>;
};

async function getRoot(): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(ROOT_DIR, { create: true });
}

function fileName(sessionId: string, chunkIndex: number, trackSid: string): string {
  return `${sessionId}_${trackSid}_chunk${chunkIndex}.webm`;
}

export type OpfsChunkRef = {
  sessionId: string;
  trackSid: string;
  partNumber: number;
};

function parseChunkFileName(name: string): OpfsChunkRef | null {
  const match = name.match(SESSION_ID_RE);
  if (!match) return null;
  return {
    sessionId: match[1]!,
    trackSid: match[2]!,
    partNumber: Number.parseInt(match[3]!, 10),
  };
}

export const opfsStorage = {
  async writeChunk(
    sessionId: string,
    chunkIndex: number,
    trackSid: string,
    blob: Blob,
  ): Promise<void> {
    try {
      const root = await getRoot();
      const fileHandle = await root.getFileHandle(fileName(sessionId, chunkIndex, trackSid), {
        create: true,
      });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
    } catch (err) {
      console.warn(`[OPFS] Failed to write chunk ${chunkIndex} for ${trackSid}:`, err);
    }
  },

  async readChunk(sessionId: string, chunkIndex: number, trackSid: string): Promise<Blob | null> {
    try {
      const root = await getRoot();
      const fileHandle = await root.getFileHandle(fileName(sessionId, chunkIndex, trackSid));
      const file = await fileHandle.getFile();
      return file;
    } catch {
      return null;
    }
  },

  async deleteTrackChunks(sessionId: string, trackSid: string): Promise<void> {
    const prefix = `${sessionId}_${trackSid}_chunk`;
    try {
      const root = await getRoot();
      const toDelete: string[] = [];
      for await (const [name] of (root as OpfsDir).entries?.() ?? []) {
        if (name.startsWith(prefix)) toDelete.push(name);
      }
      await Promise.all(toDelete.map((name) => root.removeEntry(name).catch(() => {})));
    } catch {
      // ignore cleanup errors
    }
  },

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const root = await getRoot();
      const toDelete: string[] = [];
      for await (const [name] of (root as OpfsDir).entries?.() ?? []) {
        if (name.startsWith(`${sessionId}_`)) toDelete.push(name);
      }
      await Promise.all(toDelete.map((name) => root.removeEntry(name).catch(() => {})));
    } catch {
      // ignore cleanup errors
    }
  },

  async listSessionChunks(sessionId: string): Promise<string[]> {
    try {
      const root = await getRoot();
      const names: string[] = [];
      for await (const [name] of (root as OpfsDir).entries?.() ?? []) {
        if (name.startsWith(`${sessionId}_`)) names.push(name);
      }
      return names;
    } catch {
      return [];
    }
  },

  async listAllChunks(): Promise<OpfsChunkRef[]> {
    try {
      const root = await getRoot();
      const refs: OpfsChunkRef[] = [];
      for await (const [name] of (root as OpfsDir).entries?.() ?? []) {
        const parsed = parseChunkFileName(name);
        if (parsed) refs.push(parsed);
      }
      return refs;
    } catch {
      return [];
    }
  },

  async getUsage(): Promise<{ files: number; bytes: number }> {
    try {
      const root = await getRoot();
      let files = 0;
      let bytes = 0;
      for await (const [, handle] of (root as OpfsDir).entries?.() ?? []) {
        if (handle.kind === "file") {
          files++;
          const file = await (handle as FileSystemFileHandle).getFile();
          bytes += file.size;
        }
      }
      return { files, bytes };
    } catch {
      return { files: 0, bytes: 0 };
    }
  },
};
