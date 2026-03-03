/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 预设一些大气、年轻化的颜色和圆角
      borderRadius: {
        '4xl': '2rem',
      },
      colors: {
        brand: '#4f46e5', // 这里的indigo色很主流
      }
    },
  },
  plugins: [],
}