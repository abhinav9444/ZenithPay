'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getTransactions } from '@/lib/actions';
import type { Transaction } from '@/lib/types';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TransactionsTable } from '@/components/transactions/transactions-table';
import { ReportFraudDialog } from '@/components/transactions/report-fraud-dialog';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TransactionsPage() {
  const { user: authUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);

  const [isReportFraudOpen, setReportFraudOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isFetching, startFetching] = useTransition();

  const fetchData = useCallback(() => {
    if (!authUser) return;
    startFetching(async () => {
        const transactionsData = await getTransactions(authUser.uid);
        setTransactions(transactionsData);
    });
  }, [authUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReportFraud = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setReportFraudOpen(true);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Transaction History</h1>
          <p className="text-muted-foreground">
            A complete record of your financial activities.
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={isFetching}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
            Refresh
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-0">
          <TransactionsTable
            transactions={transactions}
            onReportFraud={handleReportFraud}
          />
        </CardContent>
      </Card>

      <ReportFraudDialog
        transaction={selectedTransaction}
        open={isReportFraudOpen}
        onOpenChange={setReportFraudOpen}
      />
    </div>
  );
}
