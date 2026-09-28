import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { PublicUser, UserListQuery } from '@app/shared';
import { PERMISSIONS } from '@app/shared';
import { usersApi } from '@/services/api/users';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Table } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { notify } from '@/lib/swal';
import { isApiError } from '@/services/api/client';
import { useAuth } from '@/stores/auth-context';

const initial: UserListQuery = {
  page: 1,
  limit: 10,
  order: 'desc',
  sort: 'createdAt',
};

export function UsersPage() {
  const { hasPermission } = useAuth();
  const [query, setQuery] = useState<UserListQuery>(initial);
  const [filters, setFilters] = useState({ login: '', status: '', createdFrom: '', createdTo: '' });
  const [rows, setRows] = useState<PublicUser[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  async function load(next = query) {
    setLoading(true);
    try {
      const result = await usersApi.list(next);
      setRows(result.data);
      setTotalPages(result.meta.totalPages);
    } catch (error) {
      await notify.error('Erro', isApiError(error) ? error.message : 'Falha ao listar usuários');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.page, query.login, query.status, query.createdFrom, query.createdTo, query.sort, query.order]);

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    setQuery({
      ...query,
      page: 1,
      login: filters.login || undefined,
      status: filters.status ? (filters.status as 'active' | 'inactive') : undefined,
      createdFrom: filters.createdFrom ? new Date(filters.createdFrom) : undefined,
      createdTo: filters.createdTo ? new Date(filters.createdTo) : undefined,
    });
  }

  async function onDelete(user: PublicUser) {
    const confirmed = await notify.confirm(`Excluir ${user.login}?`, 'A exclusão é lógica e o registro deixa de aparecer na listagem.');
    if (!confirmed) return;
    try {
      await usersApi.remove(user.id);
      await notify.success('Usuário excluído');
      await load();
    } catch (error) {
      await notify.error('Erro', isApiError(error) ? error.message : 'Falha ao excluir');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Usuários</h1>
        {hasPermission(PERMISSIONS.USERS_CREATE) ? (
          <Link to="/users/new">
            <Button>Novo usuário</Button>
          </Link>
        ) : null}
      </div>
      <Card>
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6" onSubmit={applyFilters}>
          <Input
            placeholder="Login"
            value={filters.login}
            onChange={(event) => setFilters({ ...filters, login: event.target.value })}
          />
          <Select
            value={filters.status}
            onChange={(event) => setFilters({ ...filters, status: event.target.value })}
          >
            <option value="">Todos os status</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </Select>
          <DatePicker
            value={filters.createdFrom}
            onChange={(event) => setFilters({ ...filters, createdFrom: event.target.value })}
            aria-label="Criado de"
          />
          <DatePicker
            value={filters.createdTo}
            onChange={(event) => setFilters({ ...filters, createdTo: event.target.value })}
            aria-label="Criado até"
          />
          <Select
            value={`${query.sort}:${query.order}`}
            onChange={(event) => {
              const [sort, order] = event.target.value.split(':');
              setQuery({
                ...query,
                page: 1,
                sort,
                order: order === 'asc' ? 'asc' : 'desc',
              });
            }}
            aria-label="Ordenar"
          >
            <option value="createdAt:desc">Mais recentes</option>
            <option value="createdAt:asc">Mais antigos</option>
            <option value="login:asc">Login A-Z</option>
            <option value="login:desc">Login Z-A</option>
          </Select>
          <Button type="submit" variant="secondary">
            Filtrar
          </Button>
        </form>
      </Card>
      <Card>
        {loading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState title="Nenhum usuário encontrado" description="Ajuste os filtros ou cadastre um novo usuário." />
        ) : (
          <>
            <Table
              rows={rows}
              rowKey={(row) => row.id}
              columns={[
                { key: 'login', header: 'Login', render: (row) => row.login },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row) => (
                    <Badge tone={row.status === 'active' ? 'success' : 'muted'}>
                      {row.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  ),
                },
                {
                  key: 'roles',
                  header: 'Papéis',
                  hideOnMobile: true,
                  render: (row) => row.roles.map((role) => role.name).join(', '),
                },
                {
                  key: 'createdAt',
                  header: 'Criado em',
                  hideOnMobile: true,
                  render: (row) => new Date(row.createdAt).toLocaleString(),
                },
                {
                  key: 'updatedAt',
                  header: 'Atualizado em',
                  hideOnMobile: true,
                  render: (row) => new Date(row.updatedAt).toLocaleString(),
                },
                {
                  key: 'actions',
                  header: 'Ações',
                  render: (row) => (
                    <div className="flex justify-end gap-2">
                      {hasPermission(PERMISSIONS.USERS_UPDATE) ? (
                        <Link to={`/users/${row.id}`}>
                          <Button size="sm" variant="secondary">
                            Editar
                          </Button>
                        </Link>
                      ) : null}
                      {hasPermission(PERMISSIONS.USERS_DELETE) ? (
                        <Button size="sm" variant="danger" onClick={() => void onDelete(row)}>
                          Excluir
                        </Button>
                      ) : null}
                    </div>
                  ),
                },
              ]}
            />
            <Pagination page={query.page} totalPages={totalPages} onPageChange={(page) => setQuery({ ...query, page })} />
          </>
        )}
      </Card>
    </div>
  );
}
