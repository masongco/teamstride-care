import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, Upload, Lock, ExternalLink, User } from 'lucide-react';
import type { HRCaseEvidence, HRAccessLevel } from '@/types/hrCases';

interface CaseEvidenceTabProps {
  evidence: HRCaseEvidence[];
  onUploadEvidence: (file: File, description?: string, accessLevel?: HRAccessLevel) => Promise<boolean>;
}

export function CaseEvidenceTab({ evidence, onUploadEvidence }: CaseEvidenceTabProps) {
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [accessLevel, setAccessLevel] = useState<HRAccessLevel>('normal');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      const success = await onUploadEvidence(selectedFile, description, accessLevel);
      if (success) {
        setUploading(false);
        setSelectedFile(null);
        setDescription('');
        setAccessLevel('normal');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Evidence & Documents</h3>
        {!uploading && (
          <Button size="sm" onClick={() => setUploading(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Upload Evidence
          </Button>
        )}
      </div>

      {uploading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upload Evidence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">File *</Label>
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this evidence..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="access_level">Access Level</Label>
              <Select value={accessLevel} onValueChange={(v) => setAccessLevel(v as HRAccessLevel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal (All Case Viewers)</SelectItem>
                  <SelectItem value="restricted">Restricted (Admin Only)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setUploading(false);
                setSelectedFile(null);
                setDescription('');
              }}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={!selectedFile || loading}>
                {loading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {evidence.length === 0 && !uploading && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No evidence uploaded yet</p>
          </CardContent>
        </Card>
      )}

      {evidence.map((item) => (
        <Card key={item.id} className={item.access_level === 'restricted' ? 'border-red-200' : ''}>
          <CardContent className="py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{item.file_name}</span>
                  {item.access_level === 'restricted' && (
                    <Badge variant="outline" className="border-red-500 text-red-500">
                      <Lock className="h-3 w-3 mr-1" />
                      Restricted
                    </Badge>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {item.uploaded_by_name || 'Unknown'}
                  </span>
                  <span>
                    {format(new Date(item.uploaded_at), 'dd MMM yyyy HH:mm')}
                  </span>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
