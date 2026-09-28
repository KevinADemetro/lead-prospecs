import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { PublicRole, RoleListQuery } from '@app/shared';
import { PERMISSIONS } from '@app/shared';
import { rolesApi } from '@/services/api/roles';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { notify } from '@/lib/swal';
import { isApiError } from '@/services/api/client';
import { useAuth } from '@/stores/auth-context';

export function RolesPage() {
  const { hasPermission } = useAuth();
  const [query, setQuery] = useState<RoleListQuery>({ page: 1, limit: 10, order: 'desc', search: '' });
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<PublicRole[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  async function load(next = query) {
    setLoading(true);
    try {
      const result = await rolesApi.list(next);
      setRows(result.data);
      setTotalPages(result.meta.totalPages);
    } catch (error) {
      await notify.error('Erro', isApiError(error) ? error.message : 'Falha ao listar papéis');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.page, query.search]);

  async function onDelete(role: PublicRole) {
    const confirmed = await notify.confirm(`Excluir papel ${role.name}?`);
    if (!confirmed) return;
    try {
      await rolesApi.remove(role.id);
      await notify.success('Papel excluído');
      await load();
    } catch (error) {
      await notify.error('Erro', isApiError(error) ? error.message : 'Falha ao excluir');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Papéis</h1>
        {hasPermission(PERMISSIONS.ROLES_CREATE) ? (
          <Link to="/roles/new">
            <Button>Novo papel</Button>
          </Link>
        ) : null}
      </div>
      <Card>
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            setQuery({ ...query, page: 1, search });
          }}
        >
          <Input placeholder="Buscar por nome" value={search} onChange={(event) => setSearch(event.target.value)} />
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </form>
      </Card>
      <Card>
        {loading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState title="Nenhum papel encontrado" />
        ) : (
          <>
            <Table
              rows={rows}
              rowKey={(row) => row.id}
              columns={[
                { key: 'name', header: 'Nome', render: (row) => row.name },
                {
                  key: 'system',
                  header: 'Tipo',
                  render: (row) => <Badge tone={row.isSystem ? 'info' : 'muted'}>{row.isSystem ? 'Sistema' : 'Custom'}</Badge>,
                },
                {
                  key: 'permissions',
                  header: 'Permissões',
                  hideOnMobile: true,
                  render: (row) => row.permissions.length,
                },
                {
                  key: 'actions',
                  header: 'Ações',
                  render: (row) => (
                    <div className="flex justify-end gap-2">
                      {hasPermission(PERMISSIONS.ROLES_UPDATE) ? (
                        <Link to={`/roles/${row.id}`}>
                          <Button size="sm" variant="secondary">
                            Editar
                          </Button>
                        </Link>
                      ) : null}
                      {hasPermission(PERMISSIONS.ROLES_DELETE) && !row.isSystem ? (
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
