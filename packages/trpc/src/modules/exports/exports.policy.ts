import type { ExportAssetStatus } from "./exports.dto";

export const exportsPolicy = {
  canViewSession: (session: { id: string } | null): session is { id: string } => !!session,

  canBundleAssets(
    assets: Array<{ id: string; status: ExportAssetStatus }>,
    selectedIds: string[],
  ): { ok: true } | { ok: false; notReadyIds: string[]; unknownIds: string[] } {
    const byId = new Map(assets.map((a) => [a.id, a]));
    const notReadyIds: string[] = [];
    const unknownIds: string[] = [];

    for (const id of selectedIds) {
      const asset = byId.get(id);
      if (!asset) {
        unknownIds.push(id);
        continue;
      }
      if (asset.status !== "ready") notReadyIds.push(id);
    }

    if (notReadyIds.length > 0 || unknownIds.length > 0) {
      return { ok: false, notReadyIds, unknownIds };
    }
    return { ok: true };
  },
};
