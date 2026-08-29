export type IconStyle = 'fill' | 'stroke'

export type Complexity = 'simple' | 'medium' | 'detailed'

export type CornerStyle = 'rounded' | 'sharp'

export interface IconSize {
  width: number
  height: number
}

export interface GenerateIconParams {
  prompt: string
  style: IconStyle
  size: IconSize
  complexity: Complexity
  cornerStyle: CornerStyle
}

export interface GeneratedIcon {
  svg: string
  title: string
  description: string
  style: IconStyle
  prompt: string
  timestamp: number
  id: string
}

export interface AiMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GenerationStep {
  label: string
  status: 'pending' | 'active' | 'complete' | 'error'
}

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
}
