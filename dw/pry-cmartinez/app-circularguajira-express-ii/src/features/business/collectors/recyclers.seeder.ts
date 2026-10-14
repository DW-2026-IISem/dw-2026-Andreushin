import { fakerES as faker } from "@faker-js/faker";
import { Recycler, RecyclerCreationAttributes, RecyclerType } from "./recycler.model";

/**
 * Recycler seeder (fake data with @faker-js/faker).
 * Invoked from `src/database/seeders` (SeedersRunner), never from the App.
 *
 * Scripts write through the model directly (no service/DTO), so the domain formats that
 * `dto/recycler.validation.ts` enforces are replicated here: citizen ID or NIT with check
 * digit, mobile phone and unique document number.
 *
 * Idempotent: `count` is the target total; it only inserts what is missing, so running it
 * again with the same count inserts nothing.
 */
const MUNICIPALITIES = ["Riohacha", "Maicao", "Uribia", "Manaure", "Fonseca", "San Juan del Cesar"];

const newDocumentNumber = (type: RecyclerType, taken: Set<string>): string => {
  let document: string;
  do {
    document =
      type === "organization"
        ? `9${faker.string.numeric(8)}-${faker.string.numeric(1)}` // NIT
        : `1${faker.string.numeric(9)}`; // citizen ID
  } while (taken.has(document));
  taken.add(document);
  return document;
};

const newRecycler = (taken: Set<string>): RecyclerCreationAttributes => {
  const recyclerType = faker.helpers.weightedArrayElement<RecyclerType>([
    { weight: 7, value: "independent" },
    { weight: 3, value: "organization" },
  ]);
  const name =
    recyclerType === "organization"
      ? `Asociación de Recicladores ${faker.person.lastName()}`
      : faker.person.fullName();
  return {
    name,
    documentNumber: newDocumentNumber(recyclerType, taken),
    recyclerType,
    phone: `3${faker.string.numeric(9)}`,
    email: faker.helpers.maybe(() => faker.internet.email().toLowerCase(), { probability: 0.7 }) ?? null,
    address: `${faker.location.streetAddress()}, ${faker.helpers.arrayElement(MUNICIPALITIES)}`,
    status: faker.helpers.weightedArrayElement([
      { weight: 8, value: "active" as const },
      { weight: 2, value: "inactive" as const },
    ]),
  };
};

export async function seedRecyclers(count: number): Promise<number> {
  const existing = await Recycler.count();
  const missing = count - existing;
  if (missing <= 0) {
    console.log(`⏭️  recyclers: ${existing} row(s) already present (target ${count}), skipped`);
    return 0;
  }

  const taken = new Set(
    (await Recycler.findAll({ attributes: ["documentNumber"] })).map((r) => r.documentNumber)
  );
  const rows = Array.from({ length: missing }, () => newRecycler(taken));

  await Recycler.bulkCreate(rows);
  console.log(`✅ recyclers: inserted ${missing} fake row(s) (total ${count})`);
  return missing;
}
