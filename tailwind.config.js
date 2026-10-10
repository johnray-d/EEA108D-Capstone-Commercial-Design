/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        slate: {
          850: '#111827',
          900: '#0f172a',
          950: '#060a14',
        },
        navy: {
          800: '#0d1b2a',
          900: '#07101b',
          950: '#030810',
        },
        power: {
          hv: '#ef4444',       // 13.8 kV Red/Crimson
          lv: '#38bdf8',       // 400V Cyan/Sky blue
          emergency: '#f59e0b',// Generator / ATS Amber
          fire: '#dc2626',     // Fire pump distinct red
          pf: '#10b981',       // APFC Green / Emerald
          neutral: '#94a3b8',  // Neutral Slate
          earth: '#84cc16',    // Earth Lime
          highlight: '#8b5cf6',// Inspection Purple
          warning: '#eab308',  // Limit warning Yellow
        }
      }
    },
  },
  plugins: [],
}
