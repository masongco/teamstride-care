import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuditPackBuilder } from '@/components/audit/AuditPackBuilder';
import { ExportHistory } from '@/components/audit/ExportHistory';
import { FileArchive, History } from 'lucide-react';

export default function AuditExports() {
  const [activeTab, setActiveTab] = useState('builder');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit & Exports</h1>
        <p className="text-muted-foreground mt-1">
          Generate regulator-ready audit packs for compliance verification
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <FileArchive className="h-4 w-4" />
            Audit Pack Builder
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Export History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder">
          <AuditPackBuilder />
        </TabsContent>

        <TabsContent value="history">
          <ExportHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
