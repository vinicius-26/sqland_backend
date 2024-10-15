import { Knex } from 'knex';

// sqlite3 database.sqlite
// npx knex migrate:latest
// npm run knex:migrate
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users_tasks', table => {
    table.increments('id').primary();
    table.integer('user_id').notNullable();  
    table.string('initial_quests').notNullable();  // 'S' se já passou pelas questões inicias, 'N' se não
    table.integer('id_atual_task').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('users_tasks');
}