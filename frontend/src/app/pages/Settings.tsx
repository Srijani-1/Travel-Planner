import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import { Separator } from "../components/ui/separator";
import { Lock, Bell, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function Settings() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    tripReminders: true,
    recommendations: false,
  });

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    shareTrips: false,
    activityTracking: true,
  });

  const handleChangePassword = () => {
    toast.success("Password change request sent to your email");
  };

  const handleDeleteAccount = () => {
    toast.error("Account deletion requires confirmation via email");
  };

  const handleSaveNotifications = () => {
    toast.success("Notification preferences saved");
  };

  const handleSavePrivacy = () => {
    toast.success("Privacy settings updated");
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and security</p>
      </div>

      <div className="space-y-6">
        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Manage your password and security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" placeholder="Enter current password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" placeholder="Enter new password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" placeholder="Confirm new password" />
            </div>
            <Button onClick={handleChangePassword}>Change Password</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Choose what notifications you want to receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-600">Receive updates via email</p>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, email: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <p className="text-sm text-gray-600">Receive push notifications in browser</p>
              </div>
              <Switch
                checked={notifications.push}
                onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Trip Reminders</Label>
                <p className="text-sm text-gray-600">Get reminders about upcoming trips</p>
              </div>
              <Switch
                checked={notifications.tripReminders}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, tripReminders: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Recommendations</Label>
                <p className="text-sm text-gray-600">Receive personalized travel recommendations</p>
              </div>
              <Switch
                checked={notifications.recommendations}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, recommendations: checked })
                }
              />
            </div>
            <Button onClick={handleSaveNotifications} className="mt-4">
              Save Preferences
            </Button>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy
            </CardTitle>
            <CardDescription>Control your privacy and data sharing preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Profile Visibility</Label>
                <p className="text-sm text-gray-600">Make your profile visible to other users</p>
              </div>
              <Switch
                checked={privacy.profileVisible}
                onCheckedChange={(checked) => setPrivacy({ ...privacy, profileVisible: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Share Trips</Label>
                <p className="text-sm text-gray-600">Allow others to see your trips</p>
              </div>
              <Switch
                checked={privacy.shareTrips}
                onCheckedChange={(checked) => setPrivacy({ ...privacy, shareTrips: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Activity Tracking</Label>
                <p className="text-sm text-gray-600">
                  Help us improve by tracking your activity
                </p>
              </div>
              <Switch
                checked={privacy.activityTracking}
                onCheckedChange={(checked) =>
                  setPrivacy({ ...privacy, activityTracking: checked })
                }
              />
            </div>
            <Button onClick={handleSavePrivacy} className="mt-4">
              Save Privacy Settings
            </Button>
          </CardContent>
        </Card>

        {/* Account Management */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>Irreversible account actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
              <h3 className="font-semibold text-red-900 mb-2">Delete Account</h3>
              <p className="text-sm text-red-800 mb-4">
                Once you delete your account, there is no going back. All your trips, preferences,
                and data will be permanently deleted.
              </p>
              <Button variant="destructive" onClick={handleDeleteAccount}>
                Delete My Account
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* App Information */}
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
            <CardDescription>App information and resources</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Terms of Service</span>
              <Button variant="link" className="h-auto p-0">
                View
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Privacy Policy</span>
              <Button variant="link" className="h-auto p-0">
                View
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Help & Support</span>
              <Button variant="link" className="h-auto p-0">
                Contact
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}