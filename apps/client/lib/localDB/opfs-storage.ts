/**
 * Origin Private File System (OPFS) chunk storage.
 *
 * OPFS provides persistent, non-evictable browser storage.
 * Used as the primary chunk store with IndexedDB as query-only fallback.
 */

const ROOT_DIR = "ototabi-chunks";

async function getRoot(): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(ROOT_DIR, { create: true });
}

function fileName(sessionId: string, chunkIndex: number, trackSid: string): string {
  return `${sessionId}_${trackSid}_chunk${chunkIndex}.webm`;
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

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const root = await getRoot();
      const entries: [string, FileSystemHandle][] = [];
      for await (const entry of (root as any).entries?.() ?? []) {
        entries.push(entry);
      }
      const toDelete = entries
        .map(([name]) => name)
        .filter((name) => name.startsWith(`${sessionId}_`));
      for (const name of toDelete) {
        await root.removeEntry(name).catch(() => {});
      }
    } catch {
      // ignore cleanup errors
    }
  },

  async listSessionChunks(sessionId: string): Promise<string[]> {
    try {
      const root = await getRoot();
      const names: string[] = [];
      for await (const [name] of (root as any).entries?.() ?? []) {
        if (name.startsWith(`${sessionId}_`)) names.push(name);
      }
      return names;
    } catch {
      return [];
    }
  },

  async getUsage(): Promise<{ files: number; bytes: number }> {
    try {
      const root = await getRoot();
      let files = 0;
      let bytes = 0;
      for await (const [, handle] of (root as any).entries?.() ?? []) {
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
