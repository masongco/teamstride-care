import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Plus, Lock, User } from 'lucide-react';
import type { HRCaseNote, CreateNoteInput, HRNoteVisibility } from '@/types/hrCases';

interface CaseNotesTabProps {
  notes: HRCaseNote[];
  onAddNote: (input: Omit<CreateNoteInput, 'hr_case_id'>) => Promise<boolean>;
}

export function CaseNotesTab({ notes, onAddNote }: CaseNotesTabProps) {
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, reset } = useForm<Omit<CreateNoteInput, 'hr_case_id'>>({
    defaultValues: {
      note_text: '',
      visibility: 'standard',
    },
  });

  const handleFormSubmit = async (data: Omit<CreateNoteInput, 'hr_case_id'>) => {
    setLoading(true);
    try {
      const success = await onAddNote(data);
      if (success) {
        setAdding(false);
        reset();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Case Notes</h3>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Note
          </Button>
        )}
      </div>

      {adding && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Note</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="note_text">Note *</Label>
                <Textarea
                  id="note_text"
                  {...register('note_text', { required: true })}
                  placeholder="Enter your note..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  value={watch('visibility')}
                  onValueChange={(value) => setValue('visibility', value as HRNoteVisibility)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard (All Case Viewers)</SelectItem>
                    <SelectItem value="restricted">Restricted (Admin Only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Note'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {notes.length === 0 && !adding && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No notes added yet</p>
          </CardContent>
        </Card>
      )}

      {notes.map((note) => (
        <Card key={note.id} className={note.visibility === 'restricted' ? 'border-red-200' : ''}>
          <CardContent className="py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {note.created_by_name || 'Unknown User'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(note.created_at), 'dd MMM yyyy HH:mm')}
                  </span>
                  {note.visibility === 'restricted' && (
                    <Badge variant="outline" className="border-red-500 text-red-500">
                      <Lock className="h-3 w-3 mr-1" />
                      Restricted
                    </Badge>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{note.note_text}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
