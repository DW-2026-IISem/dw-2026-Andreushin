import { MaterialRate } from '../models/material-rate.model';

export type RateStatus = 'current' | 'future' | 'closed';

/**
 * Where a rate stands on a date (YYYY-MM-DD, Colombia): the backend applies the rate whose
 * period [validFrom, validTo] contains the collection date; `validTo: null` means open.
 */
export function rateStatus(
  rate: Pick<MaterialRate, 'validFrom' | 'validTo'>,
  today: string,
): RateStatus {
  if (rate.validFrom > today) {
    return 'future';
  }
  return rate.validTo === null || rate.validTo >= today ? 'current' : 'closed';
}
