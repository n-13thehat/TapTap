"use client";
import React from "react";

type Item = {
  id: string;
  createdAt: string;
  type: string;
  basisAmount: string;
  taxAmount: string;
  toTreasury: string;
  burned: string;
  from?: { wallet: string; user?: { id: string; username: string | null } };
  to?: { wallet: string; user?: { id: string; username: string | null } };
};

export function LedgerTable() {
  const [items, setItems] = React.useState<Item[]>([]);
  const [cursor, setCursor] = React.useState<string | undefined>(undefined);
  const [loading, setLoading] = React.useState(false);
  const [sort, setSort] = React.useState<{ key: keyof Item; dir: "asc" | "desc" }>({ key: "createdAt", dir: "desc" });

  const fetchMore = async () => {
    setLoading(true);
    const qs = new URLSearchParams({ limit: "50" });
    if (cursor) qs.set("cursor", cursor);
    const r = await fetch(`/api/admin/treasury/ledger?${qs.toString()}`);
    const data = await r.json();
    setItems((prev) => [...prev, ...(data.items || [])]);
    setCursor(data.nextCursor);
    setLoading(false);
  };

  React.useEffect(() => {
    if (items.length === 0) fetchMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = React.useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => {
      const ak = a[sort.key];
      const bk = b[sort.key];
      let cmp = 0;
      if (sort.key === "createdAt") cmp = new Date(ak as string).getTime() - new Date(bk as string).getTime();
      else cmp = Number(ak) - Number(bk);
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [items, sort]);

  function toggleSort(key: keyof Item) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));
  }

  return (
    <div className="rounded-md border overflow-auto">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 bg-background">
          <tr className="text-left">
            <Th onClick={() => toggleSort("createdAt")}>Date</Th>
            <Th onClick={() => toggleSort("type")}>Type</Th>
            <Th onClick={() => toggleSort("basisAmount")}>Basis</Th>
            <Th onClick={() => toggleSort("taxAmount")}>Tax (9%)</Th>
            <Th onClick={() => toggleSort("toTreasury")}>Treasury (6%)</Th>
            <Th onClick={() => toggleSort("burned")}>Burn (3%)</Th>
            <Th>From</Th>
            <Th>To</Th>
            <Th>TxID</Th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.id} className="border-t">
              <Td>{new Date(r.createdAt).toLocaleString()}</Td>
              <Td>{r.type}</Td>
              <Td>{Number(r.basisAmount).toLocaleString()}</Td>
              <Td>{Number(r.taxAmount).toLocaleString()}</Td>
              <Td>{Number(r.toTreasury).toLocaleString()}</Td>
              <Td>{Number(r.burned).toLocaleString()}</Td>
              <Td>{r.from?.user?.username || r.from?.wallet || ""}</Td>
              <Td>{r.to?.user?.username || r.to?.wallet || ""}</Td>
              <Td className="font-mono text-xs">{r.id}</Td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-3 flex items-center gap-3">
        <button disabled={!cursor || loading} onClick={fetchMore} className="px-3 py-2 rounded bg-muted border">
          {loading ? "Loading..." : cursor ? "Load More" : "No More"}
        </button>
        <a className="px-3 py-2 rounded bg-emerald-600 text-white" href={`/api/admin/treasury/export?scope=ledger`}>
          Export CSV
        </a>
      </div>
    </div>
  );
}

function Th({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <th className="px-3 py-2 text-xs text-muted-foreground font-medium select-none cursor-pointer" onClick={onClick}>
      {children}
    </th>
  );
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 ${className || ""}`}>{children}</td>;
}
