import type { ReactNode } from 'react';

type Column<T> = {
  key: string;
  header: string;
  hideOnMobile?: boolean;
  render: (row: T) => ReactNode;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
};

export function Table<T>({ columns, rows, rowKey }: Props<T>) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              {columns.map((column) => (
                <th key={column.key} className="px-3 py-2 font-medium">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-border last:border-0">
                {columns.map((column) => (
                  <td key={column.key} className="px-3 py-3 align-middle">
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <article key={rowKey(row)} className="rounded-lg border border-border p-3">
            {columns
              .filter((column) => !column.hideOnMobile)
              .map((column) => (
                <div key={column.key} className="flex items-start justify-between gap-3 py-1 text-sm">
                  <span className="text-muted">{column.header}</span>
                  <span className="text-right">{column.render(row)}</span>
                </div>
              ))}
          </article>
        ))}
      </div>
    </>
  );
}
