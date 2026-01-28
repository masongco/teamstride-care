import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit2, Trash2, Link, Loader2 } from 'lucide-react';
import type { PayrollMapping, CreatePayrollMappingInput } from '@/types/payroll';

interface PayrollMappingsManagerProps {
  mappings: PayrollMapping[];
  onCreateMapping: (input: CreatePayrollMappingInput) => Promise<unknown>;
  onUpdateMapping: (id: string, updates: Partial<CreatePayrollMappingInput>) => Promise<unknown>;
  onDeleteMapping: (id: string) => Promise<unknown>;
  isCreating: boolean;
}

export function PayrollMappingsManager({
  mappings,
  onCreateMapping,
  onUpdateMapping,
  onDeleteMapping,
  isCreating,
}: PayrollMappingsManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<PayrollMapping | null>(null);
  const [formData, setFormData] = useState<CreatePayrollMappingInput>({
    shift_type: '',
    earning_code: '',
    description: '',
    multiplier: 1.0,
  });

  const handleOpenCreate = () => {
    setEditingMapping(null);
    setFormData({ shift_type: '', earning_code: '', description: '', multiplier: 1.0 });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (mapping: PayrollMapping) => {
    setEditingMapping(mapping);
    setFormData({
      shift_type: mapping.shift_type,
      earning_code: mapping.earning_code,
      description: mapping.description || '',
      multiplier: mapping.multiplier,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.shift_type || !formData.earning_code) return;

    if (editingMapping) {
      await onUpdateMapping(editingMapping.id, formData);
    } else {
      await onCreateMapping(formData);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this mapping?')) {
      await onDeleteMapping(id);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Link className="h-5 w-5" />
            Payroll Mappings
          </CardTitle>
          <CardDescription>
            Map shift types to payroll earning codes
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Mapping
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMapping ? 'Edit Mapping' : 'Create Mapping'}
              </DialogTitle>
              <DialogDescription>
                Map a shift type to a payroll earning code
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="shift_type">Shift Type</Label>
                <Input
                  id="shift_type"
                  placeholder="e.g., standard, overtime, weekend"
                  value={formData.shift_type}
                  onChange={(e) => setFormData({ ...formData, shift_type: e.target.value })}
                  disabled={!!editingMapping}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="earning_code">Earning Code</Label>
                <Input
                  id="earning_code"
                  placeholder="e.g., ORD, OT1.5, SAT"
                  value={formData.earning_code}
                  onChange={(e) => setFormData({ ...formData, earning_code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="e.g., Ordinary Hours"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="multiplier">Multiplier</Label>
                <Input
                  id="multiplier"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.multiplier}
                  onChange={(e) => setFormData({ ...formData, multiplier: parseFloat(e.target.value) || 1.0 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isCreating || !formData.shift_type || !formData.earning_code}
              >
                {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingMapping ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {mappings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Link className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No payroll mappings configured</p>
            <p className="text-sm">Add mappings to export timesheets with earning codes</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shift Type</TableHead>
                <TableHead>Earning Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Multiplier</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell className="font-medium font-mono">
                    {mapping.shift_type}
                  </TableCell>
                  <TableCell className="font-mono">{mapping.earning_code}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {mapping.description || '-'}
                  </TableCell>
                  <TableCell>{mapping.multiplier}x</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenEdit(mapping)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDelete(mapping.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
