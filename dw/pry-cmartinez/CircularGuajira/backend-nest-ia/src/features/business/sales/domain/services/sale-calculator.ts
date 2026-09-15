export interface SaleCalculatorItem {
  quantity: number;
  unitPrice: number;
}

/**
 * Servicio de dominio puro (sin estado, sin framework): calcula el
 * subtotal y el total de una venta a partir de sus ítems.
 */
export class SaleCalculator {
  static calculateSubtotal(items: SaleCalculatorItem[]): number {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }

  static calculateTotal(subtotal: number, tax: number, discounts: number): number {
    return subtotal + tax - discounts;
  }
}
