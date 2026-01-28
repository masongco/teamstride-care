import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Building,
  Briefcase,
  AlertCircle,
  Save
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ProfileData {
  email: string;
  display_name: string;
  phone?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  department?: string;
  position?: string;
  start_date?: string;
  employee_id?: string;
  avatar_url?: string;
}

export default function MyProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<ProfileData>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const profileInfo: ProfileData = {
        email: user.email || '',
        display_name: profileData?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || '',
        avatar_url: profileData?.avatar_url || user.user_metadata?.avatar_url,
        phone: user.user_metadata?.phone,
        address: user.user_metadata?.address,
        emergency_contact_name: user.user_metadata?.emergency_contact_name,
        emergency_contact_phone: user.user_metadata?.emergency_contact_phone,
        emergency_contact_relationship: user.user_metadata?.emergency_contact_relationship,
        department: user.user_metadata?.department,
        position: user.user_metadata?.position,
        start_date: user.user_metadata?.start_date,
        employee_id: user.user_metadata?.employee_id,
      };

      setProfile(profileInfo);
      setFormData(profileInfo);
    } catch (error: any) {
      toast({
        title: 'Error loading profile',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update profile table
      await supabase
        .from('profiles')
        .update({ display_name: formData.display_name })
        .eq('user_id', user.id);

      // Update user metadata for editable fields
      await supabase.auth.updateUser({
        data: {
          display_name: formData.display_name,
          phone: formData.phone,
          address: formData.address,
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
          emergency_contact_relationship: formData.emergency_contact_relationship,
        }
      });

      setProfile({ ...profile!, ...formData });
      setEditMode(false);
      toast({ title: 'Profile updated successfully' });
    } catch (error: any) {
      toast({
        title: 'Error saving profile',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p>Unable to load profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your personal information
          </p>
        </div>
        {!editMode ? (
          <Button onClick={() => setEditMode(true)}>Edit Profile</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setFormData(profile);
              setEditMode(false);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      {/* Profile Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-xl">
                {profile.display_name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{profile.display_name}</h2>
              <p className="text-muted-foreground">{profile.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {profile.position && <Badge variant="outline">{profile.position}</Badge>}
                {profile.department && <Badge variant="secondary">{profile.department}</Badge>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>Your contact details and personal info</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              {editMode ? (
                <Input
                  value={formData.display_name || ''}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                />
              ) : (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.display_name}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{profile.email}</span>
                <Badge variant="outline" className="ml-auto text-xs">Read-only</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              {editMode ? (
                <Input
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              ) : (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.phone || 'Not provided'}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              {editMode ? (
                <Input
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter address"
                />
              ) : (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.address || 'Not provided'}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Emergency Contact
          </CardTitle>
          <CardDescription>Contact in case of emergency</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Contact Name</Label>
              {editMode ? (
                <Input
                  value={formData.emergency_contact_name || ''}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                  placeholder="Full name"
                />
              ) : (
                <div className="p-2 bg-muted/50 rounded-md">
                  {profile.emergency_contact_name || 'Not provided'}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              {editMode ? (
                <Input
                  value={formData.emergency_contact_phone || ''}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  placeholder="Phone number"
                />
              ) : (
                <div className="p-2 bg-muted/50 rounded-md">
                  {profile.emergency_contact_phone || 'Not provided'}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Relationship</Label>
              {editMode ? (
                <Input
                  value={formData.emergency_contact_relationship || ''}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
                  placeholder="e.g., Spouse, Parent"
                />
              ) : (
                <div className="p-2 bg-muted/50 rounded-md">
                  {profile.emergency_contact_relationship || 'Not provided'}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Employment Information
          </CardTitle>
          <CardDescription>Your role and employment details (read-only)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Employee ID</Label>
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                <span>{profile.employee_id || 'Not assigned'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>{profile.position || 'Not assigned'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span>{profile.department || 'Not assigned'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {profile.start_date 
                    ? format(new Date(profile.start_date), 'dd MMMM yyyy')
                    : 'Not provided'
                  }
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Employment details are managed by HR. Contact your manager to request changes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
