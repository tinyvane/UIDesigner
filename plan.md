# 学习 yyhsong/iDataV 的组件样式

## 目标
从 [iDataV](https://github.com/yyhsong/iDataV) 项目吸收所有 widget 样式，精确复制 demo 页面的视觉效果，纳入我们的系统。同时建立"案例模板"功能。

## 案例模板功能设计
- 路径：`src/templates/cases/`
- 每套模板一个目录（如 `case01-map-visualization/`）
- 目录下包含 `template.json`，定义：
  - 模板名称、描述、缩略图
  - 画布尺寸和背景
  - 组件列表：类型、位置、大小、预制 props（配色+数据）
- 模板使用系统内已有的 widget，不重复实现代码

## 进度追踪

### Case01 — 地图数据可视化
- [ ] 飞线地图 widget（chart_flyline_map）
- [ ] 案例模板 JSON

### Case02 — 3D 图表展示
- [ ] 3D 柱形图 widget（chart_bar3d）— 需要 ECharts GL
- [ ] 案例模板 JSON

### Case03 — 热力图展示
- [ ] 笛卡尔热力图 widget（chart_heatmap）
- [ ] 案例模板 JSON

### Case04 — ECharts 扩展
- [ ] 词云 widget（chart_wordcloud）
- [ ] 水球图 widget（chart_liquidfill）
- [ ] 关系图谱 widget（chart_graph）
- [ ] 案例模板 JSON

### Case06 — 旭日图
- [ ] 旭日图 widget（chart_sunburst）
- [ ] 案例模板 JSON

### Case07 — 上市公司地域分布
- [ ] 增强现有 map_china 散点效果
- [ ] 案例模板 JSON

### Case08 — 树图
- [ ] 树图 widget（chart_tree）
- [ ] 案例模板 JSON

### Case09 — 综合大屏（上市公司全景概览）
- [ ] 象形柱状图 widget（chart_pictorial_bar）
- [ ] 增强现有 chart_bar 横向样式
- [ ] 案例模板 JSON（综合大屏模板）

### 布局模板（tpl01-05）
- [ ] tpl01 — 两行五面板
- [ ] tpl02 — 两行五面板（变体配色）
- [ ] tpl03 — 两行五面板（第三种风格）
- [ ] tpl04 — 三列布局
- [ ] tpl05 — 超宽屏三列布局

## 新增 Widget 清单

| 序号 | Widget 类型 | 来源 Case | 状态 |
|------|------------|----------|------|
| 1 | chart_flyline_map | case01 | 待开发 |
| 2 | chart_bar3d | case02 | 待开发 |
| 3 | chart_heatmap | case03 | 待开发 |
| 4 | chart_wordcloud | case04 | 待开发 |
| 5 | chart_liquidfill | case04 | 待开发 |
| 6 | chart_graph | case04 | 待开发 |
| 7 | chart_sunburst | case06 | 待开发 |
| 8 | chart_tree | case08 | 待开发 |
| 9 | chart_pictorial_bar | case09 | 待开发 |
