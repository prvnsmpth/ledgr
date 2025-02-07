import { fontFamily } from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
const config = {
	darkMode: ["class"],
	content: [
		"./src/**/*.{html,js,svelte,ts}",
		"./node_modules/layerchart/**/*.{svelte,js}"
	],
	safelist: ["dark"],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px"
			}
		},
		extend: {
			colors: {
				border: "hsl(var(--border) / <alpha-value>)",
				input: "hsl(var(--input) / <alpha-value>)",
				ring: "hsl(var(--ring) / <alpha-value>)",
				background: "hsl(var(--background) / <alpha-value>)",
				foreground: "hsl(var(--foreground) / <alpha-value>)",
				primary: {
					DEFAULT: "hsl(var(--primary) / <alpha-value>)",
					foreground: "hsl(var(--primary-foreground) / <alpha-value>)"
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
					foreground: "hsl(var(--secondary-foreground) / <alpha-value>)"
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
					foreground: "hsl(var(--destructive-foreground) / <alpha-value>)"
				},
				muted: {
					DEFAULT: "hsl(var(--muted) / <alpha-value>)",
					foreground: "hsl(var(--muted-foreground) / <alpha-value>)"
				},
				accent: {
					DEFAULT: "hsl(var(--accent) / <alpha-value>)",
					foreground: "hsl(var(--accent-foreground) / <alpha-value>)"
				},
				popover: {
					DEFAULT: "hsl(var(--popover) / <alpha-value>)",
					foreground: "hsl(var(--popover-foreground) / <alpha-value>)"
				},
				card: {
					DEFAULT: "hsl(var(--card) / <alpha-value>)",
					foreground: "hsl(var(--card-foreground) / <alpha-value>)"
				},
				// For charts
				surface: {
					content: "hsl(var(--card-foreground) / <alpha-value>)",
					100: "hsl(var(--background) / <alpha-value>)",
					200: "hsl(var(---muted) / <alpha-value>)",
					// not sure what color maps here (should be darker than 200).  Could add a new color to `app.css`
					300: "hsl(var(--background) / <alpha-value>)"
				},
				chart1: {
					DEFAULT: "hsl(var(--chart1) / <alpha-value>)",
				},
				chart2: {
					DEFAULT: "hsl(var(--chart2) / <alpha-value>)",
				},
				chart3: {
					DEFAULT: "hsl(var(--chart3) / <alpha-value>)",
				},
				chart4: {
					DEFAULT: "hsl(var(--chart4) / <alpha-value>)",
				},
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)"
			},
			fontFamily: {
				sans: [...fontFamily.sans],
			},
			animation: {
				shake: "shake 0.3s ease-in-out",
			},
			keyframes: {
				shake: {
					'0%, 100%': { transform: 'translateX(0)' },
					'25%': { transform: 'translateX(-5px)' },
					'50%': { transform: 'translateX(5px)' },
					'75%': { transform: 'translateX(-5px)' },
				}
			}
		}
	},
};

export default config;
