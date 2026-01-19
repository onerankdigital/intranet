import { cn } from "@/lib/utils"

interface LoaderProps {
  className?: string
  size?: "sm" | "md" | "lg"
  text?: string
  fullScreen?: boolean
}

export function Loader({ 
  className, 
  size = "md", 
  text = "Loading...",
  fullScreen = false 
}: LoaderProps) {
  const sizeClasses = {
    sm: "h-6 w-6 border-2",
    md: "h-12 w-12 border-4",
    lg: "h-16 w-16 border-4"
  }

  const containerClasses = fullScreen
    ? "min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background"
    : "flex items-center justify-center p-8"

  return (
    <div className={cn(containerClasses, className)}>
      <div className="text-center space-y-4">
        <div className="relative">
          <div
            className={cn(
              "border-primary/20 border-t-primary rounded-full animate-spin mx-auto",
              sizeClasses[size]
            )}
          />
        </div>
        {text && (
          <p className="text-muted-foreground font-medium">{text}</p>
        )}
      </div>
    </div>
  )
}

