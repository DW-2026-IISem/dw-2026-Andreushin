import { fakerES as faker } from "@faker-js/faker";
import { User } from "./user.model";

/**
 * Users seeder (dev data). One canonical account per business role; their roles are
 * assigned in ISS-12. Passwords are lab-only defaults and are stored hashed (model hooks).
 * Idempotent by username: canonical accounts are reactivated if they were deactivated, so
 * `npm run db:seed` always leaves the lab operable. Extra random users (no role) show that
 * being authenticated is not enough once RBAC is on.
 */
export const SEED_USERS = [
  { username: "admin", email: "admin@circularguajira.co", password: "Admin2026!" },
  { username: "logistica", email: "logistica@circularguajira.co", password: "Logistica2026!" },
  { username: "bascula", email: "bascula@circularguajira.co", password: "Bascula2026!" },
  { username: "planta", email: "planta@circularguajira.co", password: "Planta2026!" },
  { username: "finanzas", email: "finanzas@circularguajira.co", password: "Finanzas2026!" },
] as const;

// `count` is the target total of users (at least the canonical ones).
export async function seedUsers(count: number): Promise<number> {
  let created = 0;
  for (const item of SEED_USERS) {
    const [user, wasCreated] = await User.findOrCreate({
      where: { username: item.username },
      defaults: { ...item, avatar: null, status: "active" },
    });
    if (wasCreated) created += 1;
    else if (user.status !== "active") await user.update({ status: "active" });
  }

  const extras = Math.max(0, count - (await User.count()));
  for (let i = 0; i < extras; i++) {
    const username = `${faker.person.firstName()}.${faker.string.alphanumeric(5)}`
      .normalize("NFD")
      .replace(/[^A-Za-z0-9.]/g, "")
      .toLowerCase();
    await User.create({ username, email: `${username}@circularguajira.co`, password: "Usuario2026!", avatar: null, status: "active" });
    created += 1;
  }

  if (created === 0) {
    console.log(`⏭️  users: ${await User.count()} row(s) already present (target ${count}), skipped`);
  } else {
    console.log(`✅ users: inserted ${created} user(s) (${SEED_USERS.length} canonical + random up to ${count})`);
  }
  return created;
}
