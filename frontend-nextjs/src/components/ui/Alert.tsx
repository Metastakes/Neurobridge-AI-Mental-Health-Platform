import React from 'react'
import clsx from 'clsx'
import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react'

interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  children: React.ReactNode
  className?: string
}

export function Alert({ type = 'info', title, children, className }: AlertProps) {
  const icons = {
    success: <CheckCircle className="h-5 w-5" />,
    error: <XCircle className="h-5 w-5" />,
    warning: <AlertCircle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />,
  }

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  return (
    <div className={clsx('p-4 border rounded-lg', styles[type], className)}>
      <div className="flex items-start">
        <div className="flex-shrink-0">{icons[type]}</div>
        <div className="ml-3 flex-1">
          {title && <h3 className="text-sm font-medium mb-1">{title}</h3>}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  )
}
