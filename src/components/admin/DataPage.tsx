import { seedDataSchema } from '../../schema/seed';
import type { SeedData } from '../../types';

interface DataPageProps {
  canManage: boolean;
  onExport: () => Promise<SeedData>;
  onImport: (payload: SeedData) => Promise<void>;
}

export function DataPage({ canManage, onExport, onImport }: DataPageProps) {
  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold">Data Import / Export</h3>
      <p className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600">
        Admin edits are saved to IndexedDB in your browser. `src/data/seed.json` is only used for first-run seeding.
      </p>

      <button
        type="button"
        className="rounded-xl bg-neutral-900 px-3 py-2 text-sm font-semibold text-white"
        onClick={async () => {
          const data = await onExport();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = `planner-db-export-${Date.now()}.json`;
          anchor.click();
          URL.revokeObjectURL(url);
        }}
      >
        Export Full DB
      </button>

      <label className="block rounded-2xl border border-dashed border-border p-4 text-sm dark:border-border-dark">
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
          }}
        />
      </label>
    </section>
  );
}
