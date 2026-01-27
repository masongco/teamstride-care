import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  email: string
  password: string
  display_name: string
  role: 'admin' | 'manager' | 'employee'
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with user's JWT to verify they're an admin
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verify the requesting user is an admin
    const { data: { user: requestingUser }, error: userError } = await userClient.auth.getUser()
    
    if (userError || !requestingUser) {
      console.error('User verification failed:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if requesting user has admin role
    const { data: roleData, error: roleError } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .maybeSingle()

    if (roleError) {
      console.error('Role check failed:', roleError)
      return new Response(
        JSON.stringify({ error: 'Failed to verify permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!roleData || roleData.role !== 'admin') {
      console.log('User is not admin:', requestingUser.id, roleData)
      return new Response(
        JSON.stringify({ error: 'Only administrators can create users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse and validate request body
    const body: CreateUserRequest = await req.json()
    
    if (!body.email || !body.password || !body.display_name || !body.role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, display_name, role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate password length
    if (body.password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate role
    const validRoles = ['admin', 'manager', 'employee']
    if (!validRoles.includes(body.role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role. Must be admin, manager, or employee' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Create the new user
    console.log('Creating user:', body.email)
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        display_name: body.display_name,
      }
    })

    if (createError) {
      console.error('User creation failed:', createError)
      
      // Handle specific error cases
      if (createError.message?.includes('already registered')) {
        return new Response(
          JSON.stringify({ error: 'A user with this email already exists' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      return new Response(
        JSON.stringify({ error: createError.message || 'Failed to create user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!newUser.user) {
      return new Response(
        JSON.stringify({ error: 'User creation returned no user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update the user's role (trigger creates 'employee' by default, we may need to change it)
    if (body.role !== 'employee') {
      const { error: updateRoleError } = await adminClient
        .from('user_roles')
        .update({ role: body.role })
        .eq('user_id', newUser.user.id)

      if (updateRoleError) {
        console.error('Role update failed:', updateRoleError)
        // Don't fail the request, user is created, just log the error
      }
    }

    console.log('User created successfully:', newUser.user.id)
    
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          display_name: body.display_name,
          role: body.role,
        }
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
