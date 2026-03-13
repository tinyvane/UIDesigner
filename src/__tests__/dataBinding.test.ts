import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '@/stores/editorStore';

describe('Data Source Binding', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  it('should bind a data source to a component', () => {
    const store = useEditorStore.getState();
    const compId = store.addComponent('chart_bar');
    const dsId = store.addDataSource({
      name: 'Test DS',
      type: 'static',
      config: { type: 'static', data: { categories: ['A', 'B'], values: [10, 20] } },
      transform: null,
    });

    store.bindComponentToDataSource(compId, dsId, {});

    const comp = useEditorStore.getState().components.get(compId);
    expect(comp?.dataSourceId).toBe(dsId);
    expect(comp?.dataMapping).toEqual({});
  });

  it('should unbind a data source from a component', () => {
    const store = useEditorStore.getState();
    const compId = store.addComponent('chart_bar');
    const dsId = store.addDataSource({
      name: 'Test DS',
      type: 'static',
      config: { type: 'static', data: {} },
      transform: null,
    });

    store.bindComponentToDataSource(compId, dsId, {});
    store.unbindComponentFromDataSource(compId);

    const comp = useEditorStore.getState().components.get(compId);
    expect(comp?.dataSourceId).toBeNull();
    expect(comp?.dataMapping).toBeNull();
  });

  it('should clear binding when data source is removed', () => {
    const store = useEditorStore.getState();
    const compId = store.addComponent('chart_bar');
    const dsId = store.addDataSource({
      name: 'Test DS',
      type: 'static',
      config: { type: 'static', data: {} },
      transform: null,
    });

    store.bindComponentToDataSource(compId, dsId, {});
    store.removeDataSource(dsId);

    const comp = useEditorStore.getState().components.get(compId);
    expect(comp?.dataSourceId).toBeNull();
    expect(comp?.dataMapping).toBeNull();
  });

  it('should store and retrieve data values', () => {
    const store = useEditorStore.getState();
    const dsId = store.addDataSource({
      name: 'Test DS',
      type: 'static',
      config: { type: 'static', data: {} },
      transform: null,
    });

    const testData = { categories: ['X', 'Y'], values: [100, 200] };
    store.setDataValue(dsId, testData);

    expect(useEditorStore.getState().dataValues.get(dsId)).toEqual(testData);
  });
});
