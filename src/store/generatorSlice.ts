import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { IconStyle, Complexity, CornerStyle, GeneratedIcon } from '@/types'

interface GeneratorState {
  prompt: string
  style: IconStyle
  complexity: Complexity
  cornerStyle: CornerStyle
  iconWidth: number
  iconHeight: number
  isGenerating: boolean
  currentIcon: GeneratedIcon | null
  error: string | null
  history: GeneratedIcon[]
}

const loadHistory = (): GeneratedIcon[] => {
  try {
    return JSON.parse(localStorage.getItem('pc_history') || '[]')
  } catch {
    return []
  }
}

const initialState: GeneratorState = {
  prompt: '',
  style: 'fill',
  complexity: 'medium',
  cornerStyle: 'rounded',
  iconWidth: 24,
  iconHeight: 24,
  isGenerating: false,
  currentIcon: null,
  error: null,
  history: loadHistory(),
}

const generatorSlice = createSlice({
  name: 'generator',
  initialState,
  reducers: {
    setPrompt(state, action: PayloadAction<string>) {
      state.prompt = action.payload
    },
    setStyle(state, action: PayloadAction<IconStyle>) {
      state.style = action.payload
    },
    setComplexity(state, action: PayloadAction<Complexity>) {
      state.complexity = action.payload
    },
    setCornerStyle(state, action: PayloadAction<CornerStyle>) {
      state.cornerStyle = action.payload
    },
    setIconWidth(state, action: PayloadAction<number>) {
      state.iconWidth = action.payload
    },
    setIconHeight(state, action: PayloadAction<number>) {
      state.iconHeight = action.payload
    },
    setGenerating(state, action: PayloadAction<boolean>) {
      state.isGenerating = action.payload
    },
    setCurrentIcon(state, action: PayloadAction<GeneratedIcon | null>) {
      state.currentIcon = action.payload
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload
    },
    addToHistory(state, action: PayloadAction<GeneratedIcon>) {
      state.history = [action.payload, ...state.history].slice(0, 50)
      localStorage.setItem('pc_history', JSON.stringify(state.history))
    },
    removeFromHistory(state, action: PayloadAction<string>) {
      state.history = state.history.filter((item) => item.id !== action.payload)
      localStorage.setItem('pc_history', JSON.stringify(state.history))
    },
    clearHistory(state) {
      state.history = []
      localStorage.removeItem('pc_history')
    },
    loadIconFromHistory(state, action: PayloadAction<GeneratedIcon>) {
      state.currentIcon = action.payload
      state.prompt = action.payload.prompt
      state.style = action.payload.style
    },
  },
})

export const {
  setPrompt,
  setStyle,
  setComplexity,
  setCornerStyle,
  setIconWidth,
  setIconHeight,
  setGenerating,
  setCurrentIcon,
  setError,
  addToHistory,
  removeFromHistory,
  clearHistory,
  loadIconFromHistory,
} = generatorSlice.actions

export default generatorSlice.reducer
