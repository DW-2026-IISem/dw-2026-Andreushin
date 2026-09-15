export interface SettlementCalculatorItem {
  netWeight: number;
  pricePerKg: number;
}

/**
 * Servicio de dominio puro (sin estado, sin framework): calcula el
 * subtotal y el total de una liquidación a partir de sus pesajes.
 */
export class SettlementCalculator {
  static calculateSubtotal(items: SettlementCalculatorItem[]): number {
    return items.reduce((sum, item) => sum + item.netWeight * item.pricePerKg, 0);
  }

  static calculateTotal(subtotal: number, tax: number, discounts: number): number {
    return subtotal - discounts + tax;
  }
}
