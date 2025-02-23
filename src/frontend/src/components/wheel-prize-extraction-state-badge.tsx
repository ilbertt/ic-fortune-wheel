import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { WheelPrizeExtractionState } from '@/declarations/backend/backend.did';
import { renderError } from '@/lib/utils';

interface WheelPrizeExtractionStateProps {
  state: WheelPrizeExtractionState;
}

export function WheelPrizeExtractionStateBadge({
  state,
}: WheelPrizeExtractionStateProps) {
  if ('completed' in state) {
    return (
      <Badge variant="success">
        <CheckCircle2 />
        Completed
      </Badge>
    );
  }

  if ('processing' in state) {
    return (
      <Badge variant="warning">
        <Clock />
        Processing
      </Badge>
    );
  }

  if ('failed' in state) {
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
