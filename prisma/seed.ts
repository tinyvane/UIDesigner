/**
 * Seed database with built-in templates.
 * Run: npm run db:seed
 */

import 'dotenv/config';
import path from 'node:path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../src/generated/prisma/client.js';

// Prisma v7: standalone scripts need an explicit adapter.
// DATABASE_URL "file:./dev.db" is relative to prisma/ dir (where schema.prisma lives).
const dbPath = path.resolve(process.cwd(), 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter } as never);

interface SeedComponent {
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  props: Record<string, unknown>;
}

interface SeedTemplate {
  name: string;
  category: string;
  tags: string[];
  thumbnail: string;
  config: {
    canvas: { width: number; height: number; background: { type: string; value: string } };
    components: SeedComponent[];
  };
}

const templates: SeedTemplate[] = [
  // ── Template 1: Data Monitoring Dashboard ──
  {
    name: '实时数据监控大屏',
    category: 'Data Monitoring',
    tags: ['dark theme', 'realtime', 'charts', 'monitoring'],
    thumbnail: '/templates/data-monitoring.png',
    config: {
      canvas: { width: 1920, height: 1080, background: { type: 'color', value: '#0a0e27' } },
      components: [
        { type: 'text_title', name: '标题', x: 560, y: 20, width: 800, height: 60, zIndex: 10, props: { text: '实时数据监控中心', fontSize: 36, color: '#00e5ff', textAlign: 'center', fontWeight: 'bold', letterSpacing: 6 } },
        { type: 'clock', name: '时钟', x: 1700, y: 20, width: 200, height: 50, zIndex: 10, props: { format: 'YYYY-MM-DD HH:mm:ss', showDate: true, color: '#00e5ff' } },
        { type: 'text_scroll', name: '滚动公告', x: 0, y: 80, width: 1920, height: 30, zIndex: 9, props: { text: '系统运行正常 — 所有服务健康 — 数据延迟 < 50ms — 当前在线用户 2,847', color: '#94a3b8', fontSize: 13, speed: 40, backgroundColor: 'rgba(0,0,0,0.3)' } },
        { type: 'stat_card', name: '在线用户', x: 40, y: 140, width: 280, height: 140, zIndex: 5, props: { title: '在线用户', value: '2,847', trend: 12.5, trendLabel: '较昨日', color: '#06b6d4' } },
        { type: 'stat_card', name: '今日订单', x: 340, y: 140, width: 280, height: 140, zIndex: 5, props: { title: '今日订单', value: '8,392', trend: 8.3, trendLabel: '较昨日', color: '#8b5cf6' } },
        { type: 'stat_card', name: '营业额', x: 640, y: 140, width: 280, height: 140, zIndex: 5, props: { title: '营业额(万)', value: '156.8', trend: -2.1, trendLabel: '较昨日', color: '#f59e0b' } },
        { type: 'stat_card', name: '转化率', x: 940, y: 140, width: 280, height: 140, zIndex: 5, props: { title: '转化率', value: '23.7%', trend: 1.2, trendLabel: '较昨日', color: '#10b981' } },
        { type: 'gauge', name: 'CPU', x: 1280, y: 140, width: 300, height: 240, zIndex: 5, props: { title: 'CPU使用率', value: 67, color: '#06b6d4', max: 100, unit: '%' } },
        { type: 'gauge', name: '内存', x: 1600, y: 140, width: 300, height: 240, zIndex: 5, props: { title: '内存使用率', value: 82, color: '#f59e0b', max: 100, unit: '%' } },
        { type: 'chart_bar', name: '每小时订单', x: 40, y: 320, width: 580, height: 340, zIndex: 4, props: { title: '每小时订单量', color: '#6366f1', data: { categories: ['00:00','02:00','04:00','06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00'], values: [120,85,60,95,380,520,680,590,720,650,480,320] }, showGrid: true, gradient: true, gradientFrom: '#1a3a6b', gradientTo: '#4facfe' } },
        { type: 'chart_line', name: '流量趋势', x: 640, y: 320, width: 580, height: 340, zIndex: 4, props: { title: '24h流量趋势', color: '#10b981', smooth: true, areaFill: true, data: { categories: ['00:00','02:00','04:00','06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00'], values: [2100,1800,1500,1900,4200,5800,7200,6500,8100,7300,5500,3800] } } },
        { type: 'chart_pie', name: '流量来源', x: 1280, y: 400, width: 600, height: 260, zIndex: 4, props: { title: '流量来源分布', donut: true, data: [{ name: '直接访问', value: 335 }, { name: '搜索引擎', value: 580 }, { name: '社交媒体', value: 234 }, { name: '外链', value: 135 }, { name: '广告', value: 248 }] } },
        { type: 'table_scroll', name: '事件日志', x: 40, y: 700, width: 580, height: 340, zIndex: 3, props: { title: '实时事件日志', headerColor: '#1e293b', data: { columns: ['时间', '事件', '来源', '状态'], rows: [['18:23:01','用户登录','Web','成功'],['18:22:58','API调用','Mobile','成功'],['18:22:45','数据同步','Server','处理中'],['18:22:30','告警恢复','Monitor','已恢复'],['18:22:15','支付回调','Gateway','成功'],['18:22:01','缓存更新','Redis','成功']] }, scrollSpeed: 2500 } },
        { type: 'table_ranking', name: '区域排名', x: 640, y: 700, width: 580, height: 340, zIndex: 3, props: { title: '区域销售排名', data: [{ name: '华东区', value: 28500 }, { name: '华南区', value: 24300 }, { name: '华北区', value: 21800 }, { name: '西南区', value: 18600 }, { name: '华中区', value: 16200 }, { name: '西北区', value: 12800 }, { name: '东北区', value: 10500 }], color: '#0d6efd', showIndex: true, unit: '万' } },
        { type: 'progress_bar', name: '服务器A', x: 1280, y: 700, width: 600, height: 50, zIndex: 3, props: { label: '服务器 A 负载', value: 72, max: 100, color: '#06b6d4', showValue: true } },
        { type: 'progress_bar', name: '服务器B', x: 1280, y: 770, width: 600, height: 50, zIndex: 3, props: { label: '服务器 B 负载', value: 45, max: 100, color: '#10b981', showValue: true } },
        { type: 'progress_bar', name: '服务器C', x: 1280, y: 840, width: 600, height: 50, zIndex: 3, props: { label: '服务器 C 负载', value: 91, max: 100, color: '#ef4444', showValue: true } },
        { type: 'border_decoration', name: '边框', x: 20, y: 10, width: 1880, height: 1060, zIndex: 1, props: { borderColor: '#1e40af', borderWidth: 1, cornerSize: 20, style: 'tech' } },
      ],
    },
  },

  // ── Template 2: Sales Dashboard ──
  {
    name: '销售业绩看板',
    category: 'Sales',
    tags: ['sales', 'charts', 'KPI', 'dark theme'],
    thumbnail: '/templates/sales-dashboard.png',
    config: {
      canvas: { width: 1920, height: 1080, background: { type: 'color', value: '#111827' } },
      components: [
        { type: 'text_title', name: '标题', x: 560, y: 20, width: 800, height: 60, zIndex: 10, props: { text: '销售业绩数据看板', fontSize: 32, color: '#f59e0b', textAlign: 'center', fontWeight: 'bold', letterSpacing: 4 } },
        { type: 'stat_card', name: '总营收', x: 40, y: 120, width: 440, height: 160, zIndex: 5, props: { title: '本月总营收', value: '¥ 2,385万', trend: 15.2, trendLabel: '同比增长', color: '#f59e0b' } },
        { type: 'stat_card', name: '订单数', x: 500, y: 120, width: 440, height: 160, zIndex: 5, props: { title: '本月订单数', value: '18,492', trend: 8.7, trendLabel: '同比增长', color: '#06b6d4' } },
        { type: 'stat_card', name: '客单价', x: 960, y: 120, width: 440, height: 160, zIndex: 5, props: { title: '平均客单价', value: '¥ 1,289', trend: 5.9, trendLabel: '同比增长', color: '#8b5cf6' } },
        { type: 'stat_card', name: '回款率', x: 1420, y: 120, width: 460, height: 160, zIndex: 5, props: { title: '回款率', value: '94.3%', trend: 2.1, trendLabel: '较上月', color: '#10b981' } },
        { type: 'chart_bar', name: '月度营收', x: 40, y: 320, width: 900, height: 340, zIndex: 4, props: { title: '月度营收趋势 (万元)', color: '#f59e0b', data: { categories: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'], values: [1850,1620,2100,1980,2250,2480,2150,2380,2560,2420,2180,2385] }, showGrid: true, gradient: true, gradientFrom: '#92400e', gradientTo: '#f59e0b', barRadius: 4 } },
        { type: 'chart_pie', name: '产品分布', x: 960, y: 320, width: 920, height: 340, zIndex: 4, props: { title: '产品销售分布', donut: true, data: [{ name: '企业版', value: 4200 }, { name: '专业版', value: 3800 }, { name: '标准版', value: 2600 }, { name: '基础版', value: 1500 }, { name: '试用版', value: 800 }] } },
        { type: 'chart_line', name: '日销售额', x: 40, y: 700, width: 900, height: 340, zIndex: 3, props: { title: '近30日销售额趋势', color: '#06b6d4', smooth: true, areaFill: true, data: { categories: ['1日','5日','10日','15日','20日','25日','30日'], values: [82,95,78,110,125,108,130] } } },
        { type: 'table_ranking', name: '销售排名', x: 960, y: 700, width: 920, height: 340, zIndex: 3, props: { title: '销售人员排名 (本月)', data: [{ name: '张三', value: 385 }, { name: '李四', value: 342 }, { name: '王五', value: 298 }, { name: '赵六', value: 276 }, { name: '钱七', value: 245 }, { name: '孙八', value: 218 }, { name: '周九', value: 195 }], color: '#f59e0b', showIndex: true, unit: '万' } },
        { type: 'border_decoration', name: '边框', x: 20, y: 10, width: 1880, height: 1060, zIndex: 1, props: { borderColor: '#92400e', borderWidth: 1, cornerSize: 20, style: 'tech' } },
      ],
    },
  },

  // ── Template 3: IoT Monitoring ──
  {
    name: 'IoT设备监控中心',
    category: 'IoT',
    tags: ['IoT', 'devices', 'gauge', 'realtime', 'dark theme'],
    thumbnail: '/templates/iot-monitoring.png',
    config: {
      canvas: { width: 1920, height: 1080, background: { type: 'color', value: '#030712' } },
      components: [
        { type: 'text_title', name: '标题', x: 510, y: 20, width: 900, height: 60, zIndex: 10, props: { text: 'IoT 设备监控中心', fontSize: 34, color: '#22d3ee', textAlign: 'center', fontWeight: 'bold', letterSpacing: 5 } },
        { type: 'stat_number_flip', name: '设备总数', x: 40, y: 120, width: 300, height: 120, zIndex: 6, props: { value: 3842, prefix: '', suffix: ' 台', color: '#22d3ee', fontSize: 42, duration: 1500, label: '接入设备总数', decimals: 0 } },
        { type: 'stat_number_flip', name: '在线设备', x: 360, y: 120, width: 300, height: 120, zIndex: 6, props: { value: 3567, prefix: '', suffix: ' 台', color: '#10b981', fontSize: 42, duration: 1500, label: '在线设备', decimals: 0 } },
        { type: 'stat_number_flip', name: '告警数', x: 680, y: 120, width: 300, height: 120, zIndex: 6, props: { value: 23, prefix: '', suffix: ' 条', color: '#ef4444', fontSize: 42, duration: 1500, label: '当前告警', decimals: 0 } },
        { type: 'progress_ring', name: '在线率', x: 1040, y: 100, width: 160, height: 160, zIndex: 6, props: { value: 92.8, max: 100, color: '#10b981', trackColor: '#1f2937', strokeWidth: 10, showValue: true, label: '在线率%' } },
        { type: 'progress_ring', name: '告警率', x: 1240, y: 100, width: 160, height: 160, zIndex: 6, props: { value: 0.6, max: 100, color: '#ef4444', trackColor: '#1f2937', strokeWidth: 10, showValue: true, label: '告警率%' } },
        { type: 'progress_ring', name: '数据完整率', x: 1440, y: 100, width: 160, height: 160, zIndex: 6, props: { value: 99.2, max: 100, color: '#6366f1', trackColor: '#1f2937', strokeWidth: 10, showValue: true, label: '数据完整率%' } },
        { type: 'gauge', name: '温度', x: 40, y: 300, width: 300, height: 280, zIndex: 5, props: { title: '平均温度', value: 36.5, color: '#ef4444', max: 80, unit: '°C' } },
        { type: 'gauge', name: '湿度', x: 360, y: 300, width: 300, height: 280, zIndex: 5, props: { title: '平均湿度', value: 62, color: '#06b6d4', max: 100, unit: '%' } },
        { type: 'gauge', name: '电压', x: 680, y: 300, width: 300, height: 280, zIndex: 5, props: { title: '供电电压', value: 223, color: '#f59e0b', max: 250, unit: 'V' } },
        { type: 'chart_line', name: '温度趋势', x: 1040, y: 300, width: 840, height: 280, zIndex: 5, props: { title: '24h温度趋势', color: '#ef4444', smooth: true, areaFill: false, data: { categories: ['00:00','04:00','08:00','12:00','16:00','20:00','24:00'], values: [28,26,27,35,38,36,30] } } },
        { type: 'chart_bar', name: '设备分布', x: 40, y: 620, width: 620, height: 420, zIndex: 4, props: { title: '各区域设备数量', color: '#22d3ee', horizontal: true, data: { categories: ['A区','B区','C区','D区','E区','F区'], values: [820,680,560,490,720,572] }, showGrid: true } },
        { type: 'table_scroll', name: '告警列表', x: 680, y: 620, width: 600, height: 420, zIndex: 4, props: { title: '实时告警列表', headerColor: '#1e293b', data: { columns: ['时间', '设备ID', '类型', '级别'], rows: [['18:21:30','DEV-A012','温度超限','严重'],['18:20:15','DEV-B087','离线','警告'],['18:19:42','DEV-C034','电压异常','一般'],['18:18:50','DEV-A065','湿度超限','警告'],['18:17:33','DEV-D021','通信超时','一般']] }, scrollSpeed: 3000 } },
        { type: 'chart_pie', name: '设备类型', x: 1300, y: 620, width: 580, height: 420, zIndex: 4, props: { title: '设备类型分布', donut: true, data: [{ name: '温湿度传感器', value: 1200 }, { name: '电力监测', value: 800 }, { name: '视频监控', value: 650 }, { name: '门禁', value: 420 }, { name: '环境检测', value: 372 }, { name: '其他', value: 400 }] } },
        { type: 'border_decoration', name: '边框', x: 20, y: 10, width: 1880, height: 1060, zIndex: 1, props: { borderColor: '#0e7490', borderWidth: 1, cornerSize: 20, style: 'tech' } },
      ],
    },
  },

  // ── Template 4: Operations Overview ──
  {
    name: '运维态势感知大屏',
    category: 'Operations',
    tags: ['operations', 'map', 'server', 'dark theme'],
    thumbnail: '/templates/operations.png',
    config: {
      canvas: { width: 1920, height: 1080, background: { type: 'color', value: '#0c1222' } },
      components: [
        { type: 'text_title', name: '标题', x: 510, y: 15, width: 900, height: 55, zIndex: 10, props: { text: '运维态势感知平台', fontSize: 34, color: '#60a5fa', textAlign: 'center', fontWeight: 'bold', letterSpacing: 6 } },
        { type: 'clock', name: '时钟', x: 1680, y: 20, width: 220, height: 45, zIndex: 10, props: { format: 'YYYY-MM-DD HH:mm:ss', showDate: true, color: '#60a5fa' } },
        { type: 'stat_card', name: '服务总数', x: 40, y: 100, width: 280, height: 130, zIndex: 6, props: { title: '微服务总数', value: '128', color: '#60a5fa' } },
        { type: 'stat_card', name: '健康服务', x: 340, y: 100, width: 280, height: 130, zIndex: 6, props: { title: '健康服务', value: '125', color: '#10b981' } },
        { type: 'stat_card', name: '异常服务', x: 40, y: 250, width: 280, height: 130, zIndex: 6, props: { title: '异常服务', value: '3', color: '#ef4444' } },
        { type: 'stat_card', name: '今日部署', x: 340, y: 250, width: 280, height: 130, zIndex: 6, props: { title: '今日部署', value: '17', trend: 3, trendLabel: '次', color: '#a78bfa' } },
        { type: 'map_china', name: '地图', x: 640, y: 80, width: 700, height: 520, zIndex: 5, props: { title: '', data: [{ name: '北京', value: 320 }, { name: '上海', value: 280 }, { name: '广东', value: 250 }, { name: '浙江', value: 180 }, { name: '四川', value: 150 }, { name: '湖北', value: 120 }], colorRange: ['#0a3a6b', '#0d6efd', '#00ff88'], showVisualMap: true } },
        { type: 'gauge', name: 'QPS', x: 1380, y: 100, width: 260, height: 220, zIndex: 5, props: { title: 'QPS', value: 8520, color: '#60a5fa', max: 15000, unit: '' } },
        { type: 'gauge', name: '响应时间', x: 1640, y: 100, width: 260, height: 220, zIndex: 5, props: { title: '平均响应', value: 45, color: '#10b981', max: 200, unit: 'ms' } },
        { type: 'chart_line', name: 'QPS趋势', x: 1360, y: 340, width: 540, height: 260, zIndex: 5, props: { title: 'QPS趋势 (近1小时)', color: '#60a5fa', smooth: true, areaFill: true, data: { categories: ['-60m','-50m','-40m','-30m','-20m','-10m','now'], values: [6200,7100,8500,7800,9200,8800,8520] } } },
        { type: 'chart_bar', name: '错误统计', x: 40, y: 420, width: 580, height: 300, zIndex: 4, props: { title: '各服务错误数 (Top 10)', color: '#ef4444', horizontal: true, data: { categories: ['auth-svc','payment-svc','user-svc','order-svc','notify-svc'], values: [45,32,28,21,15] }, showGrid: true } },
        { type: 'table_scroll', name: '部署日志', x: 40, y: 740, width: 900, height: 300, zIndex: 3, props: { title: '最近部署记录', headerColor: '#1e293b', data: { columns: ['时间', '服务', '版本', '操作人', '状态'], rows: [['18:15','auth-svc','v2.3.1','张工','成功'],['17:42','payment-svc','v1.8.0','李工','成功'],['17:10','user-svc','v3.1.2','王工','成功'],['16:35','order-svc','v2.0.5','赵工','回滚'],['16:00','gateway','v1.5.0','张工','成功']] }, scrollSpeed: 3000 } },
        { type: 'progress_bar', name: 'CPU集群', x: 960, y: 740, width: 440, height: 45, zIndex: 3, props: { label: 'CPU 集群平均', value: 58, max: 100, color: '#60a5fa', showValue: true } },
        { type: 'progress_bar', name: '内存集群', x: 960, y: 800, width: 440, height: 45, zIndex: 3, props: { label: '内存集群平均', value: 71, max: 100, color: '#f59e0b', showValue: true } },
        { type: 'progress_bar', name: '磁盘', x: 960, y: 860, width: 440, height: 45, zIndex: 3, props: { label: '磁盘使用率', value: 43, max: 100, color: '#10b981', showValue: true } },
        { type: 'progress_bar', name: '网络', x: 960, y: 920, width: 440, height: 45, zIndex: 3, props: { label: '网络带宽', value: 35, max: 100, color: '#a78bfa', showValue: true } },
        { type: 'chart_pie', name: '告警分布', x: 1420, y: 640, width: 480, height: 400, zIndex: 3, props: { title: '告警级别分布', donut: true, data: [{ name: '严重', value: 3 }, { name: '警告', value: 12 }, { name: '提示', value: 28 }, { name: '已恢复', value: 85 }] } },
        { type: 'border_decoration', name: '边框', x: 20, y: 8, width: 1880, height: 1064, zIndex: 1, props: { borderColor: '#1e40af', borderWidth: 1, cornerSize: 20, style: 'tech' } },
      ],
    },
  },

  // ── Template 5: Smart City ──
  {
    name: '智慧城市综合管理',
    category: 'Smart City',
    tags: ['smart city', 'map', 'government', 'dark theme'],
    thumbnail: '/templates/smart-city.png',
    config: {
      canvas: { width: 1920, height: 1080, background: { type: 'gradient', value: 'linear-gradient(180deg, #020617 0%, #0c1222 100%)' } },
      components: [
        { type: 'text_title', name: '标题', x: 460, y: 15, width: 1000, height: 60, zIndex: 10, props: { text: '智慧城市综合管理平台', fontSize: 36, color: '#38bdf8', textAlign: 'center', fontWeight: 'bold', letterSpacing: 8 } },
        { type: 'divider', name: '分割线', x: 0, y: 75, width: 1920, height: 4, zIndex: 9, props: { color: '#1e40af', thickness: 1, style: 'solid', orientation: 'horizontal' } },
        { type: 'stat_card', name: '常住人口', x: 40, y: 100, width: 280, height: 130, zIndex: 6, props: { title: '常住人口 (万)', value: '1,245', color: '#38bdf8' } },
        { type: 'stat_card', name: '流动人口', x: 40, y: 250, width: 280, height: 130, zIndex: 6, props: { title: '流动人口 (万)', value: '387', color: '#a78bfa' } },
        { type: 'stat_card', name: '今日报警', x: 40, y: 400, width: 280, height: 130, zIndex: 6, props: { title: '今日报警', value: '156', trend: -8.2, trendLabel: '较昨日', color: '#f59e0b' } },
        { type: 'chart_line', name: '空气质量', x: 40, y: 560, width: 400, height: 240, zIndex: 5, props: { title: 'AQI 趋势 (近7日)', color: '#10b981', smooth: true, areaFill: true, data: { categories: ['周一','周二','周三','周四','周五','周六','周日'], values: [65,72,58,82,95,78,62] } } },
        { type: 'chart_bar', name: '交通流量', x: 40, y: 820, width: 400, height: 240, zIndex: 4, props: { title: '各区域交通流量', color: '#38bdf8', data: { categories: ['朝阳','海淀','丰台','西城','东城','通州'], values: [12500,11800,9600,8200,7500,6800] }, showGrid: true } },
        { type: 'map_china', name: '地图', x: 460, y: 90, width: 1000, height: 600, zIndex: 5, props: { title: '', data: [{ name: '北京', value: 1245 }, { name: '上海', value: 1580 }, { name: '广东', value: 2100 }, { name: '浙江', value: 980 }, { name: '江苏', value: 1250 }, { name: '四川', value: 850 }, { name: '湖北', value: 720 }], colorRange: ['#0a2463', '#1e40af', '#38bdf8'], showVisualMap: true } },
        { type: 'table_scroll', name: '预警列表', x: 460, y: 720, width: 700, height: 340, zIndex: 4, props: { title: '城市预警信息', headerColor: '#1e293b', data: { columns: ['时间', '区域', '类型', '级别', '状态'], rows: [['18:20','朝阳区','交通拥堵','黄色','处理中'],['18:15','海淀区','空气质量','橙色','已发布'],['18:10','丰台区','积水预警','黄色','处理中'],['18:05','西城区','人流密集','蓝色','已通知'],['17:55','东城区','消防隐患','红色','已派出']] }, scrollSpeed: 3000 } },
        { type: 'stat_card', name: '摄像头', x: 1500, y: 100, width: 380, height: 130, zIndex: 6, props: { title: '在线摄像头', value: '28,456', trend: 0.3, trendLabel: '在线率99.7%', color: '#10b981' } },
        { type: 'stat_card', name: '停车位', x: 1500, y: 250, width: 380, height: 130, zIndex: 6, props: { title: '剩余停车位', value: '12,890', trend: -15, trendLabel: '较1小时前', color: '#f59e0b' } },
        { type: 'gauge', name: '路网拥堵', x: 1500, y: 400, width: 380, height: 280, zIndex: 5, props: { title: '路网拥堵指数', value: 6.8, color: '#f59e0b', max: 10, unit: '' } },
        { type: 'chart_pie', name: '事件分类', x: 1200, y: 720, width: 680, height: 340, zIndex: 4, props: { title: '城市事件分类', donut: true, data: [{ name: '交通', value: 450 }, { name: '治安', value: 280 }, { name: '市政', value: 220 }, { name: '环保', value: 180 }, { name: '消防', value: 120 }, { name: '其他', value: 95 }] } },
        { type: 'border_decoration', name: '边框', x: 20, y: 8, width: 1880, height: 1064, zIndex: 1, props: { borderColor: '#1e3a5f', borderWidth: 1, cornerSize: 24, style: 'tech' } },
      ],
    },
  },
];

async function main() {
  console.log('Seeding templates...');

  for (const tpl of templates) {
    const existing = await prisma.template.findFirst({ where: { name: tpl.name } });
    if (existing) {
      console.log(`  Skip (exists): ${tpl.name}`);
      continue;
    }

    await prisma.template.create({
      data: {
        name: tpl.name,
        category: tpl.category,
        tags: tpl.tags,
        thumbnail: tpl.thumbnail,
        config: tpl.config as object,
        isPublic: true,
      },
    });
    console.log(`  Created: ${tpl.name}`);
  }

  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
