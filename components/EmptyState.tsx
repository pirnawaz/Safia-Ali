import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  title: string
  description?: string
  icon?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ title, description, icon = "📭", action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="p-8 md:p-12">
        <div className="text-center space-y-4">
          <div className="text-5xl md:text-6xl">{icon}</div>
          <div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-900">{title}</h3>
            {description && (
              <p className="text-sm text-gray-600 mt-2">{description}</p>
            )}
          </div>
          {action && (
            <Button onClick={action.onClick} className="mt-4">
              {action.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

