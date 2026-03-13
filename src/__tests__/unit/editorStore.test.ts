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

  // ========== Data Source Tests ==========
  describe('data sources', () => {
    it('should add a data source', () => {
      const id = useEditorStore.getState().addDataSource({
        name: 'Test API',
        type: 'api',
        config: { type: 'api', url: 'https://example.com/api', method: 'GET' },
        transform: null,
      });
      expect(useEditorStore.getState().dataSources.size).toBe(1);
      expect(useEditorStore.getState().dataSources.get(id)?.name).toBe('Test API');
    });

    it('should update a data source', () => {
      const id = useEditorStore.getState().addDataSource({
        name: 'Old Name',
        type: 'static',
        config: { type: 'static', data: [1, 2, 3] },
        transform: null,
      });
      useEditorStore.getState().updateDataSource(id, { name: 'New Name' });
      expect(useEditorStore.getState().dataSources.get(id)?.name).toBe('New Name');
    });

    it('should remove a data source and unbind components', () => {
      const dsId = useEditorStore.getState().addDataSource({
        name: 'DS',
        type: 'static',
        config: { type: 'static', data: {} },
        transform: null,
      });
      const compId = useEditorStore.getState().addComponent('chart_bar');
      useEditorStore.getState().bindComponentToDataSource(compId, dsId, { data: '$.values' });

      expect(useEditorStore.getState().components.get(compId)?.dataSourceId).toBe(dsId);

      useEditorStore.getState().removeDataSource(dsId);
      expect(useEditorStore.getState().dataSources.size).toBe(0);
      expect(useEditorStore.getState().components.get(compId)?.dataSourceId).toBeNull();
    });

    it('should bind and unbind components to data sources', () => {
      const dsId = useEditorStore.getState().addDataSource({
        name: 'DS',
        type: 'static',
        config: { type: 'static', data: {} },
        transform: null,
      });
      const compId = useEditorStore.getState().addComponent('chart_bar');

      useEditorStore.getState().bindComponentToDataSource(compId, dsId, { data: '$.items' });
      const comp = useEditorStore.getState().components.get(compId)!;
      expect(comp.dataSourceId).toBe(dsId);
      expect(comp.dataMapping).toEqual({ data: '$.items' });

      useEditorStore.getState().unbindComponentFromDataSource(compId);
      const comp2 = useEditorStore.getState().components.get(compId)!;
      expect(comp2.dataSourceId).toBeNull();
      expect(comp2.dataMapping).toBeNull();
    });

    it('should manage data values and errors', () => {
      const dsId = 'test-ds-id';
      useEditorStore.getState().setDataValue(dsId, { items: [1, 2, 3] });
      expect(useEditorStore.getState().dataValues.get(dsId)).toEqual({ items: [1, 2, 3] });

      useEditorStore.getState().setDataError(dsId, 'Network error');
      expect(useEditorStore.getState().dataErrors.get(dsId)).toBe('Network error');

      useEditorStore.getState().setDataError(dsId, null);
      expect(useEditorStore.getState().dataErrors.has(dsId)).toBe(false);
    });

    it('should manage data loading state', () => {
      const dsId = 'test-ds-id';
      useEditorStore.getState().setDataLoading(dsId, true);
      expect(useEditorStore.getState().dataLoading.has(dsId)).toBe(true);

      useEditorStore.getState().setDataLoading(dsId, false);
      expect(useEditorStore.getState().dataLoading.has(dsId)).toBe(false);
    });

    it('should serialize dataSources in toJSON', () => {
      useEditorStore.getState().addDataSource({
        name: 'DS1',
        type: 'static',
        config: { type: 'static', data: [1] },
        transform: null,
      });
      const json = useEditorStore.getState().toJSON();
      expect(json.dataSources).toHaveLength(1);
      expect(json.dataSources[0].name).toBe('DS1');
    });

    it('should restore dataSources from loadFromJSON', () => {
      const json = {
        canvas: { width: 1920, height: 1080, background: { type: 'color' as const, value: '#000' } },
        components: [],
        dataSources: [
          { id: 'ds1', name: 'API Source', type: 'api' as const, config: { type: 'api' as const, url: 'https://example.com', method: 'GET' as const }, transform: null },
        ],
      };
      useEditorStore.getState().loadFromJSON(json);
      expect(useEditorStore.getState().dataSources.size).toBe(1);
      expect(useEditorStore.getState().dataSources.get('ds1')?.name).toBe('API Source');
    });
  });
});
