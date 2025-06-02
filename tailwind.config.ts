
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				golden: {
					50: '#fff9e6',
					100: '#ffedb3',
					200: '#ffe180',
					300: '#ffd54d',
					400: '#ffc91a',
					500: '#e6b000',
					600: '#b38900',
					700: '#806200',
					800: '#4d3b00',
					900: '#1a1400',
				},
				courtroom: {
					dark: '#1A1F2C',
					light: '#F1F1F1',
					neutral: '#8E9196',
				},
				legal: {
					navy: 'hsl(var(--legal-navy))',
					'navy-dark': 'hsl(var(--legal-navy-dark))',
					'navy-light': 'hsl(var(--legal-navy-light))',
					burgundy: 'hsl(var(--legal-burgundy))',
					gold: 'hsl(var(--legal-gold))',
					'gold-light': 'hsl(var(--legal-gold-light))',
					gray: 'hsl(var(--legal-gray))',
					'gray-light': 'hsl(var(--legal-gray-light))',
					'gray-dark': 'hsl(var(--legal-gray-dark))',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0', opacity: '0' },
					to: { height: 'var(--radix-accordion-content-height)', opacity: '1' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
					to: { height: '0', opacity: '0' }
				},
				'fade-in': {
					"0%": {
						opacity: "0",
						transform: "translateY(10px)"
					},
					"100%": {
						opacity: "1",
						transform: "translateY(0)"
					}
				},
				'scale-in': {
					"0%": {
						transform: "scale(0.95)",
						opacity: "0"
					},
					"100%": {
						transform: "scale(1)",
						opacity: "1"
					}
				},
				'slide-in-right': {
					"0%": { transform: "translateX(100%)" },
					"100%": { transform: "translateX(0)" }
				},
				'float': {
					'0%, 100%': {
						transform: 'translateY(0px)'
					},
					'50%': {
						transform: 'translateY(-20px)'
					}
				},
				'tilt': {
					'0%, 100%': {
						transform: 'rotate(0deg)'
					},
					'25%': {
						transform: 'rotate(-5deg)'
					},
					'75%': {
						transform: 'rotate(5deg)'
					}
				},
				'glow': {
					'0%, 100%': {
						filter: 'brightness(1)'
					},
					'50%': {
						filter: 'brightness(1.3)'
					}
				},
				'clink': {
					'0%, 100%': {
						transform: 'rotate(0deg)'
					},
					'50%': {
						transform: 'rotate(1deg)'
					}
				},
				'professionalFadeIn': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'professionalSlideUp': {
					'0%': {
						opacity: '0',
						transform: 'translateY(30px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'professionalScaleIn': {
					'0%': {
						opacity: '0',
						transform: 'scale(0.95)'
					},
					'100%': {
						opacity: '1',
						transform: 'scale(1)'
					}
				},
				'professionalSkeleton': {
					'0%': {
						backgroundPosition: '-200% 0'
					},
					'100%': {
						backgroundPosition: '200% 0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'scale-in': 'scale-in 0.2s ease-out',
				'slide-in-right': 'slide-in-right 0.3s ease-out',
				'float': 'float 5s ease-in-out infinite',
				'tilt': 'tilt 5s ease-in-out infinite',
				'glow': 'glow 2s ease-in-out infinite',
				'clink': 'clink 0.5s ease-in-out',
				'professional-fade-in': 'professionalFadeIn 0.6s ease-out forwards',
				'professional-slide-up': 'professionalSlideUp 0.7s ease-out forwards',
				'professional-scale-in': 'professionalScaleIn 0.5s ease-out forwards',
				'professional-skeleton': 'professionalSkeleton 1.5s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
