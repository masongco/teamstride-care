import { useState } from 'react';
import { UserPlus, Eye, EyeOff, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { createUserSchema, type CreateUserFormData } from '@/lib/user-validation-schemas';

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated?: () => void;
}

const initialFormData: CreateUserFormData = {
  email: '',
  password: '',
  display_name: '',
  role: 'employee',
};

export function CreateUserDialog({ open, onOpenChange, onUserCreated }: CreateUserDialogProps) {
  const [formData, setFormData] = useState<CreateUserFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateUserFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = (): boolean => {
    const result = createUserSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof CreateUserFormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof CreateUserFormData;
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        throw new Error('Unable to resolve current user');
      }

      const { data: orgIdData, error: orgIdError } = await supabase.rpc(
        'get_user_organisation_id',
        { _user_id: authData.user.id },
      );

      if (orgIdError || !orgIdData) {
        throw new Error('Unable to resolve organisation for user');
      }

      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email.trim(),
          password: formData.password,
          display_name: formData.display_name.trim(),
          role: formData.role,
          organisation_id: orgIdData,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to create user');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.user?.id) {
        throw new Error('User created, but response is missing user id.');
      }

      const { error: assignError } = await supabase.rpc('admin_assign_profile_org' as any, {
        _user_id: data.user.id,
        _org_id: orgIdData,
      });

      if (assignError) {
        const { data: profileUpdateData, error: profileUpdateError } = await supabase
          .from('profiles')
          .upsert(
            {
              user_id: data.user.id,
              organisation_id: orgIdData,
            },
            { onConflict: 'user_id' },
          )
          .select('organisation_id')
          .maybeSingle();

        if (profileUpdateError || !profileUpdateData?.organisation_id) {
          throw new Error('User created, but failed to assign organisation.');
        }
      }

      toast({
        title: 'User Created',
        description: `${formData.display_name} has been added with ${formData.role} role.`,
      });

      // Reset form and close dialog
      setFormData(initialFormData);
      setErrors({});
      onOpenChange(false);
      onUserCreated?.();
    } catch (error) {
      console.error('Failed to create user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create user',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (field: keyof CreateUserFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    handleFieldChange('password', password);
    setShowPassword(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Create User Account
          </DialogTitle>
          <DialogDescription>
            Create a new user account with specific role permissions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name *</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => handleFieldChange('display_name', e.target.value)}
              placeholder="John Smith"
              className={errors.display_name ? 'border-destructive' : ''}
              maxLength={50}
              disabled={isSubmitting}
            />
            {errors.display_name && (
              <p className="text-xs text-destructive">{errors.display_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              placeholder="john@company.com"
              className={errors.email ? 'border-destructive' : ''}
              maxLength={255}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                onClick={generatePassword}
                disabled={isSubmitting}
              >
                Generate Strong Password
              </Button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleFieldChange('password', e.target.value)}
                placeholder="Minimum 6 characters"
                className={`pr-10 ${errors.password ? 'border-destructive' : ''}`}
                maxLength={72}
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              value={formData.role}
              onValueChange={(v) => handleFieldChange('role', v as CreateUserFormData['role'])}
              disabled={isSubmitting}
            >
              <SelectTrigger className={errors.role ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-xs text-destructive">{errors.role}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.role === 'admin' && 'Full access to all features and user management'}
              {formData.role === 'manager' && 'Can manage employees, contracts, and view reports'}
              {formData.role === 'employee' && 'Can view own contracts and profile information'}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 gradient-primary" 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create User
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
