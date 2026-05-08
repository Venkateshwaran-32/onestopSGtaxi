import type { Confidence, OperatorId } from '@onestopsgtaxi/shared';

export interface ConfidenceExplain {
  title: string;
  description: string;
  errorBand: string;
}

const COMMON: Record<Confidence, ConfidenceExplain> = {
  HIGH: {
    title: 'High confidence',
    description:
      'Verified taxi metered fare from LTA-published rate cards. Surcharges (peak, midnight, location) are modelled directly.',
    errorBand: '±5% typical',
  },
  MEDIUM: {
    title: 'Medium confidence',
    description:
      'Operator publishes their rate card publicly. Surge timing modelled from public reports — can drift on busy days.',
    errorBand: '±10–15% typical',
  },
  LOW: {
    title: 'Low confidence',
    description:
      "Operator's pricing algorithm is not publicly disclosed. Estimate uses our model and can be off by 20%+. Treat as a directional comparison, not a binding price.",
    errorBand: '±20–30% typical',
  },
};

const PER_OPERATOR_NOTE: Partial<Record<OperatorId, string>> = {
  grab: 'Grab\'s dynamic pricing changes second-to-second. Tap through to confirm.',
  gojek: 'Gojek\'s pricing is opaque. Estimates may diverge from app price.',
  tada: 'TADA charges no commission to drivers — fares tend to be steadier.',
  ryde: 'Ryde publishes rate cards but surge windows can be unpredictable.',
  zig: 'Zig is operated by ComfortDelGro using LTA-regulated taxi rates.',
  geolah: 'Geolah operates a zero-commission model. Public rate card.',
  transcab: 'Trans-Cab fares include LTA-regulated taxi surcharges.',
  cdg: 'Metered taxi fare under LTA-published rules. Shown to ±5% typical.',
};

export function getConfidenceExplain(
  confidence: Confidence,
  operatorId: OperatorId,
): ConfidenceExplain {
  const base = COMMON[confidence];
  const note = PER_OPERATOR_NOTE[operatorId];
  return {
    ...base,
    description: note ? `${base.description} ${note}` : base.description,
  };
}
