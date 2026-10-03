import { fakerES as faker } from "@faker-js/faker";
import { CreationAttributes } from "sequelize";
import { withTransaction } from "../../../shared/database/with-transaction";
import { Recycler } from "./recycler.model";
import { RecyclersRepository } from "./recyclers.repository";

const MUNICIPALITIES = ["Riohacha", "Maicao", "Uribia", "Manaure", "Fonseca", "San Juan del Cesar", "Albania", "Dibulla"];

// Idempotent: inserts fake recyclers only when the table is empty.
export class RecyclersSeeder {
  constructor(private readonly repository: RecyclersRepository = new RecyclersRepository()) {}

  async run(count: number): Promise<number> {
    if (count <= 0) return 0;

    const existing = await this.repository.count();
    if (existing > 0) {
      console.log(`⏭️  recyclers: ${existing} row(s) already present, skipping`);
      return 0;
    }

    const rows = this.buildRows(count);
    await withTransaction((transaction) => this.repository.bulkCreate(rows, transaction));
    console.log(`✅ recyclers: inserted ${rows.length} fake row(s)`);
    return rows.length;
  }

  private buildRows(count: number): CreationAttributes<Recycler>[] {
    const documents = new Set<string>();
    while (documents.size < count) {
      documents.add(faker.string.numeric({ length: 10, allowLeadingZeros: false }));
    }

    return [...documents].map((documentNumber, index) => {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      return {
        name: `${firstName} ${lastName}`,
        description: `Reciclador de oficio en ${faker.helpers.arrayElement(MUNICIPALITIES)}`,
        phone: `3${faker.string.numeric(9)}`,
        email: faker.internet
          .email({ firstName, lastName, provider: "circularguajira.org" })
          .replace("@", `.${index + 1}@`)
          .toLowerCase(),
        documentNumber,
        status: faker.helpers.weightedArrayElement([
          { weight: 9, value: "active" as const },
          { weight: 1, value: "inactive" as const },
        ]),
      };
    });
  }
}
