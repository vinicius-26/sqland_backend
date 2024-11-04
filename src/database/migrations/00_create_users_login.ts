import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users_login', table => {
    table.increments('id').primary();
    table.string('full_name').notNullable();  // Nome completo
    table.string('email').notNullable().unique();  // Email, deve ser único
    table.date('birthdate').notNullable();  // Data de nascimento
    table.string('pass').notNullable();  // Senha
    table.integer('xp').defaultTo(0);  // Xp
    table.integer('level').defaultTo(1);  // Xp
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('users_login');
}