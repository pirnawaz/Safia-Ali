import { Card, CardContent } from "@/components/ui/card"

interface LoadingSpinnerProps {
  message?: string
  fullScreen?: boolean
}

export function LoadingSpinner({ message = "Loading...", fullScreen = false }: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">{message}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function LoadingCard({ message = "Loading..." }: { message?: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function LoadingInline({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center space-x-2">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      <span className="text-sm text-gray-600">{message}</span>
    </div>
  )
}

