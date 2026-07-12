// Brutalist data table (plan §6): bordered wrapper, ink header with paper text,
// 1px row dividers, hover tint. Compose: <Table><THead>…<TBody>… .
// Numeric cells should use `className="font-mono text-right tabular-nums"`.

export function Table({ className = "", children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto border-[3px] border-ink rounded-[4px] shadow-brutal">
      <table className={`w-full border-collapse text-left ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-ink text-paper border-b-4 border-ink">
      {children}
    </thead>
  );
}

export function TH({ className = "", children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={`px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wide ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TR({ className = "", children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={`border-b border-ink/40 hover:bg-brand/10 ${className}`} {...props}>
      {children}
    </tr>
  );
}

export function TD({ className = "", children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-3 py-2 ${className}`} {...props}>
      {children}
    </td>
  );
}
