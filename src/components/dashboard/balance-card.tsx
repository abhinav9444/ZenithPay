'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface BalanceCardProps {
  balance: number | null;
  onSendMoneyClick: () => void;
}

export function BalanceCard({ balance, onSendMoneyClick }: BalanceCardProps) {
  const formatCurrency = (value: number | null) => {
    if (value === null) return <Skeleton className="h-10 w-48" />;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardDescription>Current Balance</CardDescription>
        <CardTitle className="text-4xl font-bold tracking-tighter">
          {formatCurrency(balance)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button size="lg" className="w-full sm:w-auto" onClick={onSendMoneyClick}>
          <Send className="mr-2" />
          Send Money
        </Button>
      </CardContent>
    </Card>
  );
}
