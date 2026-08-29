import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import './styles.scss'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className={`input-wrapper ${className}`}>
        {label && <label className="input-label">{label}</label>}
        <input
          ref={ref}
          className={`input-field ${error ? 'input-field--error' : ''}`}
          {...props}
        />
        {error && <span className="input-error">{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className={`input-wrapper ${className}`}>
        {label && <label className="input-label">{label}</label>}
        <textarea
          ref={ref}
          className={`input-field input-field--textarea ${error ? 'input-field--error' : ''}`}
          {...props}
        />
        {error && <span className="input-error">{error}</span>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
