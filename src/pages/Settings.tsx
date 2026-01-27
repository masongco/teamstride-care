import { useState } from 'react';
import { useSettings, Department, Position, AwardClassification, AwardClassificationInput } from '@/hooks/useSettings';
import { useUserRole, useUserRolesManagement, AppRole, UserWithRole } from '@/hooks/useUserRole';
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
import { Plus, Pencil, Trash2, Building2, Briefcase, Loader2, Users, Shield, ShieldCheck, User, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const ROLE_CONFIG: Record<AppRole, { label: string; icon: typeof Shield; variant: 'default' | 'secondary' | 'outline' }> = {
  admin: { label: 'Admin', icon: ShieldCheck, variant: 'default' },
  manager: { label: 'Manager', icon: Shield, variant: 'secondary' },
  employee: { label: 'Employee', icon: User, variant: 'outline' },
};

export default function Settings() {
  const {
    departments,
    positions,
    awardClassifications,
    loading,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    addPosition,
    updatePosition,
    deletePosition,
    addAwardClassification,
    updateAwardClassification,
    deleteAwardClassification,
  } = useSettings();

  const { isAdmin, loading: roleLoading } = useUserRole();
  const { users, loading: usersLoading, updateUserRole } = useUserRolesManagement();

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

  // User role state
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>('employee');
  const [roleSubmitting, setRoleSubmitting] = useState(false);

  // Award Classification state
  const [awardDialogOpen, setAwardDialogOpen] = useState(false);
  const [awardDeleteDialogOpen, setAwardDeleteDialogOpen] = useState(false);
  const [editingAward, setEditingAward] = useState<AwardClassification | null>(null);
  const [deletingAward, setDeletingAward] = useState<AwardClassification | null>(null);
  const [awardName, setAwardName] = useState('');
  const [awardDescription, setAwardDescription] = useState('');
  const [awardBaseRate, setAwardBaseRate] = useState('');
  const [awardSaturdayMult, setAwardSaturdayMult] = useState('1.5');
  const [awardSundayMult, setAwardSundayMult] = useState('2.0');
  const [awardPublicHolidayMult, setAwardPublicHolidayMult] = useState('2.5');
  const [awardEveningMult, setAwardEveningMult] = useState('1.15');
  const [awardNightMult, setAwardNightMult] = useState('1.25');
  const [awardOvertimeMult, setAwardOvertimeMult] = useState('1.5');
  const [awardSubmitting, setAwardSubmitting] = useState(false);

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

  // User role handlers
  const openRoleDialog = (user: UserWithRole) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    setRoleDialogOpen(true);
  };

  const handleRoleSubmit = async () => {
    if (!editingUser) return;
    
    setRoleSubmitting(true);
    const result = await updateUserRole(editingUser.user_id, selectedRole);
    
    if (result.success) {
      toast({
        title: 'Role Updated',
        description: `Successfully updated role to ${ROLE_CONFIG[selectedRole].label}`,
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to update user role. You may not have admin permissions.',
        variant: 'destructive',
      });
    }
    
    setRoleSubmitting(false);
    setRoleDialogOpen(false);
  };

  // Award Classification handlers
  const openAwardDialog = (award?: AwardClassification) => {
    if (award) {
      setEditingAward(award);
      setAwardName(award.name);
      setAwardDescription(award.description || '');
      setAwardBaseRate(award.base_hourly_rate.toString());
      setAwardSaturdayMult(award.saturday_multiplier.toString());
      setAwardSundayMult(award.sunday_multiplier.toString());
      setAwardPublicHolidayMult(award.public_holiday_multiplier.toString());
      setAwardEveningMult(award.evening_multiplier.toString());
      setAwardNightMult(award.night_multiplier.toString());
      setAwardOvertimeMult(award.overtime_multiplier.toString());
    } else {
      setEditingAward(null);
      setAwardName('');
      setAwardDescription('');
      setAwardBaseRate('');
      setAwardSaturdayMult('1.5');
      setAwardSundayMult('2.0');
      setAwardPublicHolidayMult('2.5');
      setAwardEveningMult('1.15');
      setAwardNightMult('1.25');
      setAwardOvertimeMult('1.5');
    }
    setAwardDialogOpen(true);
  };

  const handleAwardSubmit = async () => {
    if (!awardName.trim() || !awardBaseRate) return;
    
    const input: AwardClassificationInput = {
      name: awardName.trim(),
      description: awardDescription.trim(),
      base_hourly_rate: parseFloat(awardBaseRate),
      saturday_multiplier: parseFloat(awardSaturdayMult),
      sunday_multiplier: parseFloat(awardSundayMult),
      public_holiday_multiplier: parseFloat(awardPublicHolidayMult),
      evening_multiplier: parseFloat(awardEveningMult),
      night_multiplier: parseFloat(awardNightMult),
      overtime_multiplier: parseFloat(awardOvertimeMult),
    };

    setAwardSubmitting(true);
    if (editingAward) {
      await updateAwardClassification(editingAward.id, input);
    } else {
      await addAwardClassification(input);
    }
    setAwardSubmitting(false);
    setAwardDialogOpen(false);
  };

  const handleAwardDelete = async () => {
    if (!deletingAward) return;
    await deleteAwardClassification(deletingAward.id);
    setAwardDeleteDialogOpen(false);
    setDeletingAward(null);
  };

  const getDepartmentName = (departmentId: string | null) => {
    if (!departmentId) return null;
    const dept = departments.find(d => d.id === departmentId);
    return dept?.name || null;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  if (loading || roleLoading) {
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
          Manage your organization's departments, positions, award classifications, and user roles
        </p>
      </div>

      <Tabs defaultValue="departments" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="positions" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Positions
          </TabsTrigger>
          <TabsTrigger value="awards" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Award Classifications
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Roles
            </TabsTrigger>
          )}
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

        {/* Award Classifications Tab */}
        <TabsContent value="awards">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Award Classifications
                </CardTitle>
                <CardDescription>
                  Configure pay rates and penalty multipliers for different award levels
                </CardDescription>
              </div>
              <Button onClick={() => openAwardDialog()} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Classification
              </Button>
            </CardHeader>
            <CardContent>
              {awardClassifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No award classifications yet</p>
                  <p className="text-sm">Add your first award classification to configure pay rates</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Base Rate</TableHead>
                        <TableHead>Sat</TableHead>
                        <TableHead>Sun</TableHead>
                        <TableHead>PH</TableHead>
                        <TableHead>Eve</TableHead>
                        <TableHead>Night</TableHead>
                        <TableHead>OT</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {awardClassifications.map((award) => (
                        <TableRow key={award.id}>
                          <TableCell className="font-medium">
                            <div>
                              {award.name}
                              {award.description && (
                                <p className="text-xs text-muted-foreground">{award.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">
                            {formatCurrency(award.base_hourly_rate)}/hr
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            ×{award.saturday_multiplier}
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            ×{award.sunday_multiplier}
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            ×{award.public_holiday_multiplier}
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            ×{award.evening_multiplier}
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            ×{award.night_multiplier}
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            ×{award.overtime_multiplier}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openAwardDialog(award)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setDeletingAward(award);
                                  setAwardDeleteDialogOpen(true);
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Roles Tab - Admin Only */}
        {isAdmin && (
          <TabsContent value="roles">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    User Roles
                  </CardTitle>
                  <CardDescription>
                    Manage user roles and permissions. Only admins can access this section.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No users found</p>
                    <p className="text-sm">Users will appear here after they sign up</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => {
                        const roleConfig = ROLE_CONFIG[user.role];
                        const RoleIcon = roleConfig.icon;
                        return (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.display_name || user.email}
                            </TableCell>
                            <TableCell>
                              <Badge variant={roleConfig.variant} className="flex items-center gap-1 w-fit">
                                <RoleIcon className="h-3 w-3" />
                                {roleConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(user.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openRoleDialog(user)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
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
        )}
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

      {/* User Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Change the role for {editingUser?.display_name || editingUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      Admin - Full access to all features
                    </div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Manager - Manage employees and operations
                    </div>
                  </SelectItem>
                  <SelectItem value="employee">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Employee - Basic access
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleSubmit} disabled={roleSubmitting}>
              {roleSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Update Role'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Award Classification Dialog */}
      <Dialog open={awardDialogOpen} onOpenChange={setAwardDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAward ? 'Edit Award Classification' : 'Add Award Classification'}
            </DialogTitle>
            <DialogDescription>
              {editingAward
                ? 'Update the award classification details and pay rates'
                : 'Enter the details for the new award classification'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="award-name">Name *</Label>
                <Input
                  id="award-name"
                  value={awardName}
                  onChange={(e) => setAwardName(e.target.value)}
                  placeholder="e.g., Level 1 Support Worker"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="award-base-rate">Base Hourly Rate (AUD) *</Label>
                <Input
                  id="award-base-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={awardBaseRate}
                  onChange={(e) => setAwardBaseRate(e.target.value)}
                  placeholder="e.g., 28.50"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="award-description">Description</Label>
              <Textarea
                id="award-description"
                value={awardDescription}
                onChange={(e) => setAwardDescription(e.target.value)}
                placeholder="Brief description of this award level..."
                rows={2}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Penalty Rate Multipliers</Label>
              <p className="text-sm text-muted-foreground">
                These multipliers are applied to the base hourly rate for different work conditions
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="award-sat">Saturday</Label>
                  <Input
                    id="award-sat"
                    type="number"
                    step="0.01"
                    min="1"
                    value={awardSaturdayMult}
                    onChange={(e) => setAwardSaturdayMult(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="award-sun">Sunday</Label>
                  <Input
                    id="award-sun"
                    type="number"
                    step="0.01"
                    min="1"
                    value={awardSundayMult}
                    onChange={(e) => setAwardSundayMult(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="award-ph">Public Holiday</Label>
                  <Input
                    id="award-ph"
                    type="number"
                    step="0.01"
                    min="1"
                    value={awardPublicHolidayMult}
                    onChange={(e) => setAwardPublicHolidayMult(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="award-eve">Evening</Label>
                  <Input
                    id="award-eve"
                    type="number"
                    step="0.01"
                    min="1"
                    value={awardEveningMult}
                    onChange={(e) => setAwardEveningMult(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="award-night">Night</Label>
                  <Input
                    id="award-night"
                    type="number"
                    step="0.01"
                    min="1"
                    value={awardNightMult}
                    onChange={(e) => setAwardNightMult(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="award-ot">Overtime</Label>
                  <Input
                    id="award-ot"
                    type="number"
                    step="0.01"
                    min="1"
                    value={awardOvertimeMult}
                    onChange={(e) => setAwardOvertimeMult(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAwardDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAwardSubmit} 
              disabled={!awardName.trim() || !awardBaseRate || awardSubmitting}
            >
              {awardSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingAward ? (
                'Update'
              ) : (
                'Add'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Award Classification Delete Dialog */}
      <AlertDialog open={awardDeleteDialogOpen} onOpenChange={setAwardDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Award Classification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingAward?.name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAwardDelete}
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
