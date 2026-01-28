import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.93.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuditPackData {
  id: string;
  organisation_id: string;
  pack_type: string;
  employee_id: string | null;
  date_range_start: string | null;
  date_range_end: string | null;
  include_restricted_content: boolean;
  include_attachments: boolean;
  generated_by: string;
}

// deno-lint-ignore no-explicit-any
type SupabaseClientAny = SupabaseClient<any, any, any>;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { packId } = await req.json();

    if (!packId) {
      return new Response(JSON.stringify({ error: 'Pack ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get pack details
    const { data: pack, error: packError } = await supabase
      .from('audit_packs')
      .select('*')
      .eq('id', packId)
      .single();

    if (packError || !pack) {
      return new Response(JSON.stringify({ error: 'Pack not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update status to generating
    await supabase
      .from('audit_packs')
      .update({ 
        status: 'generating', 
        started_at: new Date().toISOString() 
      })
      .eq('id', packId);

    // Generate pack data based on type
    const packData = pack as AuditPackData;
    const startDate = packData.date_range_start || '1900-01-01';
    const endDate = packData.date_range_end || '2100-12-31';

    let summary: Record<string, unknown> = {};
    const csvFiles: { name: string; content: string }[] = [];

    try {
      switch (packData.pack_type) {
        case 'employee_compliance':
          summary = await generateEmployeeCompliancePack(
            supabase as SupabaseClientAny,
            packData,
            csvFiles
          );
          break;

        case 'organisation_compliance':
          summary = await generateOrgCompliancePack(
            supabase as SupabaseClientAny,
            packData,
            startDate,
            endDate,
            csvFiles
          );
          break;

        case 'hr_incidents':
          summary = await generateHRIncidentsPack(
            supabase as SupabaseClientAny,
            packData,
            startDate,
            endDate,
            csvFiles
          );
          break;

        case 'payroll_verification':
          summary = await generatePayrollPack(
            supabase as SupabaseClientAny,
            packData,
            startDate,
            endDate,
            csvFiles
          );
          break;
      }

      // Upload CSV files to storage
      const fileUrls: string[] = [];
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

      for (const file of csvFiles) {
        const filePath = `${packData.organisation_id}/${packId}/${timestamp}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('audit-packs')
          .upload(filePath, file.content, {
            contentType: 'text/csv',
            upsert: true,
          });

        if (!uploadError) {
          fileUrls.push(filePath);
        }
      }

      // Update pack with success
      await supabase
        .from('audit_packs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          file_urls: fileUrls,
          summary,
        })
        .eq('id', packId);

      // Log the export completion
      await supabase.from('audit_logs').insert({
        action: 'document.upload',
        entity_type: 'document',
        entity_id: packId,
        organisation_id: packData.organisation_id,
        user_id: user.id,
        user_email: user.email,
        new_values: {
          action: 'audit_pack_generated',
          pack_type: packData.pack_type,
          files_generated: fileUrls.length,
          summary,
        },
      });

    } catch (genError) {
      console.error('Generation error:', genError);
      await supabase
        .from('audit_packs')
        .update({
          status: 'failed',
          error_message: genError instanceof Error ? genError.message : 'Unknown error',
        })
        .eq('id', packId);
    }

    return new Response(
      JSON.stringify({ success: true, packId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper to convert array to CSV
// deno-lint-ignore no-explicit-any
function arrayToCSV(data: Record<string, any>[], columns?: string[]): string {
  if (data.length === 0) return '';
  
  const headers = columns || Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      const str = String(val);
      // Escape quotes and wrap in quotes if contains comma/quote/newline
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}

async function generateEmployeeCompliancePack(
  supabase: SupabaseClientAny,
  pack: AuditPackData,
  csvFiles: { name: string; content: string }[]
): Promise<Record<string, unknown>> {
  if (!pack.employee_id) {
    throw new Error('Employee ID required for employee compliance pack');
  }

  // Get employee details
  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('id', pack.employee_id)
    .single();

  if (!employee) throw new Error('Employee not found');

  // Employee profile CSV
  csvFiles.push({
    name: 'employee_profile.csv',
    content: arrayToCSV([{
      id: employee.id,
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      position: employee.position,
      department: employee.department,
      employment_type: employee.employment_type,
      status: employee.status,
      compliance_status: employee.compliance_status,
      start_date: employee.start_date,
      end_date: employee.end_date,
    }]),
  });

  // Certifications
  const { data: certifications } = await supabase
    .from('employee_certifications')
    .select('*')
    .eq('employee_id', pack.employee_id)
    .order('created_at', { ascending: false });

  if (certifications && certifications.length > 0) {
    csvFiles.push({
      name: 'certifications.csv',
      // deno-lint-ignore no-explicit-any
      content: arrayToCSV(certifications.map((c: any) => ({
        name: c.name,
        type: c.type,
        status: c.status,
        issue_date: c.issue_date,
        expiry_date: c.expiry_date,
        created_at: c.created_at,
      }))),
    });
  }

  // Compliance overrides
  const { data: overrides } = await supabase
    .from('compliance_overrides')
    .select('*')
    .eq('employee_id', pack.employee_id)
    .order('created_at', { ascending: false });

  if (overrides && overrides.length > 0) {
    csvFiles.push({
      name: 'compliance_overrides.csv',
      // deno-lint-ignore no-explicit-any
      content: arrayToCSV(overrides.map((o: any) => ({
        reason: o.reason,
        context_type: o.context_type,
        override_by_name: o.override_by_name,
        override_by_email: o.override_by_email,
        expires_at: o.expires_at,
        is_active: o.is_active,
        created_at: o.created_at,
      }))),
    });
  }

  // Audit logs
  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('entity_id', pack.employee_id)
    .order('created_at', { ascending: false })
    .limit(500);

  if (auditLogs && auditLogs.length > 0) {
    csvFiles.push({
      name: 'audit_trail.csv',
      // deno-lint-ignore no-explicit-any
      content: arrayToCSV(auditLogs.map((l: any) => ({
        action: l.action,
        entity_type: l.entity_type,
        user_name: l.user_name,
        user_email: l.user_email,
        created_at: l.created_at,
        old_values: JSON.stringify(l.old_values),
        new_values: JSON.stringify(l.new_values),
      }))),
    });
  }

  return {
    employee_name: `${employee.first_name} ${employee.last_name}`,
    certifications: certifications?.length || 0,
    overrides: overrides?.length || 0,
    audit_entries: auditLogs?.length || 0,
  };
}

async function generateOrgCompliancePack(
  supabase: SupabaseClientAny,
  pack: AuditPackData,
  startDate: string,
  endDate: string,
  csvFiles: { name: string; content: string }[]
): Promise<Record<string, unknown>> {
  // Get all employees
  const { data: employees } = await supabase
    .from('employees')
    .select('*')
    .eq('organisation_id', pack.organisation_id)
    .order('last_name');

  if (employees && employees.length > 0) {
    csvFiles.push({
      name: 'employees.csv',
      // deno-lint-ignore no-explicit-any
      content: arrayToCSV(employees.map((e: any) => ({
        id: e.id,
        name: `${e.first_name} ${e.last_name}`,
        email: e.email,
        position: e.position,
        department: e.department,
        status: e.status,
        compliance_status: e.compliance_status,
        employment_type: e.employment_type,
        start_date: e.start_date,
      }))),
    });
  }

  // Get all certifications
  const { data: certifications } = await supabase
    .from('employee_certifications')
    .select('*, employees(first_name, last_name)')
    .eq('organisation_id', pack.organisation_id)
    .order('expiry_date');

  if (certifications && certifications.length > 0) {
    csvFiles.push({
      name: 'certifications.csv',
      // deno-lint-ignore no-explicit-any
      content: arrayToCSV(certifications.map((c: any) => {
        const emp = c.employees as { first_name: string; last_name: string } | null;
        return {
          employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown',
          name: c.name,
          type: c.type,
          status: c.status,
          issue_date: c.issue_date,
          expiry_date: c.expiry_date,
        };
      })),
    });
  }

  // Expired certifications
  // deno-lint-ignore no-explicit-any
  const expired = certifications?.filter((c: any) => 
    c.expiry_date && new Date(c.expiry_date) < new Date()
  ) || [];

  // Expiring soon (next 30 days)
  // deno-lint-ignore no-explicit-any
  const expiringSoon = certifications?.filter((c: any) => {
    if (!c.expiry_date) return false;
    const expiry = new Date(c.expiry_date);
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expiry >= now && expiry <= thirtyDays;
  }) || [];

  // Get all overrides in date range
  const { data: overrides } = await supabase
    .from('compliance_overrides')
    .select('*, employees(first_name, last_name)')
    .eq('organisation_id', pack.organisation_id)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });

  if (overrides && overrides.length > 0) {
    csvFiles.push({
      name: 'compliance_overrides.csv',
      // deno-lint-ignore no-explicit-any
      content: arrayToCSV(overrides.map((o: any) => {
        const emp = o.employees as { first_name: string; last_name: string } | null;
        return {
          employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown',
          reason: o.reason,
          context_type: o.context_type,
          override_by_name: o.override_by_name,
          expires_at: o.expires_at,
          is_active: o.is_active,
          created_at: o.created_at,
        };
      })),
    });
  }

  // Audit summary
  const { count: auditCount } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('organisation_id', pack.organisation_id)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  return {
    total_employees: employees?.length || 0,
    total_certifications: certifications?.length || 0,
    expired_certifications: expired.length,
    expiring_soon: expiringSoon.length,
    overrides_in_period: overrides?.length || 0,
    audit_entries: auditCount || 0,
  };
}

async function generateHRIncidentsPack(
  supabase: SupabaseClientAny,
  pack: AuditPackData,
  startDate: string,
  endDate: string,
  csvFiles: { name: string; content: string }[]
): Promise<Record<string, unknown>> {
  // Build query
  let casesQuery = supabase
    .from('hr_cases')
    .select('*, employees(first_name, last_name)')
    .eq('organisation_id', pack.organisation_id)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });

  if (pack.employee_id) {
    casesQuery = casesQuery.eq('employee_id', pack.employee_id);
  }

  const { data: cases } = await casesQuery;

  if (cases && cases.length > 0) {
    // Case register
    csvFiles.push({
      name: 'hr_cases.csv',
      // deno-lint-ignore no-explicit-any
      content: arrayToCSV(cases.map((c: any) => {
        const emp = c.employees as { first_name: string; last_name: string } | null;
        return {
          case_number: c.case_number,
          employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Not specified',
          case_type: c.case_type,
          severity: c.severity,
          status: c.status,
          summary: c.summary,
          date_reported: c.date_reported,
          safeguarding_flag: c.safeguarding_flag,
          confidentiality_level: c.confidentiality_level,
          created_at: c.created_at,
          closed_at: c.closed_at,
        };
      })),
    });

    // Get findings for all cases
    // deno-lint-ignore no-explicit-any
    const caseIds = cases.map((c: any) => c.id);
    const { data: findings } = await supabase
      .from('hr_case_findings')
      .select('*')
      .in('hr_case_id', caseIds);

    if (findings && findings.length > 0) {
      csvFiles.push({
        name: 'case_findings.csv',
        // deno-lint-ignore no-explicit-any
        content: arrayToCSV(findings.map((f: any) => ({
          case_id: f.hr_case_id,
          substantiated: f.substantiated,
          findings_summary: f.findings_summary,
          contributing_factors: f.contributing_factors,
          decision_maker_name: f.decision_maker_name,
          decision_date: f.decision_date,
        }))),
      });
    }

    // Get actions for all cases
    const { data: actions } = await supabase
      .from('hr_case_actions')
      .select('*')
      .in('hr_case_id', caseIds);

    if (actions && actions.length > 0) {
      csvFiles.push({
        name: 'case_actions.csv',
        // deno-lint-ignore no-explicit-any
        content: arrayToCSV(actions.map((a: any) => ({
          case_id: a.hr_case_id,
          action_type: a.action_type,
          description: a.description,
          status: a.status,
          effective_date: a.effective_date,
          expiry_date: a.expiry_date,
          assigned_to_name: a.assigned_to_name,
          created_by_name: a.created_by_name,
        }))),
      });
    }

    // Evidence metadata (no files unless include_attachments)
    const { data: evidence } = await supabase
      .from('hr_case_evidence')
      .select('*')
      .in('hr_case_id', caseIds);

    if (evidence && evidence.length > 0) {
      csvFiles.push({
        name: 'evidence_metadata.csv',
        content: arrayToCSV(evidence
          // deno-lint-ignore no-explicit-any
          .filter((e: any) => pack.include_restricted_content || e.access_level === 'normal')
          // deno-lint-ignore no-explicit-any
          .map((e: any) => ({
            case_id: e.hr_case_id,
            file_name: e.file_name,
            description: e.description,
            access_level: e.access_level,
            uploaded_by_name: e.uploaded_by_name,
            uploaded_at: e.uploaded_at,
          }))),
      });
    }
  }

  return {
    total_cases: cases?.length || 0,
    // deno-lint-ignore no-explicit-any
    open_cases: cases?.filter((c: any) => c.status !== 'closed').length || 0,
    // deno-lint-ignore no-explicit-any
    closed_cases: cases?.filter((c: any) => c.status === 'closed').length || 0,
    // deno-lint-ignore no-explicit-any
    safeguarding_cases: cases?.filter((c: any) => c.safeguarding_flag).length || 0,
  };
}

async function generatePayrollPack(
  supabase: SupabaseClientAny,
  pack: AuditPackData,
  startDate: string,
  endDate: string,
  csvFiles: { name: string; content: string }[]
): Promise<Record<string, unknown>> {
  // =====================================================
  // Pay Periods in date range
  // =====================================================
  let payPeriodsQuery = supabase
    .from('pay_periods')
    .select('*')
    .eq('organisation_id', pack.organisation_id)
    .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)
    .order('start_date', { ascending: false });

  const { data: payPeriods } = await payPeriodsQuery;

  if (payPeriods && payPeriods.length > 0) {
    csvFiles.push({
      name: 'pay_periods.csv',
      // deno-lint-ignore no-explicit-any
      content: arrayToCSV(payPeriods.map((p: any) => ({
        id: p.id,
        start_date: p.start_date,
        end_date: p.end_date,
        status: p.status,
        created_by_name: p.created_by_name,
        created_by_email: p.created_by_email,
        closed_at: p.closed_at,
        created_at: p.created_at,
      }))),
    });
  }

  // =====================================================
  // Payroll Exports in date range
  // =====================================================
  const { data: payrollExports } = await supabase
    .from('payroll_exports')
    .select('*, pay_periods(start_date, end_date)')
    .eq('organisation_id', pack.organisation_id)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });

  if (payrollExports && payrollExports.length > 0) {
    csvFiles.push({
      name: 'payroll_exports.csv',
      // deno-lint-ignore no-explicit-any
      content: arrayToCSV(payrollExports.map((e: any) => {
        const pp = e.pay_periods as { start_date: string; end_date: string } | null;
        const summary = e.totals_summary || {};
        return {
          id: e.id,
          pay_period: pp ? `${pp.start_date} to ${pp.end_date}` : 'Unknown',
          provider: e.provider,
          status: e.status,
          total_hours: summary.totalHours || 0,
          employees_count: summary.employeesCount || 0,
          lines_count: summary.linesCount || 0,
          created_by_name: e.created_by_name,
          created_by_email: e.created_by_email,
          created_at: e.created_at,
          voided_at: e.voided_at,
          voided_by_name: e.voided_by_name,
          voided_reason: e.voided_reason,
        };
      })),
    });
  }

  // =====================================================
  // Timesheet Unlock Logs
  // =====================================================
  const { data: unlockLogs } = await supabase
    .from('timesheet_unlock_log')
    .select('*, timesheets(date, employees(first_name, last_name))')
    .eq('organisation_id', pack.organisation_id)
    .gte('unlocked_at', startDate)
    .lte('unlocked_at', endDate)
    .order('unlocked_at', { ascending: false });

  if (unlockLogs && unlockLogs.length > 0) {
    csvFiles.push({
      name: 'timesheet_unlock_log.csv',
      // deno-lint-ignore no-explicit-any
      content: arrayToCSV(unlockLogs.map((u: any) => {
        const ts = u.timesheets as { date: string; employees: { first_name: string; last_name: string } | null } | null;
        return {
          timesheet_date: ts?.date || 'Unknown',
          employee_name: ts?.employees ? `${ts.employees.first_name} ${ts.employees.last_name}` : 'Unknown',
          reason: u.reason,
          unlocked_by_name: u.unlocked_by_name,
          unlocked_by_email: u.unlocked_by_email,
          unlocked_at: u.unlocked_at,
        };
      })),
    });
  }

  // =====================================================
  // Timesheets in date range
  // =====================================================
  let timesheetsQuery = supabase
    .from('timesheets')
    .select('*, employees(first_name, last_name)')
    .eq('organisation_id', pack.organisation_id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (pack.employee_id) {
    timesheetsQuery = timesheetsQuery.eq('employee_id', pack.employee_id);
  }

  const { data: timesheets } = await timesheetsQuery;

  if (timesheets && timesheets.length > 0) {
    csvFiles.push({
      name: 'timesheets.csv',
      // deno-lint-ignore no-explicit-any
      content: arrayToCSV(timesheets.map((t: any) => {
        const emp = t.employees as { first_name: string; last_name: string } | null;
        return {
          employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown',
          date: t.date,
          clock_in: t.clock_in,
          clock_out: t.clock_out,
          break_minutes: t.break_minutes,
          total_hours: t.total_hours,
          status: t.status,
          is_locked: t.is_locked,
          exported_at: t.exported_at,
          approved_at: t.approved_at,
          notes: t.notes,
        };
      })),
    });
  }

  // =====================================================
  // Leave Requests
  // =====================================================
  let leaveQuery = supabase
    .from('leave_requests')
    .select('*, employees(first_name, last_name), leave_types(name)')
    .eq('organisation_id', pack.organisation_id)
    .gte('start_date', startDate)
    .lte('end_date', endDate)
    .order('start_date', { ascending: false });

  if (pack.employee_id) {
    leaveQuery = leaveQuery.eq('employee_id', pack.employee_id);
  }

  const { data: leaveRequests } = await leaveQuery;

  if (leaveRequests && leaveRequests.length > 0) {
    csvFiles.push({
      name: 'leave_requests.csv',
      // deno-lint-ignore no-explicit-any
      content: arrayToCSV(leaveRequests.map((l: any) => {
        const emp = l.employees as { first_name: string; last_name: string } | null;
        const lt = l.leave_types as { name: string } | null;
        return {
          employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown',
          leave_type: lt?.name || l.type || 'Unknown',
          start_date: l.start_date,
          end_date: l.end_date,
          hours: l.hours,
          status: l.status,
          reason: l.reason,
          approved_by: l.approved_by,
          approved_at: l.approved_at,
          override_reason: l.override_reason,
          created_at: l.created_at,
        };
      })),
    });
  }

  // =====================================================
  // Leave Balances (current snapshot)
  // =====================================================
  let balancesQuery = supabase
    .from('leave_balances')
    .select('*, employees(first_name, last_name), leave_types(name)')
    .eq('organisation_id', pack.organisation_id);

  if (pack.employee_id) {
    balancesQuery = balancesQuery.eq('employee_id', pack.employee_id);
  }

  const { data: leaveBalances } = await balancesQuery;

  if (leaveBalances && leaveBalances.length > 0) {
    csvFiles.push({
      name: 'leave_balances_snapshot.csv',
      // deno-lint-ignore no-explicit-any
      content: arrayToCSV(leaveBalances.map((b: any) => {
        const emp = b.employees as { first_name: string; last_name: string } | null;
        const lt = b.leave_types as { name: string } | null;
        return {
          employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown',
          leave_type: lt?.name || 'Unknown',
          balance_hours: b.balance_hours,
          last_accrual_at: b.last_accrual_at,
          updated_at: b.updated_at,
        };
      })),
    });
  }

  // =====================================================
  // Leave Adjustments in period
  // =====================================================
  let adjustmentsQuery = supabase
    .from('leave_adjustments')
    .select('*, employees(first_name, last_name), leave_types(name)')
    .eq('organisation_id', pack.organisation_id)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });

  if (pack.employee_id) {
    adjustmentsQuery = adjustmentsQuery.eq('employee_id', pack.employee_id);
  }

  const { data: adjustments } = await adjustmentsQuery;

  if (adjustments && adjustments.length > 0) {
    csvFiles.push({
      name: 'leave_adjustments.csv',
      // deno-lint-ignore no-explicit-any
      content: arrayToCSV(adjustments.map((a: any) => {
        const emp = a.employees as { first_name: string; last_name: string } | null;
        const lt = a.leave_types as { name: string } | null;
        return {
          employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown',
          leave_type: lt?.name || 'Unknown',
          adjustment_hours: a.adjustment_hours,
          reason: a.reason,
          adjusted_by_name: a.adjusted_by_name,
          adjusted_by_email: a.adjusted_by_email,
          created_at: a.created_at,
        };
      })),
    });
  }

  // =====================================================
  // Payroll & Timesheet Audit Trail (expanded entity types)
  // =====================================================
  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('organisation_id', pack.organisation_id)
    .in('entity_type', ['timesheet', 'leave_request', 'payroll_export', 'pay_period'])
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });

  if (auditLogs && auditLogs.length > 0) {
    csvFiles.push({
      name: 'payroll_audit_trail.csv',
      // deno-lint-ignore no-explicit-any
      content: arrayToCSV(auditLogs.map((l: any) => ({
        action: l.action,
        entity_type: l.entity_type,
        entity_id: l.entity_id,
        user_name: l.user_name,
        user_email: l.user_email,
        created_at: l.created_at,
        old_values: JSON.stringify(l.old_values),
        new_values: JSON.stringify(l.new_values),
      }))),
    });
  }

  // =====================================================
  // Calculate Summary
  // =====================================================
  // deno-lint-ignore no-explicit-any
  const tsApproved = timesheets?.filter((t: any) => t.status === 'approved').length || 0;
  // deno-lint-ignore no-explicit-any
  const tsExported = timesheets?.filter((t: any) => t.is_locked && t.exported_at).length || 0;
  // deno-lint-ignore no-explicit-any
  const tsPending = timesheets?.filter((t: any) => t.status === 'pending').length || 0;
  // deno-lint-ignore no-explicit-any
  const leaveApproved = leaveRequests?.filter((l: any) => l.status === 'approved').length || 0;
  // deno-lint-ignore no-explicit-any
  const leavePending = leaveRequests?.filter((l: any) => l.status === 'pending').length || 0;
  // deno-lint-ignore no-explicit-any
  const exportsVoided = payrollExports?.filter((e: any) => e.status === 'voided').length || 0;

  return {
    pay_periods: payPeriods?.length || 0,
    payroll_exports: payrollExports?.length || 0,
    exports_voided: exportsVoided,
    timesheet_unlocks: unlockLogs?.length || 0,
    total_timesheets: timesheets?.length || 0,
    timesheets_approved: tsApproved,
    timesheets_exported: tsExported,
    timesheets_pending: tsPending,
    // deno-lint-ignore no-explicit-any
    total_timesheet_hours: timesheets?.reduce((sum: number, t: any) => sum + (t.total_hours || 0), 0).toFixed(2),
    total_leave_requests: leaveRequests?.length || 0,
    leave_approved: leaveApproved,
    leave_pending: leavePending,
    // deno-lint-ignore no-explicit-any
    total_leave_hours: leaveRequests?.reduce((sum: number, l: any) => sum + (l.hours || 0), 0).toFixed(2),
    leave_adjustments: adjustments?.length || 0,
    audit_entries: auditLogs?.length || 0,
  };
}
