import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { WheelPrizeExtractionState } from '@/lib/api/backend/backend';
import { renderError } from '@/lib/utils';

interface WheelPrizeExtractionStateProps {
  state: WheelPrizeExtractionState;
}

export function WheelPrizeExtractionStateBadge({
  state,
}: WheelPrizeExtractionStateProps) {
  if (state.__kind__ === 'completed') {
    return (
      <Badge variant="success">
        <CheckCircle2 />
        Completed
      </Badge>
    );
  }

  if (state.__kind__ === 'processing') {
    return (
      <Badge variant="warning">
        <Clock />
        Processing
      </Badge>
    );
  }

  if (state.__kind__ === 'failed') {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Badge variant="destructive" className="cursor-pointer">
            <AlertCircle />
            Failed
          </Badge>
        </PopoverTrigger>
        <PopoverContent>
          <div className="font-medium">Error Details</div>
          <p className="text-muted-foreground mt-2 text-sm">
            {renderError(state.failed.error)}
          </p>
        </PopoverContent>
      </Popover>
    );
  }

  return <Badge variant="secondary">Unknown State</Badge>;
}
