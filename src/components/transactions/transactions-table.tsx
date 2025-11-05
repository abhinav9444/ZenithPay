'use client';

import type { Transaction } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TransactionsTableProps {
  transactions: Transaction[] | null;
  onReportFraud: (transaction: Transaction) => void;
}

export function TransactionsTable({
  transactions,
  onReportFraud,
}: TransactionsTableProps) {
  const renderSkeleton = () => (
    [...Array(5)].map((_, i) => (
      <TableRow key={i}>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-12" /></TableCell>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-8 w-24" /></TableCell>
      </TableRow>
    ))
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Details</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions === null ? renderSkeleton() : transactions.map((tx) => {
          const isSent = tx.type === 'sent';
          const peer = isSent ? tx.to : tx.from;
          return (
            <TableRow key={tx.id} className={tx.fraudReported ? "bg-destructive/10 hover:bg-destructive/20" : ""}>
              <TableCell className="font-medium">{format(new Date(tx.date), 'MMM d, yyyy')}</TableCell>
              <TableCell>
                <Badge variant={isSent ? 'destructive' : 'secondary'} className={cn(isSent ? '' : 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200')}>{tx.type}</Badge>
              </TableCell>
              <TableCell>
                <div className="font-medium">{isSent ? 'To: ' : 'From: '}{peer.name}</div>
                <div className="text-sm text-muted-foreground">{tx.description}</div>
              </TableCell>
              <TableCell className={cn('text-right font-bold', isSent ? 'text-destructive' : 'text-green-600')}>
                {isSent ? '-' : '+'}
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(tx.amount)}
              </TableCell>
              <TableCell>
                <Badge variant={tx.status === 'completed' ? 'default' : 'outline'} className={cn(tx.status === 'completed' ? 'bg-green-600' : '')}>{tx.status}</Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReportFraud(tx)}
                  disabled={!!tx.fraudReported}
                >
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  {tx.fraudReported ? 'Reported' : 'Report Fraud'}
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
