import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { DorListQuery, PublicDor } from '@app/shared';
import { PERMISSIONS } from '@app/shared';
import { doresApi } from '@/services/api/dores';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { notify } from '@/lib/swal';
import { isApiError } from '@/services/api/client';
import { useAuth } from '@/stores/auth-context';

export function DoresPage() {
  const { hasPermission } = useAuth();
  const [query, setQuery] = useState<DorListQuery>({ page: 1, limit: 10, order: 'asc', search: '' });
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<PublicDor[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  async function load(next = query) {
    setLoading(true);
    try {
      const result = await doresApi.list(next);
      setRows(result.data);
      setTotalPages(result.meta.totalPages);
    } catch (error) {
      await notify.error('Erro', isApiError(error) ? error.message : 'Falha ao listar dores');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.page, query.search]);

  async function onDelete(dor: PublicDor) {
    const confirmed = await notify.confirm(`Excluir dor "${dor.name}"?`);
    if (!confirmed) return;
    try {
      await doresApi.remove(dor.id);
      await notify.success('Dor excluída');
      await load();
    } catch (error) {
      await notify.error('Erro', isApiError(error) ? error.message : 'Falha ao excluir');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dores</h1>
          <p className="text-sm text-muted">Catálogo de problemas/necessidades para classificar leads</p>
        </div>
        {hasPermission(PERMISSIONS.DORES_CREATE) ? (
          <Link to="/dores/new">
            <Button>Nova dor</Button>
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
          <Input
            placeholder="Buscar por nome"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </form>
      </Card>
      <Card>
        {loading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState title="Nenhuma dor cadastrada" />
        ) : (
          <>
            <Table
              rows={rows}
              rowKey={(row) => row.id}
              columns={[
                { key: 'name', header: 'Nome', render: (row) => row.name },
                {
                  key: 'description',
                  header: 'Descrição',
                  hideOnMobile: true,
                  render: (row) => row.description || <span className="text-muted">—</span>,
                },
                {
                  key: 'actions',
                  header: 'Ações',
                  render: (row) => (
                    <div className="flex justify-end gap-2">
                      {hasPermission(PERMISSIONS.DORES_UPDATE) ? (
                        <Link to={`/dores/${row.id}`}>
                          <Button size="sm" variant="secondary">
                            Editar
                          </Button>
                        </Link>
                      ) : null}
                      {hasPermission(PERMISSIONS.DORES_DELETE) ? (
                        <Button size="sm" variant="danger" onClick={() => void onDelete(row)}>
                          Excluir
                        </Button>
                      ) : null}
                    </div>
                  ),
                },
              ]}
            />
            <Pagination
              page={query.page}
              totalPages={totalPages}
              onPageChange={(page) => setQuery({ ...query, page })}
            />
          </>
        )}
      </Card>
    </div>
  );
}
