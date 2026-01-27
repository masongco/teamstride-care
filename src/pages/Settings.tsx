import { useState } from 'react';
import { useSettings, Department, Position } from '@/hooks/useSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Building2, Briefcase, Loader2 } from 'lucide-react';

export default function Settings() {
  const {
    departments,
    positions,
    loading,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    addPosition,
    updatePosition,
    deletePosition,
  } = useSettings();

  // Department state
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [deptDeleteDialogOpen, setDeptDeleteDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);
  const [deptName, setDeptName] = useState('');
  const [deptDescription, setDeptDescription] = useState('');
  const [deptSubmitting, setDeptSubmitting] = useState(false);

  // Position state
  const [posDialogOpen, setPosDialogOpen] = useState(false);
  const [posDeleteDialogOpen, setPosDeleteDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [deletingPosition, setDeletingPosition] = useState<Position | null>(null);
  const [posName, setPosName] = useState('');
  const [posDepartmentId, setPosDepartmentId] = useState<string>('');
  const [posDescription, setPosDescription] = useState('');
  const [posSubmitting, setPosSubmitting] = useState(false);

  // Department handlers
  const openDeptDialog = (department?: Department) => {
    if (department) {
      setEditingDepartment(department);
      setDeptName(department.name);
      setDeptDescription(department.description || '');
    } else {
      setEditingDepartment(null);
      setDeptName('');
      setDeptDescription('');
    }
    setDeptDialogOpen(true);
  };

  const handleDeptSubmit = async () => {
    if (!deptName.trim()) return;
    
    setDeptSubmitting(true);
    if (editingDepartment) {
      await updateDepartment(editingDepartment.id, deptName.trim(), deptDescription.trim());
    } else {
      await addDepartment(deptName.trim(), deptDescription.trim());
    }
    setDeptSubmitting(false);
    setDeptDialogOpen(false);
  };

  const handleDeptDelete = async () => {
    if (!deletingDepartment) return;
    await deleteDepartment(deletingDepartment.id);
    setDeptDeleteDialogOpen(false);
    setDeletingDepartment(null);
  };

  // Position handlers
  const openPosDialog = (position?: Position) => {
    if (position) {
      setEditingPosition(position);
      setPosName(position.name);
      setPosDepartmentId(position.department_id || '');
      setPosDescription(position.description || '');
    } else {
      setEditingPosition(null);
      setPosName('');
      setPosDepartmentId('');
      setPosDescription('');
    }
    setPosDialogOpen(true);
  };

  const handlePosSubmit = async () => {
    if (!posName.trim()) return;
    
    setPosSubmitting(true);
    if (editingPosition) {
      await updatePosition(
        editingPosition.id, 
        posName.trim(), 
        posDepartmentId || undefined, 
        posDescription.trim()
      );
    } else {
      await addPosition(posName.trim(), posDepartmentId || undefined, posDescription.trim());
    }
    setPosSubmitting(false);
    setPosDialogOpen(false);
  };

  const handlePosDelete = async () => {
    if (!deletingPosition) return;
    await deletePosition(deletingPosition.id);
    setPosDeleteDialogOpen(false);
    setDeletingPosition(null);
  };

  const getDepartmentName = (departmentId: string | null) => {
    if (!departmentId) return null;
    const dept = departments.find(d => d.id === departmentId);
    return dept?.name || null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization's departments and positions
        </p>
      </div>

      <Tabs defaultValue="departments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="positions" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Positions
          </TabsTrigger>
        </TabsList>

        {/* Departments Tab */}
        <TabsContent value="departments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg">Departments</CardTitle>
                <CardDescription>
                  Manage the departments in your organization
                </CardDescription>
              </div>
              <Button onClick={() => openDeptDialog()} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Department
              </Button>
            </CardHeader>
            <CardContent>
              {departments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No departments yet</p>
                  <p className="text-sm">Add your first department to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Positions</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map((dept) => {
                      const positionCount = positions.filter(p => p.department_id === dept.id).length;
                      return (
                        <TableRow key={dept.id}>
                          <TableCell className="font-medium">{dept.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {dept.description || '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{positionCount} positions</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDeptDialog(dept)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setDeletingDepartment(dept);
                                  setDeptDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Positions Tab */}
        <TabsContent value="positions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg">Positions</CardTitle>
                <CardDescription>
                  Manage the job positions in your organization
                </CardDescription>
              </div>
              <Button onClick={() => openPosDialog()} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Position
              </Button>
            </CardHeader>
            <CardContent>
              {positions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No positions yet</p>
                  <p className="text-sm">Add your first position to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.map((pos) => (
                      <TableRow key={pos.id}>
                        <TableCell className="font-medium">{pos.name}</TableCell>
                        <TableCell>
                          {getDepartmentName(pos.department_id) ? (
                            <Badge variant="outline">
                              {getDepartmentName(pos.department_id)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {pos.description || '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openPosDialog(pos)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDeletingPosition(pos);
                                setPosDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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
        </TabsContent>
      </Tabs>

      {/* Department Dialog */}
      <Dialog open={deptDialogOpen} onOpenChange={setDeptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDepartment ? 'Edit Department' : 'Add Department'}
            </DialogTitle>
            <DialogDescription>
              {editingDepartment
                ? 'Update the department details below'
                : 'Enter the details for the new department'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dept-name">Name *</Label>
              <Input
                id="dept-name"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                placeholder="e.g., Human Resources"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept-description">Description</Label>
              <Textarea
                id="dept-description"
                value={deptDescription}
                onChange={(e) => setDeptDescription(e.target.value)}
                placeholder="Brief description of the department..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeptDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeptSubmit} disabled={!deptName.trim() || deptSubmitting}>
              {deptSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingDepartment ? (
                'Update'
              ) : (
                'Add'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Department Delete Dialog */}
      <AlertDialog open={deptDeleteDialogOpen} onOpenChange={setDeptDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingDepartment?.name}"? 
              This action cannot be undone. Positions linked to this department will have their department unset.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeptDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Position Dialog */}
      <Dialog open={posDialogOpen} onOpenChange={setPosDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPosition ? 'Edit Position' : 'Add Position'}
            </DialogTitle>
            <DialogDescription>
              {editingPosition
                ? 'Update the position details below'
                : 'Enter the details for the new position'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pos-name">Name *</Label>
              <Input
                id="pos-name"
                value={posName}
                onChange={(e) => setPosName(e.target.value)}
                placeholder="e.g., Support Worker"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pos-department">Department</Label>
              <Select value={posDepartmentId} onValueChange={setPosDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a department (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No department</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pos-description">Description</Label>
              <Textarea
                id="pos-description"
                value={posDescription}
                onChange={(e) => setPosDescription(e.target.value)}
                placeholder="Brief description of the position..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPosDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePosSubmit} disabled={!posName.trim() || posSubmitting}>
              {posSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingPosition ? (
                'Update'
              ) : (
                'Add'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Position Delete Dialog */}
      <AlertDialog open={posDeleteDialogOpen} onOpenChange={setPosDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Position</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingPosition?.name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePosDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
