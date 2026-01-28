import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Required certifications for NDIS compliance
const REQUIRED_CERTIFICATIONS = [
  'police_check',
  'ndis_screening',
  'first_aid',
  'cpr',
  'wwcc',
];

// Optional certifications based on context
const CONTEXT_CERTIFICATIONS = {
  driving: ['drivers_license'],
};

interface CertificationStatus {
  type: string;
  status: 'missing' | 'expired' | 'expiring_soon' | 'valid' | 'rejected' | 'pending';
  expiryDate?: string;
  daysUntilExpiry?: number;
}

interface ComplianceResult {
  employeeId: string;
  compliant: boolean;
  blockingReasons: CertificationStatus[];
  expiringSoon: CertificationStatus[];
  overrideActive: boolean;
  overrideDetails?: {
    id: string;
    reason: string;
    expiresAt: string;
    overrideBy: string;
  };
  evaluatedAt: string;
}

interface EvaluationContext {
  contextType: 'shift' | 'client' | 'service' | 'general';
  contextId?: string;
  requiresDriving?: boolean;
  additionalRequirements?: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify authentication by getting user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { employeeId, context } = await req.json() as { 
      employeeId: string; 
      context?: EvaluationContext;
    };

    if (!employeeId) {
      return new Response(
        JSON.stringify({ error: 'employeeId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const evaluationContext: EvaluationContext = context || { contextType: 'general' };

    // First, expire any outdated overrides
    await supabase.rpc('expire_compliance_overrides');

    // Fetch employee certifications
    const { data: certifications, error: certError } = await supabase
      .from('employee_certifications')
      .select('*')
      .eq('employee_id', employeeId);

    if (certError) {
      console.error('Error fetching certifications:', certError);
      // Fail closed - if we can't get compliance data, block assignment
      return new Response(
        JSON.stringify({ 
          error: 'Failed to retrieve compliance data. Assignment blocked for safety.',
          failedClosed: true 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build required certifications list based on context
    let requiredCerts: string[] = [...REQUIRED_CERTIFICATIONS];
    if (evaluationContext.requiresDriving) {
      requiredCerts = [...requiredCerts, ...CONTEXT_CERTIFICATIONS.driving];
    }
    if (evaluationContext.additionalRequirements) {
      requiredCerts = [...requiredCerts, ...evaluationContext.additionalRequirements];
    }

    const certMap = new Map(
      (certifications || []).map(cert => [cert.type.toLowerCase(), cert])
    );

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const blockingReasons: CertificationStatus[] = [];
    const expiringSoon: CertificationStatus[] = [];

    for (const requiredType of requiredCerts) {
      const cert = certMap.get(requiredType.toLowerCase());

      if (!cert) {
        // Missing certification
        blockingReasons.push({
          type: requiredType,
          status: 'missing',
        });
        continue;
      }

      // Check status
      if (cert.status === 'rejected') {
        blockingReasons.push({
          type: requiredType,
          status: 'rejected',
        });
        continue;
      }

      if (cert.status === 'pending') {
        blockingReasons.push({
          type: requiredType,
          status: 'pending',
        });
        continue;
      }

      // Check expiry
      if (cert.expiry_date) {
        const expiryDate = new Date(cert.expiry_date);
        
        if (expiryDate < now) {
          blockingReasons.push({
            type: requiredType,
            status: 'expired',
            expiryDate: cert.expiry_date,
          });
        } else if (expiryDate < thirtyDaysFromNow) {
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
          expiringSoon.push({
            type: requiredType,
            status: 'expiring_soon',
            expiryDate: cert.expiry_date,
            daysUntilExpiry,
          });
        }
      }
    }

    // Check for active override
    let overrideActive = false;
    let overrideDetails: ComplianceResult['overrideDetails'] = undefined;

    if (blockingReasons.length > 0) {
      const { data: overrides } = await supabase
        .from('compliance_overrides')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('is_active', true)
        .gt('expires_at', now.toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (overrides && overrides.length > 0) {
        const override = overrides[0];
        // Check if override applies to this context
        if (
          override.context_type === evaluationContext.contextType ||
          override.context_type === 'general' ||
          evaluationContext.contextType === 'general'
        ) {
          overrideActive = true;
          overrideDetails = {
            id: override.id,
            reason: override.reason,
            expiresAt: override.expires_at,
            overrideBy: override.override_by_name,
          };
        }
      }
    }

    const result: ComplianceResult = {
      employeeId,
      compliant: blockingReasons.length === 0,
      blockingReasons,
      expiringSoon,
      overrideActive,
      overrideDetails,
      evaluatedAt: now.toISOString(),
    };

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Compliance evaluation error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error during compliance evaluation',
        failedClosed: true 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
