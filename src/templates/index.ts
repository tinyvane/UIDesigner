/**
 * Case Template Registry
 * Loads pre-built dashboard templates from JSON definitions.
 * Each template uses existing widgets with preset props, colors, and data.
 */

export interface CaseTemplate {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  source: string;
  canvas: {
    width: number;
    height: number;
    background: { type: string; value: string };
  };
  components: {
    type: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    props: Record<string, unknown>;
  }[];
}

// Import all case templates
import case01 from './cases/case01-map-visualization/template.json';
import case04 from './cases/case04-echarts-extensions/template.json';
import case09 from './cases/case09-company-overview/template.json';
import tpl01 from './cases/tpl01-purple-dark/template.json';
import tpl02 from './cases/tpl02-navy-blue/template.json';
import tpl03 from './cases/tpl03-indigo-cyan/template.json';
import tpl04 from './cases/tpl04-blue-gold/template.json';
import tpl05 from './cases/tpl05-tech-widescreen/template.json';

const templates: CaseTemplate[] = [
  case01 as CaseTemplate,
  case04 as CaseTemplate,
  case09 as CaseTemplate,
  tpl01 as CaseTemplate,
  tpl02 as CaseTemplate,
  tpl03 as CaseTemplate,
  tpl04 as CaseTemplate,
  tpl05 as CaseTemplate,
];

export function getAllCaseTemplates(): CaseTemplate[] {
  return templates;
}

export function getCaseTemplate(id: string): CaseTemplate | undefined {
  return templates.find(t => t.id === id);
}
