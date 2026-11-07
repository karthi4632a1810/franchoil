/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],

    content: [
        "./index.html",
        "./src/**/*.{js,jsx}",
        "./pages/**/*.{js,jsx}",
        "./components/**/*.{js,jsx}",
        "./app/**/*.{js,jsx}",
    ],

    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },

        extend: {
            /* ================= FONTS ================= */
            fontFamily: {
                sans: ["'Plus Jakarta Sans'", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
                display: ["'Plus Jakarta Sans'", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
                body: ["'Plus Jakarta Sans'", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
            },

            /* ================= YOUR COLORS ================= */
            colors: {
                prime: "#ffffff",
                second: "#f7f7f7",
                button: "#032F5D",
                cont: "#000000",

                pri: {
                    50: "hsl(51, 56%, 95%)",
                    100: "hsl(51, 56%, 90%)",
                    200: "hsl(51, 56%, 80%)",
                    300: "hsl(51, 56%, 70%)",
                    400: "hsl(51, 56%, 55%)",
                    500: "hsl(51, 56%, 43%)",
                    600: "hsl(51, 56%, 30%)",
                    700: "hsl(51, 56%, 25%)",
                    800: "hsl(51, 56%, 20%)",
                    900: "hsl(51, 56%, 15%)",
                },

                sec: {
                    50: "hsl(224, 100%, 98%)",
                    100: "hsla(207, 100%, 32%, 55%)",
                    200: "hsl(207, 100%, 80%)",
                    300: "hsl(207, 100%, 70%)",
                    400: "hsl(207, 100%, 60%)",
                    500: "hsl(207, 100%, 51%)",
                    600: "hsl(207, 100%, 40%)",
                    700: "hsl(207, 100%, 32%)",
                    800: "hsl(207, 100%, 20%)",
                    900: "hsl(207, 100%, 12%)",
                },

                footer: {
                    bg: "hsl(30, 82%, 96%)",
                },

                /* ================= LOVABLE AI UI COLORS ================= */
                success: "#16a34a",
                warning: "#f59e0b",
                destructive: "#dc2626",
                muted: "#6b7280",
                accent: "#0ea5e9",
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",

                card: "hsl(var(--card))",
                "card-foreground": "hsl(var(--card-foreground))",

                muted: "hsl(var(--muted))",
                "muted-foreground": "hsl(var(--muted-foreground))",

                primary: "hsl(var(--primary))",
                "primary-foreground": "hsl(var(--primary-foreground))",

                secondary: "hsl(var(--secondary))",
                "secondary-foreground": "hsl(var(--secondary-foreground))",

                destructive: "hsl(var(--destructive))",
                "destructive-foreground": "hsl(var(--destructive-foreground))",

                success: "hsl(var(--green-500))",
                "success-foreground": "hsl(var(--green-500-foreground))",

                warning: "hsl(var(--warning))",
                "warning-foreground": "hsl(var(--warning-foreground))",
            },

            /* ================= SHADOWS ================= */
            boxShadow: {
                lite: "rgba(0, 0, 0, 0.05) 0px 0px 0px 1px",
                sm: "0 1px 2px rgba(0,0,0,0.05)",
                md: "0 4px 6px rgba(0,0,0,0.1)",
                lg: "0 10px 15px rgba(0,0,0,0.15)",
                xl: "0 20px 25px rgba(0,0,0,0.2)",
                glow: "0 0 20px rgba(250, 204, 21, 0.5)",
            },

            /* ================= RADIUS ================= */
            borderRadius: {
                sm: "4px",
                md: "8px",
                lg: "12px",
                xl: "16px",
                "2xl": "24px",
            },

            /* ================= SCREENS ================= */
            screens: {
                mobile: "480px",
                desktop: "1280px",
            },

            /* ================= ANIMATIONS ================= */
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                shimmer: {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
            },

            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                shimmer: "shimmer 2s infinite linear",
            },
        },
    },

    plugins: [require("tailwindcss-animate")],
};
