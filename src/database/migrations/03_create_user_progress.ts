import { Knex } from 'knex';

// sqlite3 database.sqlite
// npx knex migrate:latest
// npm run knex:migrate
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('user_progress', table => {
    table.increments('id').primary();
    table.integer('user_id').notNullable();
    table.integer('question_id').notNullable();
    table.boolean('is_correct').notNullable();
    table.dateTime('timestamp').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('questions');
}