import { User, Mail, Phone, Calendar, Briefcase, Shield, FileText, Clock } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatusBadge } from '@/components/ui/status-badge';
import { Progress } from '@/components/ui/progress';
import { Employee, EmploymentType } from '@/types/hrms';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface EmployeeDetailSheetProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const employmentTypeLabels: Record<EmploymentType, string> = {
  casual: 'Casual',
  part_time: 'Part-Time',
  full_time: 'Full-Time',
  contractor: 'Contractor',
};

const employmentTypeColors: Record<EmploymentType, string> = {
  casual: 'bg-info/10 text-info',
  part_time: 'bg-primary/10 text-primary',
  full_time: 'bg-success/10 text-success',
  contractor: 'bg-warning/10 text-warning',
};

export function EmployeeDetailSheet({ employee, open, onOpenChange }: EmployeeDetailSheetProps) {
  if (!employee) return null;

  // Calculate compliance percentage
  const totalCerts = employee.certifications.length;
  const validCerts = employee.certifications.filter(c => c.status === 'compliant').length;
  const compliancePercentage = totalCerts > 0 ? Math.round((validCerts / totalCerts) * 100) : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-hidden flex flex-col">
        <SheetHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 avatar-ring">
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                {employee.firstName[0]}
                {employee.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <SheetTitle className="text-xl">
                {employee.firstName} {employee.lastName}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-1">
                {employee.position}
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    employmentTypeColors[employee.employmentType]
                  )}
                >
                  {employmentTypeLabels[employee.employmentType]}
                </span>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 py-4">
            {/* Contact Information */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Contact Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${employee.email}`} className="text-primary hover:underline">
                    {employee.email}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${employee.phone}`} className="hover:underline">
                    {employee.phone}
                  </a>
                </div>
              </div>
            </div>

            <Separator />

            {/* Employment Details */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Employment Details
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Department</p>
                  <p className="font-medium">{employee.department}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Start Date</p>
                  <p className="font-medium">{format(new Date(employee.startDate), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pay Rate</p>
                  <p className="font-medium">${employee.payRate.toFixed(2)}/hr</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Award Classification</p>
                  <p className="font-medium">{employee.awardClassification || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={employee.status === 'active' ? 'default' : 'secondary'} className="mt-1">
                    {employee.status}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Compliance Status */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Compliance Status
                </h3>
                <StatusBadge status={employee.complianceStatus} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Overall Compliance</span>
                  <span className="font-medium">{compliancePercentage}%</span>
                </div>
                <Progress value={compliancePercentage} className="h-2" />
              </div>
              {employee.certifications.length > 0 && (
                <div className="space-y-2 mt-3">
                  <p className="text-xs text-muted-foreground font-medium">Certifications</p>
                  <div className="space-y-2">
                    {employee.certifications.map((cert) => (
                      <div key={cert.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50">
                        <span>{cert.name}</span>
                        <StatusBadge status={cert.status} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Documents */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documents ({employee.documents.length})
              </h3>
              {employee.documents.length > 0 ? (
                <div className="space-y-2">
                  {employee.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{doc.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(doc.uploadedAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No documents uploaded</p>
              )}
            </div>

            {/* Emergency Contact */}
            {employee.emergencyContact && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Emergency Contact
                  </h3>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{employee.emergencyContact.name}</p>
                    <p className="text-muted-foreground">{employee.emergencyContact.relationship}</p>
                    <p>{employee.emergencyContact.phone}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button variant="outline" className="flex-1">
            Edit Profile
          </Button>
          <Button variant="outline" className="flex-1">
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
