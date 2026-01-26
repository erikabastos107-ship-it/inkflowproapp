import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
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
          
          <h1 className="text-2xl font-bold text-primary">InkFlow PRO </h1>
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
        </div>
      </div>
    </div>;
}