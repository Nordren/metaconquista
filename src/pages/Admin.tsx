import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Shield, Users, Link2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import type { AppRole } from '@/hooks/useAuth';

interface UserWithRole {
  id: string;
  email: string;
  nome: string;
  role: AppRole;
  linked_vendedor: string | null;
}

interface Vendedor {
  id: string;
  nome: string;
  loja: string;
  user_id: string | null;
}

export default function Admin() {
  const { isAdmin, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    nome: '',
    email: '',
    password: '',
    role: 'vendedor' as AppRole,
    loja: '',
    vendedor_id: '',
  });
  const [lojas, setLojas] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth');
    } else if (!loading && !isAdmin) {
      navigate('/');
      toast.error('Acesso restrito a administradores');
    }
  }, [loading, isAuthenticated, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setLoadingUsers(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, nome');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const { data: vendedoresData, error: vendedoresError } = await supabase
        .from('vendedores')
        .select('id, nome, loja, user_id');

      if (vendedoresError) throw vendedoresError;

      setVendedores(vendedoresData || []);
      
      // Extract unique stores
      const uniqueLojas = [...new Set((vendedoresData || []).map(v => v.loja))].sort();
      setLojas(uniqueLojas);

      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        const linkedVendedor = vendedoresData?.find(v => v.user_id === profile.id);
        return {
          id: profile.id,
          email: profile.email,
          nome: profile.nome,
          role: (userRole?.role as AppRole) || 'vendedor',
          linked_vendedor: linkedVendedor?.nome || null,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoadingUsers(false);
    }
  };

  const createUser = async () => {
    if (!newUser.nome || !newUser.email || !newUser.password) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (newUser.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setCreating(true);
    try {
      // Get the current session to send the auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      const response = await supabase.functions.invoke('create-user', {
        body: {
          email: newUser.email,
          password: newUser.password,
          nome: newUser.nome,
          role: newUser.role,
          loja: newUser.role === 'gerente' ? newUser.loja : null,
          vendedor_id: newUser.role === 'vendedor' ? newUser.vendedor_id : null,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao criar usuário');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success('Usuário criado com sucesso');
      setDialogOpen(false);
      setNewUser({ nome: '', email: '', password: '', role: 'vendedor', loja: '', vendedor_id: '' });
      
      // Wait a moment for the trigger to create profile
      setTimeout(() => fetchData(), 1000);
    } catch (error: any) {
      console.error('Error creating user:', error);
      if (error.message?.includes('already registered') || error.message?.includes('already been registered')) {
        toast.error('Este email já está cadastrado');
      } else {
        toast.error(error.message || 'Erro ao criar usuário');
      }
    } finally {
      setCreating(false);
    }
  };

  const updateRole = async (userId: string, newRole: AppRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
      toast.success('Role atualizado com sucesso');
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Erro ao atualizar role');
    }
  };

  const linkVendedor = async (userId: string, vendedorId: string | null) => {
    try {
      await supabase
        .from('vendedores')
        .update({ user_id: null })
        .eq('user_id', userId);

      if (vendedorId) {
        const { error } = await supabase
          .from('vendedores')
          .update({ user_id: userId })
          .eq('id', vendedorId);

        if (error) throw error;
      }

      await fetchData();
      toast.success('Vendedor vinculado com sucesso');
    } catch (error) {
      console.error('Error linking vendedor:', error);
      toast.error('Erro ao vincular vendedor');
    }
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'gerente': return 'default';
      default: return 'secondary';
    }
  };

  const getRoleLabel = (role: AppRole) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'gerente': return 'Gerente';
      default: return 'Vendedor';
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Painel Admin</h1>
                <p className="text-sm text-muted-foreground">Gerencie usuários e permissões</p>
              </div>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={newUser.nome}
                    onChange={(e) => setNewUser(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value as AppRole }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                      <SelectItem value="gerente">Gerente</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newUser.role === 'gerente' && (
                  <div className="space-y-2">
                    <Label>Loja do Gerente</Label>
                    <Select
                      value={newUser.loja}
                      onValueChange={(value) => setNewUser(prev => ({ ...prev, loja: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a loja" />
                      </SelectTrigger>
                      <SelectContent>
                        {lojas.map(loja => (
                          <SelectItem key={loja} value={loja}>{loja}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {newUser.role === 'vendedor' && (
                  <div className="space-y-2">
                    <Label>Vincular ao Vendedor</Label>
                    <Select
                      value={newUser.vendedor_id}
                      onValueChange={(value) => setNewUser(prev => ({ ...prev, vendedor_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o vendedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendedores
                          .filter(v => !v.user_id)
                          .map(v => (
                            <SelectItem key={v.id} value={v.id}>{v.nome} ({v.loja})</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button onClick={createUser} disabled={creating || (newUser.role === 'gerente' && !newUser.loja) || (newUser.role === 'vendedor' && !newUser.vendedor_id)} className="w-full">
                  {creating ? 'Criando...' : 'Criar Usuário'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{users.length}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Gerentes</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{users.filter(u => u.role === 'gerente').length}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Vendedores Vinculados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{vendedores.filter(v => v.user_id).length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Usuários do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Vendedor Vinculado</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.nome}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.linked_vendedor ? (
                          <Badge variant="outline">{user.linked_vendedor}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Não vinculado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Select
                            value={user.role}
                            onValueChange={(value) => updateRole(user.id, value as AppRole)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="vendedor">Vendedor</SelectItem>
                              <SelectItem value="gerente">Gerente</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={vendedores.find(v => v.user_id === user.id)?.id || 'none'}
                            onValueChange={(value) => linkVendedor(user.id, value === 'none' ? null : value)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Vincular vendedor" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nenhum</SelectItem>
                              {vendedores
                                .filter(v => !v.user_id || v.user_id === user.id)
                                .map(v => (
                                  <SelectItem key={v.id} value={v.id}>
                                    {v.nome} ({v.loja})
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
