export type EnquiryPipelineStatus =
  | 'new'
  | 'contacted'
  | 'quote_sent'
  | 'negotiation'
  | 'won'
  | 'lost';

export interface TransitionContext {
  fromStatus: EnquiryPipelineStatus;
  toStatus: EnquiryPipelineStatus;
  hasQuote?: boolean;
  hasReason?: boolean;
  isAdminOverride?: boolean;
}

export interface TransitionValidationResult {
  allowed: boolean;
  message?: string;
}

const STAGE_ORDER: Record<EnquiryPipelineStatus, number> = {
  new: 0,
  contacted: 1,
  quote_sent: 2,
  negotiation: 3,
  won: 4,
  lost: 5,
};

/**
 * Validates stage transitions in the enquiry conversion pipeline.
 */
export function validateEnquiryTransition(
  context: TransitionContext
): TransitionValidationResult {
  const { fromStatus, toStatus, hasQuote, hasReason, isAdminOverride } = context;

  // Identity transition is always allowed
  if (fromStatus === toStatus) {
    return { allowed: true };
  }

  // Admin override bypasses workflow guard
  if (isAdminOverride) {
    return { allowed: true };
  }

  // Once 'won', enquiry is locked into a confirmed deal/invoice
  if (fromStatus === 'won') {
    return {
      allowed: false,
      message: 'Cannot revert a won deal without administrator authorization.',
    };
  }

  // Moving to 'lost' requires a recorded loss reason
  if (toStatus === 'lost') {
    if (!hasReason) {
      return {
        allowed: false,
        message: 'A reason is required when marking an enquiry as lost.',
      };
    }
    return { allowed: true };
  }

  // Reopening a 'lost' enquiry
  if (fromStatus === 'lost') {
    if (toStatus === 'contacted' || toStatus === 'negotiation') {
      return { allowed: true };
    }
    return {
      allowed: false,
      message: 'A lost enquiry can only be reopened to contacted or negotiation stages.',
    };
  }

  // Moving to 'quote_sent' requires an active quote/estimate
  if (toStatus === 'quote_sent' && !hasQuote) {
    return {
      allowed: false,
      message: 'Cannot move to quote_sent without generating or attaching an estimate/quote.',
    };
  }

  // Moving directly to 'won' from 'new' without contact is guarded
  if (fromStatus === 'new' && toStatus === 'won') {
    return {
      allowed: false,
      message: 'An enquiry must be qualified and contacted before closing as won.',
    };
  }

  return { allowed: true };
}
