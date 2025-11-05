'use client';

import { useState, useTransition, useEffect } from 'react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Transaction } from '@/lib/types';
import { reportTransactionAsFraud } from '@/lib/actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';

const formSchema = z.object({
  userReport: z.string().min(10, 'Please provide at least 10 characters.'),
});

interface ReportFraudDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AIResult = {
    fraudulent: boolean;
    reason: string;
} | null;

export function ReportFraudDialog({ transaction, open, onOpenChange }: ReportFraudDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [aiResult, setAiResult] = useState<AIResult>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { userReport: '' },
  });
  
  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      form.reset();
      setAiResult(null);
    }
  }, [open, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!transaction) return;

    startTransition(async () => {
      const result = await reportTransactionAsFraud(transaction.id, values.userReport);
      if (result.success && result.fraudulent !== undefined) {
        toast({
          title: 'Report Submitted',
          description: 'Your fraud report has been processed.',
        });
        setAiResult({
            fraudulent: result.fraudulent,
            reason: result.reason || 'No reason provided.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message,
        });
      }
    });
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Suspicious Transaction</DialogTitle>
          <DialogDescription>
            Provide details about why you believe this transaction is fraudulent.
          </DialogDescription>
        </DialogHeader>

        <div className="text-sm space-y-2">
            <p><span className="font-semibold">Amount:</span> ${transaction.amount.toFixed(2)}</p>
            <p><span className="font-semibold">To:</span> {transaction.to.name}</p>
            <p><span className="font-semibold">Date:</span> {format(new Date(transaction.date), 'PPpp')}</p>
            <p><span className="font-semibold">Description:</span> {transaction.description}</p>
        </div>

        {aiResult ? (
            <div className='space-y-4'>
                <Alert variant={aiResult.fraudulent ? 'destructive' : 'default'}>
                    {aiResult.fraudulent ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                    <AlertTitle>{aiResult.fraudulent ? 'High Fraud Risk Detected' : 'Low Fraud Risk'}</AlertTitle>
                    <AlertDescription>
                        {aiResult.reason}
                    </AlertDescription>
                </Alert>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </div>
        ) : (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                control={form.control}
                name="userReport"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Reason for reporting</FormLabel>
                    <FormControl>
                        <Textarea placeholder="e.g., I did not authorize this payment, I don't know the recipient." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary" disabled={isPending}>
                    Cancel
                    </Button>
                </DialogClose>
                <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Report
                </Button>
                </DialogFooter>
            </form>
            </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
