import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Loader2, Users, Shield, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const signupSchema = z.object({
  displayName: z.string().min(2, { message: 'Display name must be at least 2 characters' }).max(50, { message: 'Display name must be less than 50 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const navigate = useNavigate();
  const { user, loading, signIn, signUp } = useAuth();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange',
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (!loading && user) {
      navigate('/employees');
    }
  }, [user, loading, navigate]);

  const handleLogin = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    const { error } = await signIn(values.email, values.password);
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast({
          title: 'Login failed',
          description: 'Invalid email or password. Please try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Login failed',
          description: error.message,
          variant: 'destructive',
        });
      }
      return;
    }

    toast({
      title: 'Welcome back!',
      description: 'You have successfully logged in.',
    });
    navigate('/employees');
  };

  const handleSignup = async (values: SignupFormValues) => {
    setIsSubmitting(true);
    const { error } = await signUp(values.email, values.password, values.displayName);
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes('User already registered')) {
        toast({
          title: 'Account exists',
          description: 'An account with this email already exists. Please log in instead.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Signup failed',
          description: error.message,
          variant: 'destructive',
        });
      }
      return;
    }

    toast({
      title: 'Account created!',
      description: 'Welcome to SocialPlus HR. You are now logged in.',
    });
    navigate('/employees');
  };

  const handleForgotPassword = async () => {
    const email = loginForm.watch('email');
    
    if (!email || !z.string().email().safeParse(email).success) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address first.',
        variant: 'destructive',
      });
      return;
    }

    setIsResettingPassword(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setIsResettingPassword(false);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Password reset email sent',
      description: 'Check your inbox for a link to reset your password.',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary p-12 flex-col justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-foreground">SocialPlus HR</h1>
          <p className="text-primary-foreground/80 mt-2">Human Resource Management System</p>
        </div>
        
        <div className="space-y-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary-foreground/10 rounded-lg">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-foreground">Employee Management</h3>
              <p className="text-primary-foreground/70 text-sm">Manage your entire workforce from one central location</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary-foreground/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-foreground">Compliance Tracking</h3>
              <p className="text-primary-foreground/70 text-sm">Stay compliant with automated document tracking</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary-foreground/10 rounded-lg">
              <Clock className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-foreground">Time & Attendance</h3>
              <p className="text-primary-foreground/70 text-sm">Track hours, manage leave, and process payroll seamlessly</p>
            </div>
          </div>
        </div>
        
        <p className="text-primary-foreground/60 text-sm">
          © 2024 SocialPlus. All rights reserved.
        </p>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="lg:hidden mb-4">
              <h1 className="text-2xl font-bold text-primary">SocialPlus HR</h1>
            </div>
            <CardTitle className="text-2xl">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? 'Enter your credentials to access your account'
                : 'Enter your details to get started'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLogin ? (
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="name@company.com"
                    value={loginForm.watch('email')}
                    onChange={(e) => loginForm.setValue('email', e.target.value, { shouldValidate: true })}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm font-medium text-destructive">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginForm.watch('password')}
                    onChange={(e) => loginForm.setValue('password', e.target.value, { shouldValidate: true })}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm font-medium text-destructive">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember-me" 
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                    />
                    <Label htmlFor="remember-me" className="text-sm font-normal cursor-pointer">
                      Remember me
                    </Label>
                  </div>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={isResettingPassword}
                    className="text-sm text-primary hover:underline disabled:opacity-50"
                  >
                    {isResettingPassword ? 'Sending...' : 'Forgot password?'}
                  </button>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-displayName">Display Name</Label>
                  <Input
                    id="signup-displayName"
                    placeholder="John Doe"
                    value={signupForm.watch('displayName')}
                    onChange={(e) => signupForm.setValue('displayName', e.target.value, { shouldValidate: true })}
                  />
                  {signupForm.formState.errors.displayName && (
                    <p className="text-sm font-medium text-destructive">{signupForm.formState.errors.displayName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="name@company.com"
                    value={signupForm.watch('email')}
                    onChange={(e) => signupForm.setValue('email', e.target.value, { shouldValidate: true })}
                  />
                  {signupForm.formState.errors.email && (
                    <p className="text-sm font-medium text-destructive">{signupForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={signupForm.watch('password')}
                    onChange={(e) => signupForm.setValue('password', e.target.value, { shouldValidate: true })}
                  />
                  {signupForm.formState.errors.password && (
                    <p className="text-sm font-medium text-destructive">{signupForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirmPassword">Confirm Password</Label>
                  <Input
                    id="signup-confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={signupForm.watch('confirmPassword')}
                    onChange={(e) => signupForm.setValue('confirmPassword', e.target.value, { shouldValidate: true })}
                  />
                  {signupForm.formState.errors.confirmPassword && (
                    <p className="text-sm font-medium text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create account'
                    )}
                  </Button>
                </form>
            )}

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-primary hover:underline"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
