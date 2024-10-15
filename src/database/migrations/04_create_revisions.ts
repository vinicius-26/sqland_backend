import { Knex } from 'knex';

// sqlite3 database.sqlite
// npx knex migrate:latest
// npm run knex:migrate
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('revisions', table => {
    table.increments('id').primary(); // id (INT, PK, AI)
    table.integer('revision_id').notNullable(); // Numero da questão
    table.string('revision_text').notNullable(); // (TEXT) – O enunciado da pergunta.
    table.string('title').notNullable(); // (ENUM: 'multiple_choice', 'ordering', 'free_response') – O tipo da pergunta.
    table.json('options').notNullable(); // (JSON) – As opções, caso seja uma pergunta de múltipla escolha ou ordenação.
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('revisions');
}