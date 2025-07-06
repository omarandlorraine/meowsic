import { heroui } from '@heroui/react'
import { semanticColors } from '@heroui/theme/colors'

export default heroui({
  themes: {
    dark: {
      colors: { focus: semanticColors.dark.secondary },
    },
  },
})
