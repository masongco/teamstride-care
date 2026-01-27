import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, LayoutGrid } from 'lucide-react';
import { useSidebarSettings, SidebarSetting } from '@/hooks/useSidebarSettings';

export function SidebarSettingsTab() {
  const { settings, loading, updateVisibility } = useSidebarSettings();

  const handleToggle = async (setting: SidebarSetting) => {
    await updateVisibility(setting.module_key, !setting.is_visible);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Navigation Visibility</CardTitle>
        <CardDescription>
          Control which modules appear in the sidebar navigation. Hidden modules are still accessible via direct URL.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {settings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No sidebar settings configured</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Visible</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings.map((setting) => (
                <TableRow key={setting.id}>
                  <TableCell className="font-medium">{setting.module_label}</TableCell>
                  <TableCell className="text-muted-foreground">{setting.display_order}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Label htmlFor={`toggle-${setting.module_key}`} className="sr-only">
                        Toggle {setting.module_label} visibility
                      </Label>
                      <Switch
                        id={`toggle-${setting.module_key}`}
                        checked={setting.is_visible}
                        onCheckedChange={() => handleToggle(setting)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
