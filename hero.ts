import { heroui } from '@heroui/react'
import type { ColorScale } from '@heroui/react'

const primaryColors: ColorScale = {
  '50': '#f6f8f5',
  '100': '#ebefe9',
  '200': '#d7dfd3',
  '300': '#b6c5b0',
  '400': '#8da385',
  '500': '#6b8562',
  '600': '#556b4e',
  '700': '#475841',
  '800': '#394635',
  '900': '#303a2d',
  DEFAULT: '#6b8562',
  foreground: '#f6f8f5',
}

const secondaryColors: ColorScale = {
  '50': '#f8f5ee',
  '100': '#ede6d4',
  '200': '#dccdac',
  '300': '#c8ad7c',
  '400': '#b79258',
  '500': '#a87f4a',
  '600': '#90663e',
  '700': '#7f5539',
  '800': '#624231',
  '900': '#55392e',
  DEFAULT: '#a87f4a',
  foreground: '#f8f5ee',
}

const dangerColors: ColorScale = {
  '50': '#fdf5f3',
  '100': '#fce9e7',
  '200': '#f8d5d3',
  '300': '#f2b3af',
  '400': '#ea8582',
  '500': '#de5555',
  '600': '#c9353b',
  '700': '#ad2831',
  '800': '#8e232e',
  '900': '#7a212d',
  DEFAULT: '#de5555',
  foreground: '#fdf5f3',
}

export default heroui({
  themes: {
    dark: {
      colors: {
        primary: primaryColors,
        secondary: secondaryColors,
        danger: dangerColors,
      },
    },
  },
})
