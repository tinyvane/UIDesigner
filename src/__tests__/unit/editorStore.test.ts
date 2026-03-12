import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '@/stores/editorStore';

describe('editorStore', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  it('should start with empty canvas', () => {
    const state = useEditorStore.getState();
    expect(state.components.size).toBe(0);
    expect(state.componentOrder).toHaveLength(0);
    expect(state.canvas.width).toBe(1920);
    expect(state.canvas.height).toBe(1080);
  });

  it('should add a component', () => {
    const id = useEditorStore.getState().addComponent('chart_bar', { x: 50, y: 100 });
    const state = useEditorStore.getState();
    expect(state.components.size).toBe(1);
    expect(state.components.get(id)?.type).toBe('chart_bar');
    expect(state.components.get(id)?.x).toBe(50);
    expect(state.components.get(id)?.y).toBe(100);
    expect(state.componentOrder).toContain(id);
  });

  it('should remove components', () => {
    const id1 = useEditorStore.getState().addComponent('chart_bar');
    const id2 = useEditorStore.getState().addComponent('chart_line');
    expect(useEditorStore.getState().components.size).toBe(2);

    useEditorStore.getState().removeComponents([id1]);
    expect(useEditorStore.getState().components.size).toBe(1);
    expect(useEditorStore.getState().components.has(id2)).toBe(true);
  });

  it('should duplicate components with offset', () => {
    const id = useEditorStore.getState().addComponent('stat_card', { x: 100, y: 200 });
    const [newId] = useEditorStore.getState().duplicateComponents([id]);

    const original = useEditorStore.getState().components.get(id)!;
    const copy = useEditorStore.getState().components.get(newId)!;

    expect(copy.type).toBe(original.type);
    expect(copy.x).toBe(original.x + 20);
    expect(copy.y).toBe(original.y + 20);
    expect(copy.id).not.toBe(original.id);
  });

  it('should move components by delta', () => {
    const id = useEditorStore.getState().addComponent('text_title', { x: 100, y: 100 });
    useEditorStore.getState().moveComponents([id], { x: 50, y: -30 });

    const comp = useEditorStore.getState().components.get(id)!;
    expect(comp.x).toBe(150);
    expect(comp.y).toBe(70);
  });

  it('should not move locked components', () => {
    const id = useEditorStore.getState().addComponent('text_title', { x: 100, y: 100 });
    useEditorStore.getState().updateComponent(id, { locked: true });
    useEditorStore.getState().moveComponents([id], { x: 50, y: -30 });

    const comp = useEditorStore.getState().components.get(id)!;
    expect(comp.x).toBe(100);
    expect(comp.y).toBe(100);
  });

  it('should group and ungroup components', () => {
    const id1 = useEditorStore.getState().addComponent('chart_bar');
    const id2 = useEditorStore.getState().addComponent('chart_line');

    const groupId = useEditorStore.getState().groupComponents([id1, id2]);
    expect(useEditorStore.getState().components.get(id1)?.groupId).toBe(groupId);
    expect(useEditorStore.getState().components.get(id2)?.groupId).toBe(groupId);

    useEditorStore.getState().ungroupComponents(groupId);
    expect(useEditorStore.getState().components.get(id1)?.groupId).toBeNull();
    expect(useEditorStore.getState().components.get(id2)?.groupId).toBeNull();
  });

  it('should bring to front and send to back', () => {
    const id1 = useEditorStore.getState().addComponent('chart_bar');
    const id2 = useEditorStore.getState().addComponent('chart_line');
    const id3 = useEditorStore.getState().addComponent('chart_pie');

    useEditorStore.getState().sendToBack([id3]);
    expect(useEditorStore.getState().componentOrder[0]).toBe(id3);

    useEditorStore.getState().bringToFront([id1]);
    const order = useEditorStore.getState().componentOrder;
    expect(order[order.length - 1]).toBe(id1);
  });

  it('should serialize and deserialize', () => {
    useEditorStore.getState().addComponent('chart_bar', { x: 10, y: 20 });
    useEditorStore.getState().addComponent('stat_card', { x: 300, y: 400 });

    const json = useEditorStore.getState().toJSON();
    expect(json.components).toHaveLength(2);
    expect(json.canvas.width).toBe(1920);

    useEditorStore.getState().reset();
    expect(useEditorStore.getState().components.size).toBe(0);

    useEditorStore.getState().loadFromJSON(json);
    expect(useEditorStore.getState().components.size).toBe(2);
  });
});
