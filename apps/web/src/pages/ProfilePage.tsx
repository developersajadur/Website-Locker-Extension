import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User, Mail, Lock, Shield, Trash2, AlertTriangle, CheckCircle, Eye, EyeOff,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/services/auth.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Toast, useToast } from '@/components/ui/Toast';
import { getErrorMessage } from '@/lib/utils';

const profileSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(1, 'New password is required'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const { toasts, show, remove } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  const {
    register: regProfile,
    handleSubmit: handleProfile,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { email: user?.email ?? '' },
  });

  const {
    register: regPwd,
    handleSubmit: handlePwd,
    reset: resetPwd,
    formState: { errors: pwdErrors, isSubmitting: pwdSubmitting },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const onProfileSubmit = async (data: ProfileForm) => {
    try {
      const res = await authApi.updateProfile({ email: data.email });
      if (res.data.data?.user) updateUser(res.data.data.user);
      show('Profile updated successfully!', 'success');
    } catch (err) {
      show(getErrorMessage(err), 'error');
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    try {
      await authApi.updateProfile({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      resetPwd();
      show('Password changed successfully!', 'success');
    } catch (err) {
      show(getErrorMessage(err), 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) { setShowDeleteConfirm(true); return; }
    setIsDeleting(true);
    try {
      await authApi.deleteAccount();
      await logout();
      navigate('/login');
    } catch (err) {
      show(getErrorMessage(err), 'error');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account information</p>
      </div>

      {/* Avatar card */}
      <Card glass>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-2 ring-primary/30 glow-primary text-2xl font-bold text-primary">
              {user?.email[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-foreground text-lg">{user?.email}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-primary/60" />
                Member since {user ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '—'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit email */}
      <Card glass>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Account Information
          </CardTitle>
          <CardDescription>Update your email address</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfile(onProfileSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              icon={<Mail className="h-4 w-4" />}
              error={profileErrors.email?.message}
              {...regProfile('email')}
            />
            <Button type="submit" isLoading={profileSubmitting}>
              <CheckCircle className="h-4 w-4" />
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card glass>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Change Password
          </CardTitle>
          <CardDescription>Choose a new password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePwd(onPasswordSubmit)} className="space-y-4">
            <div className="relative">
              <Input
                label="Current Password"
                type={showCurrentPwd ? 'text' : 'password'}
                icon={<Lock className="h-4 w-4" />}
                error={pwdErrors.currentPassword?.message}
                {...regPwd('currentPassword')}
              />
              <button type="button" onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                className="absolute right-3 top-8 text-muted-foreground hover:text-foreground transition-colors">
                {showCurrentPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="New Password"
                type={showNewPwd ? 'text' : 'password'}
                icon={<Lock className="h-4 w-4" />}
                error={pwdErrors.newPassword?.message}
                {...regPwd('newPassword')}
              />
              <button type="button" onClick={() => setShowNewPwd(!showNewPwd)}
                className="absolute right-3 top-8 text-muted-foreground hover:text-foreground transition-colors">
                {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Input
              label="Confirm New Password"
              type="password"
              icon={<Lock className="h-4 w-4" />}
              error={pwdErrors.confirmPassword?.message}
              {...regPwd('confirmPassword')}
            />

            <Button type="submit" isLoading={pwdSubmitting}>
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all locked sites. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            isLoading={isDeleting}
            className={showDeleteConfirm ? 'animate-pulse' : ''}
          >
            <Trash2 className="h-4 w-4" />
            {showDeleteConfirm ? 'Click again to confirm deletion' : 'Delete My Account'}
          </Button>
          {showDeleteConfirm && (
            <button
              className="ml-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </button>
          )}
        </CardContent>
      </Card>

      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => remove(t.id)} />
      ))}
    </div>
  );
}
