'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getUser, getTransactions } from '@/lib/actions';
import type { User, Transaction } from '@/lib/types';

import { BalanceCard } from '@/components/dashboard/balance-card';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { SendMoneyDialog } from '@/components/transactions/send-money-dialog';
import { ReportFraudDialog } from '@/components/transactions/report-fraud-dialog';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);

  const [isSendMoneyOpen, setSendMoneyOpen] = useState(false);
  const [isReportFraudOpen, setReportFraudOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  const [isFetching, startFetching] = useTransition();

  const fetchData = useCallback(() => {
    if (!authUser) return;
    startFetching(async () => {
        const [userData, transactionsData] = await Promise.all([
            getUser(authUser.uid),
            getTransactions(authUser.uid),
        ]);
        setUser(userData);
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
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Button variant="outline" onClick={fetchData} disabled={isFetching}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
            Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <BalanceCard
            balance={user?.balance ?? null}
            onSendMoneyClick={() => setSendMoneyOpen(true)}
          />
        </div>
        <div className="lg:col-span-2">
          <RecentTransactions
            transactions={transactions}
            currentUserUid={authUser?.uid ?? ''}
            onReportFraud={handleReportFraud}
          />
        </div>
      </div>

      <SendMoneyDialog
        open={isSendMoneyOpen}
        onOpenChange={setSendMoneyOpen}
      />
      <ReportFraudDialog
        transaction={selectedTransaction}
        open={isReportFraudOpen}
        onOpenChange={setReportFraudOpen}
      />
    </div>
  );
}
