"use client"

// import { useState } from "react"
import { Button } from "@/components/ui/button"
// import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useTheme } from "@/hooks/theme-provider"
import { toast } from "sonner"
import { CheckForUpdateButton } from "../checkForUpdateButton"
import { TagsCourtsButton } from "../dialogs/TagCourtButton"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  // const [debugEnabled, setDebugEnabled] = useState(false)
  // const [autoDownloadUpdates, setAutoDownloadUpdates] = useState(true)
  // const [notifyBeforeRestart, setNotifyBeforeRestart] = useState(true)

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Theme</Label>
            <Button
              variant="outline"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data & Sync */}
      <Card>
        <CardHeader>
          <CardTitle>Data & Sync</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 flex flex-col ">
          {/* <div className="flex items-center justify-between">
            <Label>Auto-Sync every 30 min</Label>
            <Switch checked={autoSync} onCheckedChange={setAutoSync} />
          </div> */}
          <TagsCourtsButton />
          {/* <Button variant="secondary" onClick={() => toast.message("Manual sync triggered")}>Sync Now</Button> */}
          {/* <Button variant="destructive" onClick={() => toast.message("Local cache cleared")}>Clear Cache</Button> */}
        </CardContent>
      </Card>

      {/* Notifications */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Notifications</Label>
            <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
          </div>
        </CardContent>
      </Card> */}

      {/* Update Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Update Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CheckForUpdateButton />
          {/* <div className="flex items-center justify-between">
            <Label>Auto-Download Updates</Label>
            <Switch checked={autoDownloadUpdates} onCheckedChange={setAutoDownloadUpdates} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Notify Before Restart</Label>
            <Switch checked={notifyBeforeRestart} onCheckedChange={setNotifyBeforeRestart} />
          </div> */}
        </CardContent>
      </Card>

      {/* Developer / Debug */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Developer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Debug Logs</Label>
            <Switch checked={debugEnabled} onCheckedChange={setDebugEnabled} />
          </div>
          <Button onClick={() => toast.message("Logs exported")}>Export Logs</Button>
          <Button onClick={() => toast.success("Test notification")}>Test Notification</Button>
        </CardContent>
      </Card> */}

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>User: Shashank Kumar (Admin)</p>
          <Button variant="destructive" onClick={() => toast.success("Logged out")}>Logout</Button>
        </CardContent>
      </Card>
    </div>
  )
}
