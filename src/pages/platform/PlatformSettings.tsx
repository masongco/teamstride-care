import { PlatformLayout } from '@/components/platform/PlatformLayout';
import { PlatformGuard } from '@/components/platform/PlatformGuard';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Settings, Clock, Shield, Database } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function PlatformSettings() {
  const { isOwner } = usePlatformAuth();

  const handleSave = () => {
    toast({ title: 'Settings saved', description: 'Platform settings have been updated.' });
  };

  return (
    <PlatformGuard>
      <PlatformLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
            <p className="text-slate-400 mt-1">Configure global platform settings</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Trial Settings */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Trial Settings
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Configure default trial period for new organisations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-200">Default Trial Length (days)</Label>
                  <Input
                    type="number"
                    defaultValue={14}
                    className="bg-slate-700/50 border-slate-600 text-white"
                    disabled={!isOwner}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-200">Auto-suspend on trial expiry</Label>
                    <p className="text-sm text-slate-400">
                      Automatically suspend orgs when trial ends
                    </p>
                  </div>
                  <Switch defaultChecked disabled={!isOwner} />
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Configure platform security options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-200">Session Timeout (minutes)</Label>
                  <Input
                    type="number"
                    defaultValue={60}
                    className="bg-slate-700/50 border-slate-600 text-white"
                    disabled={!isOwner}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Impersonation Session Max (minutes)</Label>
                  <Input
                    type="number"
                    defaultValue={30}
                    className="bg-slate-700/50 border-slate-600 text-white"
                    disabled={!isOwner}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-200">Require MFA for platform users</Label>
                    <p className="text-sm text-slate-400">
                      Enforce MFA for all platform admins
                    </p>
                  </div>
                  <Switch disabled={!isOwner} />
                </div>
              </CardContent>
            </Card>

            {/* Audit Settings */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Audit & Retention
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Configure audit log retention policies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-200">Audit Log Retention (days)</Label>
                  <Input
                    type="number"
                    defaultValue={365}
                    className="bg-slate-700/50 border-slate-600 text-white"
                    disabled={!isOwner}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-200">Log all API access</Label>
                    <p className="text-sm text-slate-400">
                      Record all API calls (increases storage)
                    </p>
                  </div>
                  <Switch disabled={!isOwner} />
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Configure platform notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-200">Trial expiry alerts</Label>
                    <p className="text-sm text-slate-400">
                      Notify when org trials are expiring
                    </p>
                  </div>
                  <Switch defaultChecked disabled={!isOwner} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-200">Security event alerts</Label>
                    <p className="text-sm text-slate-400">
                      Notify on suspicious activity
                    </p>
                  </div>
                  <Switch defaultChecked disabled={!isOwner} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Save Button */}
          {isOwner && (
            <div className="flex justify-end">
              <Button onClick={handleSave} size="lg">
                Save Settings
              </Button>
            </div>
          )}
        </div>
      </PlatformLayout>
    </PlatformGuard>
  );
}
