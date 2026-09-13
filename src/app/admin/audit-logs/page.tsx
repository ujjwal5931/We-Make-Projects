"use client";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollText } from "lucide-react";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/audit-logs?page=${page}&limit=30`).then(r => r.json()).then(d => {
      setLogs(d.logs || []);
      setPagination(d.pagination || { total: 0, totalPages: 1 });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-slate-500 text-sm">{pagination.total} total events</p>
      </div>

      {loading ? <div className="space-y-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-12"/>)}</div> : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>{["Admin", "Action", "Entity", "Entity ID", "Time"].map(h=><th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm text-foreground">{log.admin.name}</div>
                    <div className="text-xs font-mono text-muted-foreground">{log.admin.userId}</div>
                  </td>
                  <td className="px-4 py-3"><Badge variant="secondary" className="text-xs font-mono">{log.action}</Badge></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{log.entityType}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-xs truncate">{log.entityId}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString("en-IN")}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-muted-foreground"><ScrollText className="h-8 w-8 mx-auto mb-2 opacity-30"/>No audit logs yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p=>p-1)}>Previous</Button>
          <span className="flex items-center text-sm px-4">Page {page} of {pagination.totalPages}</span>
          <Button variant="outline" disabled={page >= pagination.totalPages} onClick={() => setPage(p=>p+1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
