import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LoadingScreen } from '@/components/ui/loading';
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres')
});
const signupSchema = loginSchema.extend({
  name: z.string().min(2, 'Nome muito curto'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword']
});
type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;
export default function AuthPage() {
  const navigate = useNavigate();
  const {
    user,
    profile,
    loading: authLoading,
    signIn,
    signUp
  } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });
  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema)
  });

  useEffect(() => {
    if (user) {
      if (profile && !profile.onboarding_done) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/app/dashboard', { replace: true });
      }
    }
  }, [user, profile, navigate]);

  if (authLoading || user) {
    return <LoadingScreen />;
  }
  const handleLogin = async (data: LoginForm) => {
    setLoading(true);
    const {
      error
    } = await signIn(data.email, data.password);
    setLoading(false);
    if (error) {
      toast.error('Credenciais inválidas. Verifique email e senha.');
    } else {
      toast.success('Bem-vindo de volta!');
      navigate('/app/dashboard');
    }
  };
  const handleSignup = async (data: SignupForm) => {
    setLoading(true);
    const {
      error
    } = await signUp(data.email, data.password, data.name);
    setLoading(false);
    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('Este email já está cadastrado.');
      } else {
        toast.error('Erro ao criar conta: ' + error.message);
      }
    } else {
      toast.success('Conta criada! Configure seu perfil.');
      navigate('/onboarding');
    }
  };
  return <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          
          <h1 className="text-2xl font-bold text-success-foreground">InkFlow</h1>
          <p className="text-muted-foreground mt-2">
            {isLogin ? 'Acesse sua conta' : 'Crie sua conta'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass-card p-6 sm:p-8">
          {/* Tab switcher */}
          <div className="flex bg-muted/50 rounded-xl p-1 mb-6">
            <button type="button" onClick={() => setIsLogin(true)} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${isLogin ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
              Entrar
            </button>
            <button type="button" onClick={() => setIsLogin(false)} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!isLogin ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
              Cadastrar
            </button>
          </div>

          {isLogin ? <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="seu@email.com" className="pl-10 input-glass" {...loginForm.register('email')} />
                </div>
                {loginForm.formState.errors.email && <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-10 pr-10 input-glass" {...loginForm.register('password')} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {loginForm.formState.errors.password && <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>}
              </div>

              <div className="flex justify-end">
                <Link to="/recuperar-senha" className="text-sm text-primary hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form> : <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="name" placeholder="Seu nome" className="pl-10 input-glass" {...signupForm.register('name')} />
                </div>
                {signupForm.formState.errors.name && <p className="text-xs text-destructive">{signupForm.formState.errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="signup-email" type="email" placeholder="seu@email.com" className="pl-10 input-glass" {...signupForm.register('email')} />
                </div>
                {signupForm.formState.errors.email && <p className="text-xs text-destructive">{signupForm.formState.errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="signup-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-10 pr-10 input-glass" {...signupForm.register('password')} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {signupForm.formState.errors.password && <p className="text-xs text-destructive">{signupForm.formState.errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-10 input-glass" {...signupForm.register('confirmPassword')} />
                </div>
                {signupForm.formState.errors.confirmPassword && <p className="text-xs text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Criando conta...' : 'Criar conta'}
              </Button>
            </form>}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou continue com</span>
            </div>
          </div>

          {/* Google Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              const { error } = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
              });
              if (error) {
                toast.error('Erro ao entrar com Google: ' + error.message);
                setLoading(false);
              }
            }}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </Button>
        </div>
      </div>
    </div>;
}