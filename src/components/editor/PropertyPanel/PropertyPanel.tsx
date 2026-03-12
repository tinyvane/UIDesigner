'use client';

import { useEditorStore } from '@/stores/editorStore';
import { useUIStore } from '@/stores/uiStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { getComponent } from '@/components/widgets/registry';

export function PropertyPanel() {
  const components = useEditorStore((s) => s.components);
  const updateComponent = useEditorStore((s) => s.updateComponent);
  const selectedIds = useUIStore((s) => s.selectedIds);
  const propertyPanelTab = useUIStore((s) => s.propertyPanelTab);
  const setPropertyPanelTab = useUIStore((s) => s.setPropertyPanelTab);

  const selectedId = selectedIds.size === 1 ? Array.from(selectedIds)[0] : null;
  const selectedComponent = selectedId ? components.get(selectedId) : null;

  if (!selectedComponent) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center">
        <div className="mb-2 text-4xl text-gray-600">🎯</div>
        <p className="text-sm text-gray-500">Select a component to edit its properties</p>
        {selectedIds.size > 1 && (
          <p className="mt-2 text-xs text-gray-600">
            {selectedIds.size} components selected — multi-edit coming soon
          </p>
        )}
      </div>
    );
  }

  const registration = getComponent(selectedComponent.type);

  return (
    <div className="flex h-full flex-col">
      {/* Component header */}
      <div className="border-b border-gray-800 p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600/20 text-xs text-blue-400">
            📊
          </div>
          <div>
            <div className="text-xs font-medium text-gray-200">
              {selectedComponent.name || registration?.label || selectedComponent.type}
            </div>
            <div className="text-[10px] text-gray-500">{selectedComponent.type}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={propertyPanelTab}
        onValueChange={(v) => setPropertyPanelTab(v as typeof propertyPanelTab)}
        className="flex flex-1 flex-col"
      >
        <TabsList className="grid w-full grid-cols-4 rounded-none border-b border-gray-800 bg-transparent">
          <TabsTrigger value="style" className="text-xs data-[state=active]:bg-gray-800">
            Style
          </TabsTrigger>
          <TabsTrigger value="data" className="text-xs data-[state=active]:bg-gray-800">
            Data
          </TabsTrigger>
          <TabsTrigger value="animation" className="text-xs data-[state=active]:bg-gray-800">
            Anim
          </TabsTrigger>
          <TabsTrigger value="event" className="text-xs data-[state=active]:bg-gray-800">
            Event
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="style" className="mt-0 p-3">
            {/* Transform section */}
            <div className="mb-4">
              <h4 className="mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                Transform
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-gray-500">X</Label>
                  <Input
                    type="number"
                    value={Math.round(selectedComponent.x)}
                    onChange={(e) =>
                      updateComponent(selectedComponent.id, { x: Number(e.target.value) })
                    }
                    className="h-7 border-gray-700 bg-gray-800 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-gray-500">Y</Label>
                  <Input
                    type="number"
                    value={Math.round(selectedComponent.y)}
                    onChange={(e) =>
                      updateComponent(selectedComponent.id, { y: Number(e.target.value) })
                    }
                    className="h-7 border-gray-700 bg-gray-800 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-gray-500">W</Label>
                  <Input
                    type="number"
                    value={Math.round(selectedComponent.width)}
                    onChange={(e) =>
                      updateComponent(selectedComponent.id, {
                        width: Math.max(10, Number(e.target.value)),
                      })
                    }
                    className="h-7 border-gray-700 bg-gray-800 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-gray-500">H</Label>
                  <Input
                    type="number"
                    value={Math.round(selectedComponent.height)}
                    onChange={(e) =>
                      updateComponent(selectedComponent.id, {
                        height: Math.max(10, Number(e.target.value)),
                      })
                    }
                    className="h-7 border-gray-700 bg-gray-800 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-gray-500">Rotation</Label>
                  <Input
                    type="number"
                    value={selectedComponent.rotation}
                    onChange={(e) =>
                      updateComponent(selectedComponent.id, { rotation: Number(e.target.value) })
                    }
                    className="h-7 border-gray-700 bg-gray-800 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-gray-500">Opacity</Label>
                  <Input
                    type="number"
                    min={0}
                    max={1}
                    step={0.1}
                    value={selectedComponent.opacity}
                    onChange={(e) =>
                      updateComponent(selectedComponent.id, { opacity: Number(e.target.value) })
                    }
                    className="h-7 border-gray-700 bg-gray-800 text-xs"
                  />
                </div>
              </div>
            </div>

            <Separator className="mb-4" />

            {/* Component-specific props */}
            {registration?.propSchema && registration.propSchema.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  Properties
                </h4>
                <div className="space-y-2">
                  {registration.propSchema
                    .filter((field) => field.type !== 'json')
                    .map((field) => (
                      <div key={field.key}>
                        <Label className="text-[10px] text-gray-500">{field.label}</Label>
                        {field.type === 'string' && (
                          <Input
                            value={(selectedComponent.props[field.key] as string) ?? ''}
                            onChange={(e) =>
                              updateComponent(selectedComponent.id, {
                                props: { ...selectedComponent.props, [field.key]: e.target.value },
                              })
                            }
                            className="h-7 border-gray-700 bg-gray-800 text-xs"
                          />
                        )}
                        {field.type === 'number' && (
                          <Input
                            type="number"
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            value={(selectedComponent.props[field.key] as number) ?? 0}
                            onChange={(e) =>
                              updateComponent(selectedComponent.id, {
                                props: {
                                  ...selectedComponent.props,
                                  [field.key]: Number(e.target.value),
                                },
                              })
                            }
                            className="h-7 border-gray-700 bg-gray-800 text-xs"
                          />
                        )}
                        {field.type === 'color' && (
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={(selectedComponent.props[field.key] as string) ?? '#ffffff'}
                              onChange={(e) =>
                                updateComponent(selectedComponent.id, {
                                  props: {
                                    ...selectedComponent.props,
                                    [field.key]: e.target.value,
                                  },
                                })
                              }
                              className="h-7 w-10 cursor-pointer rounded border border-gray-700 bg-gray-800"
                            />
                            <Input
                              value={(selectedComponent.props[field.key] as string) ?? ''}
                              onChange={(e) =>
                                updateComponent(selectedComponent.id, {
                                  props: {
                                    ...selectedComponent.props,
                                    [field.key]: e.target.value,
                                  },
                                })
                              }
                              className="h-7 flex-1 border-gray-700 bg-gray-800 text-xs"
                            />
                          </div>
                        )}
                        {field.type === 'boolean' && (
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={
                                (selectedComponent.props[field.key] as boolean) ?? false
                              }
                              onChange={(e) =>
                                updateComponent(selectedComponent.id, {
                                  props: {
                                    ...selectedComponent.props,
                                    [field.key]: e.target.checked,
                                  },
                                })
                              }
                              className="rounded border-gray-600"
                            />
                            <span className="text-xs text-gray-400">{field.label}</span>
                          </label>
                        )}
                        {field.type === 'select' && field.options && (
                          <select
                            value={(selectedComponent.props[field.key] as string) ?? ''}
                            onChange={(e) =>
                              updateComponent(selectedComponent.id, {
                                props: {
                                  ...selectedComponent.props,
                                  [field.key]: e.target.value,
                                },
                              })
                            }
                            className="h-7 w-full rounded border border-gray-700 bg-gray-800 text-xs text-gray-200"
                          >
                            {field.options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="data" className="mt-0 p-3">
            <div className="py-8 text-center text-xs text-gray-500">
              Data binding — coming in Phase 3
            </div>
          </TabsContent>

          <TabsContent value="animation" className="mt-0 p-3">
            <div className="py-8 text-center text-xs text-gray-500">
              Animations — coming in Phase 5
            </div>
          </TabsContent>

          <TabsContent value="event" className="mt-0 p-3">
            <div className="py-8 text-center text-xs text-gray-500">
              Events — coming in Phase 5
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
