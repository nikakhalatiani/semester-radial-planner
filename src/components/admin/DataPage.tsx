import { useState } from 'react';

import builtInSeedJson from '../../data/seed.json';
import { seedDataSchema } from '../../schema/seed';
import type { SeedData } from '../../types';
import {
  clearDevSeedOverride,
  DEV_SEED_OVERRIDE_KEY,
  getDevSeedOverride,
  setDevSeedOverride,
} from '../../utils/devSeed';
import { createCompactSeedSnapshot } from '../../utils/seedSnapshot';

interface DataPageProps {
  canManage: boolean;
  onExport: () => Promise<SeedData>;
  onImport: (payload: SeedData) => Promise<void>;
}

interface SeedWriteResult {
  ok: boolean;
  message?: string;
}

function downloadJson(data: unknown, fileName: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function writeSeedFileInWorkspace(seed: SeedData): Promise<SeedWriteResult> {
  try {
    const response = await fetch('/__dev/seed/write', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(seed),
    });

    const body = (await response.json().catch(() => undefined)) as { message?: string; path?: string } | undefined;
    if (response.ok) {
      return {
        ok: true,
        message: body?.path ? `Wrote ${body.path}` : 'Wrote src/data/seed.json',
      };
    }

    return {
      ok: false,
      message: body?.message ?? `HTTP ${response.status}`,
    };
  } catch {
    return {
      ok: false,
      message: 'Dev file write endpoint unavailable.',
    };
  }
}

export function DataPage({ canManage, onExport, onImport }: DataPageProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [hasDevSeed, setHasDevSeed] = useState(() => Boolean(localStorage.getItem(DEV_SEED_OVERRIDE_KEY)));

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold">Data Import / Export</h3>
      <p className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600">
        Admin edits are saved to IndexedDB immediately. Built-in `src/data/seed.json` is first-run default only.
      </p>
      <p className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600">
        `seed.json` actions below save current state only and intentionally drop admin changelog history to keep the
        seed small.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-xl bg-neutral-900 px-3 py-2 text-sm font-semibold text-white"
          onClick={async () => {
            const data = await onExport();
            downloadJson(data, `planner-db-export-${Date.now()}.json`);
            setStatus('Exported full DB snapshot.');
          }}
        >
          Export Full DB
        </button>

        <button
          type="button"
          className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold"
          onClick={async () => {
            const data = await onExport();
            const compactSeed = createCompactSeedSnapshot(data);
            downloadJson(compactSeed, 'seed.json');
            setStatus('Downloaded compact seed.json snapshot (without changelog).');
          }}
        >
          Download seed.json (compact)
        </button>

        <button
          type="button"
          className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold"
          disabled={!canManage}
          onClick={async () => {
            const builtInSeed = seedDataSchema.parse(builtInSeedJson);
            await onImport(builtInSeed);
            setStatus('Reset IndexedDB from built-in seed.json.');
          }}
        >
          Reset to Built-in Seed
        </button>

        <button
          type="button"
          className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold"
          disabled={!canManage}
          onClick={async () => {
            const data = await onExport();
            const compactSeed = createCompactSeedSnapshot(data);
            setDevSeedOverride(compactSeed);
            setHasDevSeed(true);
            const wroteFile = await writeSeedFileInWorkspace(compactSeed);
            setStatus(
              wroteFile.ok
                ? `Saved compact dev seed override. ${wroteFile.message ?? ''}`.trim()
                : `Saved compact dev seed override only. ${wroteFile.message ?? ''}`.trim(),
            );
          }}
        >
          Save as Dev Seed (+write compact file)
        </button>

        <button
          type="button"
          className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold"
          disabled={!hasDevSeed}
          onClick={async () => {
            const seed = getDevSeedOverride();
            if (!seed) {
              setStatus('No dev seed override found.');
              return;
            }
            await onImport(seed);
            setStatus('Imported saved dev seed into IndexedDB.');
          }}
        >
          Apply Dev Seed
        </button>

        <button
          type="button"
          className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold"
          disabled={!canManage}
          onClick={() => {
            clearDevSeedOverride();
            setHasDevSeed(false);
            setStatus('Cleared local dev seed override.');
          }}
        >
          Clear Dev Seed
        </button>
      </div>

      {status ? <p className="text-sm text-neutral-600">{status}</p> : null}

      <label className="block rounded-2xl border border-dashed border-border p-4 text-sm">
        Import JSON
        <input
          type="file"
          accept="application/json"
          disabled={!canManage}
          className="mt-2 block w-full"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) {
              return;
            }
            const raw = await file.text();
            const parsed = seedDataSchema.parse(JSON.parse(raw));
            await onImport(parsed);
            setStatus(`Imported ${file.name}.`);
          }}
        />
      </label>
    </section>
  );
}
