'use client';

import { useResumeStore } from '@/lib/stores/use-resume-store';

import { type ResumeTheme } from './templates/section-renderers';

const FONT_FAMILIES = [
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Cambria, serif', label: 'Cambria' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: '"Times New Roman", serif', label: 'Times New Roman' },
];

const HEADER_STYLES: { value: ResumeTheme['headerStyle']; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'centered', label: 'Centered' },
  { value: 'sidebar', label: 'Sidebar' },
];

export function ResumeThemePanel() {
  const theme = useResumeStore((s) => s.theme);
  const updateTheme = useResumeStore((s) => s.updateTheme);

  return (
    <div className="space-y-5 p-4">
      <h3 className="text-sm font-semibold">Theme Customization</h3>

      {/* Font Family */}
      <div>
        <label className="block text-xs font-medium mb-1">Font Family</label>
        <select
          value={theme.fontFamily}
          onChange={(e) => updateTheme({ fontFamily: e.target.value })}
          className="w-full border rounded px-2 py-1.5 text-sm bg-background"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Font Size */}
      <div>
        <label className="block text-xs font-medium mb-1">Font Size: {theme.fontSize}</label>
        <input
          type="range"
          min="11"
          max="18"
          value={parseInt(theme.fontSize)}
          onChange={(e) => updateTheme({ fontSize: `${e.target.value}px` })}
          className="w-full"
        />
      </div>

      {/* Primary Color */}
      <div>
        <label className="block text-xs font-medium mb-1">Primary Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={theme.primaryColor}
            onChange={(e) => updateTheme({ primaryColor: e.target.value })}
            className="h-8 w-8 rounded cursor-pointer border"
          />
          <span className="text-xs font-mono">{theme.primaryColor}</span>
        </div>
      </div>

      {/* Accent Color */}
      <div>
        <label className="block text-xs font-medium mb-1">Accent Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={theme.accentColor}
            onChange={(e) => updateTheme({ accentColor: e.target.value })}
            className="h-8 w-8 rounded cursor-pointer border"
          />
          <span className="text-xs font-mono">{theme.accentColor}</span>
        </div>
      </div>

      {/* Section Spacing */}
      <div>
        <label className="block text-xs font-medium mb-1">
          Section Spacing: {theme.sectionSpacing}
        </label>
        <input
          type="range"
          min="0.5"
          max="3"
          step="0.25"
          value={parseFloat(theme.sectionSpacing)}
          onChange={(e) => updateTheme({ sectionSpacing: `${e.target.value}rem` })}
          className="w-full"
        />
      </div>

      {/* Line Height */}
      <div>
        <label className="block text-xs font-medium mb-1">Line Height: {theme.lineHeight}</label>
        <input
          type="range"
          min="1.2"
          max="2.2"
          step="0.1"
          value={parseFloat(theme.lineHeight)}
          onChange={(e) => updateTheme({ lineHeight: `${e.target.value}` })}
          className="w-full"
        />
      </div>

      {/* Header Style */}
      <div>
        <label className="block text-xs font-medium mb-1">Header Style</label>
        <div className="flex gap-1">
          {HEADER_STYLES.map((h) => (
            <button
              key={h.value}
              onClick={() => updateTheme({ headerStyle: h.value })}
              className={`flex-1 px-2 py-1 text-xs rounded border transition-colors ${
                theme.headerStyle === h.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-accent'
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {/* Page Margins */}
      <div>
        <label className="block text-xs font-medium mb-1">Page Margins: {theme.pageMargins}</label>
        <input
          type="range"
          min="0.5"
          max="3"
          step="0.25"
          value={parseFloat(theme.pageMargins)}
          onChange={(e) => updateTheme({ pageMargins: `${e.target.value}rem` })}
          className="w-full"
        />
      </div>
    </div>
  );
}
