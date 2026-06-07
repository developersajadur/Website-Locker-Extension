import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Globe, Plus, Trash2, Lock, Search, ExternalLink, AlertTriangle } from 'lucide-react';
import { useSites } from '@/hooks/useSites';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Toast, useToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';
import { getFaviconUrl, getErrorMessage } from '@/lib/utils';
import type { Site } from '@/types';

const addSiteSchema = z.object({
  url: z.string().min(1, 'Enter a website URL'),
  label: z.string().max(50).optional(),
});

type AddSiteForm = z.infer<typeof addSiteSchema>;

function SiteCard({ site, onDelete }: { site: Site; onDelete: (id: string) => void }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    if (!showConfirm) { setShowConfirm(true); return; }
    setIsDeleting(true);
    await onDelete(site.id);
    setIsDeleting(false);
  };

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm px-4 py-3 transition-all hover:border-border hover:bg-card">
      {/* Favicon */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary ring-1 ring-border/50">
        <img
          src={getFaviconUrl(site.url)}
          alt=""
          className="h-5 w-5"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </div>

      {/* URL + label */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Lock className="h-3 w-3 shrink-0 text-primary/60" />
          <p className="truncate font-medium text-sm text-foreground">{site.label || site.url}</p>
        </div>
        {site.label && (
          <p className="truncate text-xs text-muted-foreground">{site.url}</p>
        )}
        <p className="text-xs text-muted-foreground/60 mt-0.5">
          Added {new Date(site.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <a
          href={`https://${site.url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="Visit site"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            showConfirm
              ? 'bg-destructive/20 text-red-400 hover:bg-destructive/30'
              : 'text-muted-foreground hover:text-red-400 hover:bg-destructive/10'
          }`}
        >
          {isDeleting ? (
            <span className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" />
          ) : (
            <>
              {showConfirm ? <AlertTriangle className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
              {showConfirm ? 'Confirm' : 'Remove'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/30 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 mb-4">
        <Globe className="h-8 w-8 text-primary/60" />
      </div>
      <h3 className="text-base font-semibold text-foreground">No sites locked yet</h3>
      <p className="mt-1 max-w-[22rem] text-sm text-muted-foreground">
        Add websites above to lock them. When you visit a locked site, the extension will ask for your password.
      </p>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { sites, isLoading, fetchSites, addSite, deleteSite } = useSites();
  const { toasts, show, remove } = useToast();
  const [search, setSearch] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddSiteForm>({ resolver: zodResolver(addSiteSchema) });

  useEffect(() => { fetchSites(); }, [fetchSites]);

  const onSubmit = async (data: AddSiteForm) => {
    try {
      await addSite(data.url, data.label || undefined);
      reset();
      show('Site locked successfully!', 'success');
    } catch (err) {
      show(getErrorMessage(err), 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSite(id);
      show('Site removed from locked list', 'success');
    } catch (err) {
      show(getErrorMessage(err), 'error');
    }
  };

  const filtered = sites.filter(
    (s) =>
      s.url.toLowerCase().includes(search.toLowerCase()) ||
      s.label?.toLowerCase().includes(search.toLowerCase()),
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {greeting}, <span className="gradient-text">{user?.email.split('@')[0]}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {sites.length === 0
              ? 'No websites locked yet'
              : `${sites.length} website${sites.length !== 1 ? 's' : ''} locked`}
          </p>
        </div>

        {/* Stats chip */}
        <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2">
          <Lock className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">{sites.length} sites locked</span>
        </div>
      </div>

      {/* Add site form */}
      <Card glass>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Lock a Website
          </CardTitle>
          <CardDescription>
            Enter a URL to block it behind a password prompt in your browser
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="e.g. twitter.com or reddit.com"
                icon={<Globe className="h-4 w-4" />}
                error={errors.url?.message}
                {...register('url')}
              />
            </div>
            <div className="sm:w-44">
              <Input
                placeholder="Label (optional)"
                {...register('label')}
              />
            </div>
            <Button type="submit" isLoading={isSubmitting} className="shrink-0">
              <Lock className="h-4 w-4" />
              Lock Site
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sites list */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">Locked Sites</h2>
          <div className="ml-auto relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 h-8 text-sm rounded-lg border border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 w-48"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[68px] rounded-xl shimmer" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {filtered.map((site) => (
              <SiteCard key={site.id} site={site} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Toast notifications */}
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => remove(t.id)} />
      ))}
    </div>
  );
}
