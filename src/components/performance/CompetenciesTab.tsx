import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, MoreHorizontal, Target, Loader2, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

interface CompetenciesTabProps {
  searchQuery: string;
}

type CompetencyRow = {
  id: string;
  organisation_id: string;
  name: string;
  description: string | null;
  category: string | null;
  display_order: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const competencySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  category: z.string().min(1, 'Category is required').max(50),
  display_order: z.coerce.number().min(0).default(0),
});

type CompetencyFormValues = z.infer<typeof competencySchema>;

const categories = ['Core Skills', 'Compliance', 'Professional', 'Growth', 'Leadership'];

export function CompetenciesTab({ searchQuery }: CompetenciesTabProps) {
  // Avoid deep type instantiation from generated Supabase types
  const db = supabase as any;
  const [competencies, setCompetencies] = useState<CompetencyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompetency, setEditingCompetency] = useState<CompetencyRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getOrganisationId = useCallback(async (): Promise<string> => {
    const { data: userRes, error: userErr } = await db.auth.getUser();
    if (userErr) throw userErr;
    const user = userRes.user;
    if (!user) throw new Error('Not authenticated');

    const { data: organisationId, error: orgErr } = await db.rpc(
      'get_user_organisation_id',
      { _user_id: user.id },
    );
    if (orgErr) throw orgErr;
    if (!organisationId) throw new Error('Missing organisation_id for user');
    return organisationId as string;
  }, []);

  const fetchCompetencies = useCallback(async () => {
    try {
      setLoading(true);
      const organisationId = await getOrganisationId();
      const { data, error } = await db
        .from('competencies')
        .select('*')
        .eq('is_active', true)
        .eq('organisation_id', organisationId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCompetencies((data || []) as CompetencyRow[]);
    } finally {
      setLoading(false);
    }
  }, [getOrganisationId]);

  useEffect(() => {
    void fetchCompetencies();
  }, [fetchCompetencies]);

  const form = useForm<CompetencyFormValues>({
    resolver: zodResolver(competencySchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'Core Skills',
      display_order: 0,
    },
  });

  const filteredCompetencies = competencies.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.category?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const handleEdit = (competency: CompetencyRow) => {
    setEditingCompetency(competency);
    form.reset({
      name: competency.name,
      description: competency.description || '',
      category: competency.category || 'Core Skills',
      display_order: competency.display_order ?? 0,
    });
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingCompetency(null);
    form.reset({
      name: '',
      description: '',
      category: 'Core Skills',
      display_order: competencies.length + 1,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: CompetencyFormValues) => {
    setIsSubmitting(true);
    try {
      const organisationId = await getOrganisationId();
      if (editingCompetency) {
        const { data, error } = await db
          .from('competencies')
          .update({
            name: values.name,
            description: values.description || null,
            category: values.category,
            display_order: values.display_order,
          })
          .eq('id', editingCompetency.id)
          .select()
          .single();
        if (error) throw error;
        setCompetencies(prev =>
          prev.map(comp => (comp.id === editingCompetency.id ? (data as CompetencyRow) : comp))
        );
      } else {
        const { data, error } = await db
          .from('competencies')
          .insert({
            organisation_id: organisationId,
            name: values.name,
            description: values.description || null,
            category: values.category,
            display_order: values.display_order,
            is_active: true,
          })
          .select()
          .single();
        if (error) throw error;
        setCompetencies(prev => [...prev, data as CompetencyRow].sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
      }
      setDialogOpen(false);
      form.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  const groupedCompetencies = filteredCompetencies.reduce((acc, comp) => {
    const cat = comp.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(comp);
    return acc;
  }, {} as Record<string, CompetencyRow[]>);

  const handleDelete = async (id: string) => {
    const { error } = await db
      .from('competencies')
      .update({ is_active: false })
      .eq('id', id);

    if (!error) {
      setCompetencies(prev => prev.filter(comp => comp.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Competency Framework</CardTitle>
            <CardDescription>
              Define the competencies used to evaluate employee performance
            </CardDescription>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Competency
          </Button>
        </CardHeader>
        <CardContent>
          {filteredCompetencies.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No competencies defined</p>
              <p className="text-sm mt-1">Add competencies to use in performance reviews</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedCompetencies).map(([category, comps]) => (
                <div key={category}>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">{category}</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Competency</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comps.map((comp) => (
                        <TableRow key={comp.id}>
                          <TableCell className="text-muted-foreground">
                            {comp.display_order}
                          </TableCell>
                          <TableCell className="font-medium">{comp.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                            {comp.description || '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-popover">
                                <DropdownMenuItem onClick={() => handleEdit(comp)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(comp.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{editingCompetency ? 'Edit Competency' : 'Add Competency'}</DialogTitle>
            <DialogDescription>
              {editingCompetency 
                ? 'Update the competency details' 
                : 'Add a new competency to the framework'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Communication" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what this competency measures..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover">
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="display_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingCompetency ? 'Update' : 'Add'} Competency
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
