import { Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 text-primary", className)}>
      <div className="rounded-lg bg-primary p-2 text-primary-foreground">
        <Landmark className="h-6 w-6" />
      </div>
      <span className="text-xl font-bold tracking-tighter">ZenithPay</span>
    </div>
  );
}
