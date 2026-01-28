import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, User, Clock, FileText, AlertTriangle } from 'lucide-react';
import type { HRCase } from '@/types/hrCases';
import {
  CASE_TYPE_LABELS,
  REPORTER_TYPE_LABELS,
} from '@/types/hrCases';

interface CaseOverviewTabProps {
  hrCase: HRCase;
}

export function CaseOverviewTab({ hrCase }: CaseOverviewTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Case Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Case Type</p>
              <p className="font-medium">{CASE_TYPE_LABELS[hrCase.case_type]}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date Reported</p>
              <p className="font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(hrCase.date_reported), 'dd MMM yyyy')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reported By</p>
              <p className="font-medium">{REPORTER_TYPE_LABELS[hrCase.reported_by]}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {format(new Date(hrCase.created_at), 'dd MMM yyyy HH:mm')}
              </p>
            </div>
          </div>

          {(hrCase.reporter_name || hrCase.reporter_contact) && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                {hrCase.reporter_name && (
                  <div>
                    <p className="text-sm text-muted-foreground">Reporter Name</p>
                    <p className="font-medium">{hrCase.reporter_name}</p>
                  </div>
                )}
                {hrCase.reporter_contact && (
                  <div>
                    <p className="text-sm text-muted-foreground">Reporter Contact</p>
                    <p className="font-medium">{hrCase.reporter_contact}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {hrCase.employee && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Employee Involved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">
                  {hrCase.employee.first_name} {hrCase.employee.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{hrCase.employee.email}</p>
              </div>
              {hrCase.employee.position && (
                <div>
                  <p className="text-sm text-muted-foreground">Position</p>
                  <p className="font-medium">{hrCase.employee.position}</p>
                </div>
              )}
              {hrCase.employee.department && (
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{hrCase.employee.department}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{hrCase.summary}</p>
        </CardContent>
      </Card>

      {hrCase.detailed_description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detailed Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{hrCase.detailed_description}</p>
          </CardContent>
        </Card>
      )}

      {hrCase.status === 'closed' && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-base text-green-800">Case Closed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {hrCase.closed_at && (
              <p className="text-sm text-green-700">
                Closed on {format(new Date(hrCase.closed_at), 'dd MMM yyyy HH:mm')}
              </p>
            )}
            {hrCase.closure_notes && (
              <p className="text-sm text-green-800">{hrCase.closure_notes}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
