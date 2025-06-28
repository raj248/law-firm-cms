"use client"

import { useTheme } from "@/hooks/theme-provider"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-full"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="center">
        Toggle Theme
      </TooltipContent>
    </Tooltip>
  )
}
