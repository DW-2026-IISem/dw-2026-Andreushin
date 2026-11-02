import { filterRows } from './filter-rows';

interface Row {
  name: string;
  email: string | null;
  phone: string | null;
}

const ROWS: Row[] = [
  { name: 'Asociación Wayuu Recicla', email: 'wayuu@correo.co', phone: '3001112233' },
  { name: 'Juan Epieyú', email: null, phone: '3104445566' },
  { name: 'Recicladora del Sur', email: 'sur@correo.co', phone: null },
];

const pick = (row: Row) => [row.name, row.email, row.phone];

describe('filterRows', () => {
  it('should return a copy of every row when there is no term', () => {
    const result = filterRows(ROWS, '   ', pick);
    expect(result).toEqual(ROWS);
    expect(result).not.toBe(ROWS);
  });

  it('should ignore upper and lower case', () => {
    expect(filterRows(ROWS, 'WAYUU', pick).map((row) => row.name)).toEqual(['Asociación Wayuu Recicla']);
  });

  it('should search every picked field, including numbers in text', () => {
    expect(filterRows(ROWS, '310444', pick).map((row) => row.name)).toEqual(['Juan Epieyú']);
  });

  it('should not break on null fields', () => {
    expect(filterRows(ROWS, 'sur', pick).map((row) => row.name)).toEqual(['Recicladora del Sur']);
  });

  it('should return an empty array when nothing matches', () => {
    expect(filterRows(ROWS, 'plástico', pick)).toEqual([]);
  });
});
