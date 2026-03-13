import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  saveProjectToIDB,
  loadProjectFromIDB,
  deleteProjectFromIDB,
  listProjectsFromIDB,
} from '@/lib/storage/indexedDB';

const SAMPLE_PROJECT = {
  canvas: { width: 1920, height: 1080, background: { type: 'color', value: '#000' } },
  components: [{ id: 'c1', type: 'chart_bar', x: 0, y: 0, width: 400, height: 300 }],
  dataSources: [],
};

describe('IndexedDB storage', () => {
  beforeEach(async () => {
    // Clean up by deleting test keys
    try {
      await deleteProjectFromIDB('__current__');
      await deleteProjectFromIDB('project-1');
      await deleteProjectFromIDB('project-2');
    } catch {
      // DB might not exist yet
    }
  });

  it('should save and load a project', async () => {
    await saveProjectToIDB(SAMPLE_PROJECT);
    const loaded = await loadProjectFromIDB();
    expect(loaded).not.toBeNull();
    expect(loaded!.canvas.width).toBe(1920);
    expect(loaded!.components).toHaveLength(1);
    expect(loaded!.savedAt).toBeDefined();
  });

  it('should return null for non-existent project', async () => {
    const loaded = await loadProjectFromIDB('nonexistent');
    expect(loaded).toBeNull();
  });

  it('should delete a project', async () => {
    await saveProjectToIDB(SAMPLE_PROJECT);
    await deleteProjectFromIDB();
    const loaded = await loadProjectFromIDB();
    expect(loaded).toBeNull();
  });

  it('should list all projects', async () => {
    await saveProjectToIDB(SAMPLE_PROJECT, 'project-1');
    await saveProjectToIDB({ ...SAMPLE_PROJECT, canvas: { ...SAMPLE_PROJECT.canvas, width: 3840 } }, 'project-2');
    const list = await listProjectsFromIDB();
    expect(list.length).toBeGreaterThanOrEqual(2);
    const keys = list.map((p) => p.key);
    expect(keys).toContain('project-1');
    expect(keys).toContain('project-2');
  });

  it('should overwrite existing project on save', async () => {
    await saveProjectToIDB(SAMPLE_PROJECT);
    await saveProjectToIDB({ ...SAMPLE_PROJECT, components: [] });
    const loaded = await loadProjectFromIDB();
    expect(loaded!.components).toHaveLength(0);
  });

  it('should save with custom key', async () => {
    await saveProjectToIDB(SAMPLE_PROJECT, 'my-project');
    const loaded = await loadProjectFromIDB('my-project');
    expect(loaded).not.toBeNull();
    expect(loaded!.canvas.width).toBe(1920);
    // Clean up
    await deleteProjectFromIDB('my-project');
  });
});
