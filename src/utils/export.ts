import type { SeedData, UserPlan } from '../types';

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function exportJson(data: unknown, fileName: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, fileName);
}

export async function exportSvg(svgElement: SVGSVGElement, fileName: string): Promise<void> {
  const serializer = new XMLSerializer();
  const content = serializer.serializeToString(svgElement);
  const blob = new Blob([content], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, fileName);
}

export async function exportPng(svgElement: SVGSVGElement, fileName: string): Promise<void> {
  const serializer = new XMLSerializer();
  const content = serializer.serializeToString(svgElement);
  const svgBlob = new Blob([content], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 1600;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Could not create canvas context'));
        return;
      }

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Could not convert SVG to PNG blob'));
          return;
        }
        downloadBlob(blob, fileName);
        resolve();
      });
    };

    img.onerror = () => reject(new Error('Could not load svg image'));
    img.src = url;
  });

  URL.revokeObjectURL(url);
}

export function exportActivePlan(plan: UserPlan): void {
  exportJson(plan, `${plan.name.replace(/\s+/g, '-').toLowerCase()}-plan.json`);
}

export function exportFullDatabase(snapshot: SeedData): void {
  exportJson(snapshot, `semester-radial-planner-db-${Date.now()}.json`);
}
