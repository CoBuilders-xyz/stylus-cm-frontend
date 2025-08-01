'use client';

import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FeedbackButtonProps {
  feedbackUrl?: string;
}

export default function FeedbackButton({
  feedbackUrl = 'https://forms.google.com/your-form-url', // Replace with your actual Google Form URL
}: FeedbackButtonProps) {
  const handleFeedbackClick = () => {
    window.open(feedbackUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className='fixed bottom-6 right-6 z-50'>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleFeedbackClick}
              size='icon'
              className='h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-primary hover:bg-primary/90'
              aria-label='Send Feedback'
            >
              <MessageCircle className='h-6 w-6' />
            </Button>
          </TooltipTrigger>
          <TooltipContent side='left' className='mr-2'>
            <p>Send Feedback</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
