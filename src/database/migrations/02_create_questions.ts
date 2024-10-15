import { Knex } from 'knex';

// sqlite3 database.sqlite
// npx knex migrate:latest
// npm run knex:migrate
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('questions', table => {
    table.increments('id').primary(); // id (INT, PK, AI)
    table.integer('question_id').notNullable(); // Numero da questão
    table.string('question_text').notNullable(); // (TEXT) – O enunciado da pergunta.
    table.string('type').notNullable(); // (ENUM: 'multiple_choice', 'ordering', 'free_response') – O tipo da pergunta.
    table.json('options').notNullable(); // (JSON) – As opções, caso seja uma pergunta de múltipla escolha ou ordenação.
    table.string('correct_answer').notNullable(); //  (TEXT) – A resposta correta.
    table.string('difficulty').notNullable(); // (ENUM: 'easy', 'medium', 'hard') – A dificuldade da questão.
    table.integer('xp_reward').notNullable(); // (INT) – XP dado ao usuário por acertar
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('questions');
}