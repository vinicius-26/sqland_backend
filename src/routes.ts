import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from './database/connection';

const jwtSecretKey = 'dsfdsfsdfdsvcsvdfgefg';

const routes = express.Router();

routes.get('/', (_req, res) => {
  res.send('Auth API.\nPlease use POST /auth & POST /verify for authentication');
});

interface User {
  id: Number,
  full_name: string,
  email: string;
  birthdate: string,
  pass: string,
  xp: number,
  level: number
}

interface UserProgress {
  id: Number,
  user_id: Number,
  question_id: number,
  is_correct: boolean,
  timestamp: Date
}

interface FirstTask {
  id: Number,
  user_id: Number,
  initial_quests: string,
  id_atual_task: Number
}


//#region Autenticador
// The auth endpoint that creates a new user record or logs a user based on an existing record
routes.post('/auth', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Look up the user entry in the database
    const user: User = await db('users_login')
      .where({ email: email })
      .first();

    // If found, compare the hashed passwords and generate the JWT token for the user
    if (user) {
      const match = await bcrypt.compare(password, user.pass);
      if (!match) {
        return res.status(401).json({ message: 'Invalid password' });
      } else {
        const loginData = {
          email,
          signInTime: Date.now(),
        };

        const token = jwt.sign(loginData, jwtSecretKey);
        const userId = user.id;
        const userFullName = user.full_name;

        res.status(200).json({ message: 'success', token, id: userId, fullName: userFullName });
      }
    } else {
      // If no user is found, hash the given password and create a new entry in the auth db with the email and hashed password
      const hashedPassword = await bcrypt.hash(password, 10);
      await db('users_login').insert({ email: email, pass: hashedPassword });

      const loginData = {
        email,
        signInTime: Date.now(),
      };

      const token = jwt.sign(loginData, jwtSecretKey);
      res.status(200).json({ message: 'success', token });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// The verify endpoint that checks if a given JWT token is valid
routes.post('/verify', (req, res) => {
  const tokenHeaderKey = 'jwt-token';
  const authToken = req.headers[tokenHeaderKey] as string | undefined;

  if (!authToken) {
    return res.status(401).json({ status: 'invalid auth', message: 'Token not provided' });
  }

  try {
    const verified = jwt.verify(authToken, jwtSecretKey);
    if (verified) {
      return res.status(200).json({ status: 'logged in', message: 'success' });
    } else {
      // Access Denied
      return res.status(401).json({ status: 'invalid auth', message: 'error' });
    }
  } catch (error) {
    // Access Denied
    return res.status(401).json({ status: 'invalid auth', message: 'error' });
  }
});

// An endpoint to see if there's an existing account for a given email address
routes.post('/check-account', async (req, res) => {
  const { email } = req.body;

  console.log(req.body);

  // Look up the user entry in the database
  const user = await db('users_login')
    .where({ email: email })
    .first();

  // Check if user exists
  const userExists = user !== undefined;

  res.status(200).json({
    status: userExists ? 'User exists' : 'User does not exist',
    userExists,
  });
});

// Novo endpoint para registro de usuário
routes.post('/register', async (req, res) => {
  const { full_name, email, birthdate, password } = req.body;

  // Verifica se o email já está cadastrado
  const existingUser = await db('users_login').where({ email }).first();

  if (existingUser) {
    return res.status(400).json({ message: 'Email already registered' });
  }

  // Hash da senha
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insere o novo usuário no banco de dados
  try {
    const [userId] = await db('users_login').insert({
      full_name,
      email,
      birthdate,
      pass: hashedPassword,
    }).returning('id');

    // Gera um token JWT para o usuário
    const token = jwt.sign({ email, userId }, jwtSecretKey, { expiresIn: '1h' });

    return res.status(201).json({ message: 'User registered successfully', token });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Error registering user', error: error.message });
    }
    return res.status(500).json({ message: 'Unknown error registering user' });
  }
});

//#endregion Autenticador

//#region Task inicial
// Endpoint para registrar task inicial
routes.post('/register-first-task', async (req, res) => {
  const { id } = req.body;

  // Insere o novo usuário no banco de dados
  try {
    await db('users_tasks').insert({
      user_id: id,
      initial_quests: 'S',
      id_atual_task: 0
    });

    return res.status(201).json({ message: 'Primeira tarefa registrada com sucesso' });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Erro ao registrar a primeira tarefa do usuário: ', error: error.message });
    }
    return res.status(500).json({ message: 'Erro desconhecido ao registrar a primeira tarefa do usuario' });
  }
});

// Endpoint para identificar se o usuário já passou da primeira etapa
routes.post('/verify-first-task', async (req, res) => {
  const { id } = req.body;

  try {

    const existingTask: FirstTask = await db('users_tasks').where({ user_id: id }).first();

    if (existingTask && existingTask.initial_quests == 'S') {
      return res.status(400).json({ message: 'Ja passou pela primeira etapa' });
    }

    return res.status(201).json({ message: 'Primeiro acesso' });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Erro ao verificar a primeira tarefa do usuário: ', error: error.message });
    }
    return res.status(500).json({ message: 'Erro desconhecido ao verificar a primeira tarefa do usuario' });
  }
});

// Endpoint para remover se o usuário já passou da primeira etapa
routes.post('/remove-first-task', async (req, res) => {
  const { id } = req.body;

  try {
    await db('users_tasks').delete().where({ user_id: id });

    return res.status(201).json({ message: 'Primeiro acesso removido' });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Erro ao remover a primeira tarefa do usuário: ', error: error.message });
    }
    return res.status(500).json({ message: 'Erro desconhecido ao remover a primeira tarefa do usuario' });
  }
});
//#endregion

//#region Perguntas
// Endpoint para registrar novas perguntas
routes.post('/register-question', async (req, res) => {
  const { question_text, question_id, type, options, correct_answer, difficulty, xp_reward } = req.body;

  try {
    // Certifique-se de que 'options' é um objeto JSON se não for stringificado automaticamente
    const optionsToSave = typeof options === 'string' ? JSON.parse(options) : options;

    await db('questions').insert({
      question_text,
      question_id,
      type,
      options: optionsToSave, // Armazena como JSON
      correct_answer,
      difficulty,
      xp_reward
    });

    return res.status(201).json({ message: 'Questão registrada com sucesso' });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Erro ao registrar questão: ', error: error.message });
    }
    return res.status(500).json({ message: 'Erro desconhecido ao registrar a questão' });
  }
});

// Endpoint para recuperar as questões
routes.post('/questions', async (req, res) => {
  try {

    const existingQuestion = await db('questions');

    if (existingQuestion) {
      return res.status(201).json({ existingQuestion });
    } else {
      return res.status(404).json({ message: 'Questões não encontradas' });
    }

  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Erro ao buscar as questões cadastradas: ', error: error.message });
    }
    return res.status(500).json({ message: 'Erro desconhecido ao buscar as questões cadastradas.' });
  }
});

// Recupera última questão respondida pelo usuário
routes.post('/questions/:user_id/last-question', async (req, res) => {
  const { user_id } = req.params;
  try {
    const lastQuestion = await db('user_progress')
      .where({ user_id })
      .orderBy('timestamp', 'desc')
      .first();  // Seleciona apenas a primeira (última questão respondida)

    if (lastQuestion) {
      res.status(200).json(lastQuestion);
    } else {
      res.status(404).json({ message: 'Nenhuma questão encontrada para este usuário.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erro ao recuperar a última questão.', error });
  }
});

// Endpoint para encontrar todas as questões erradas
routes.post('/questions/:user_id/wrong-questions', async (req, res) => {
  const { user_id } = req.params;
  try {
    const wrongQuestions = await db('user_progress')
      .where({ user_id, is_correct: false });

    if (wrongQuestions.length > 0) {
      res.status(200).json(wrongQuestions);
    } else {
      res.status(404).json({ message: 'Nenhuma questão errada encontrada para este usuário.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erro ao recuperar as questões erradas.', error });
  }
});
//#endregion

//#region XP and Levels
// Endpoint para recuperar o XP e Nivel atual do usuário
routes.post('/xp', async (req, res) => {
  const { user_id } = req.body;
  try {
    let userXp = 0;
    let userLevel = 0;
    let questionId = 0;

    const existingUser: User = await db('users_login').where({ id: user_id }).first();

    const existingProgress: UserProgress = await db('user_progress')
      .where({ user_id })
      .orderBy('timestamp', 'desc')
      .first();  // Seleciona apenas a primeira (última questão respondida)

    if (existingUser) {
      userXp = existingUser.xp;
      userLevel = existingUser.level;
    }

    if (existingProgress) {
      questionId = existingProgress.question_id;
    } else {
      questionId = 0;
    }

    console.log(user_id);
    console.log(existingProgress);
    console.log(questionId);

    return res.status(201).json({ userXp, userLevel, questionId });

  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Erro ao buscar o XP e Level do usuário: ', error: error.message });
    }
    return res.status(500).json({ message: 'Erro desconhecido ao buscar o XP e Level do usuário.' });
  }
});

// Registr o XP ao acertar uma questão
routes.post('/register-xp', async (req, res) => {
  const { user_id, question_id, xp_reward, is_correct } = req.body;

  try {
    let userXp = 0;
    let userLevel = 0;

    let newXp: number = 0;
    let newUserLevel: number = 0;

    const existingUser: User = await db('users_login').where({ id: user_id }).first();

    if (existingUser) {
      userXp = existingUser.xp;
      userLevel = existingUser.level;
    }

    // Calcula o XP total do usuário, desconsiderando o nivel atual ou a 'sobra'
    let xpTotal = userXp + xp_reward;

    // Calcula o novo Nivel do usuário com base no XP total
    newUserLevel = Number(Math.trunc((xpTotal / 100))) + 1;

    // Calcula o Novo XP do usuário
    newXp = xpTotal;

    // Maneira antiga de recuperar o XP
    // if ((userXp + xp_reward) == 100) {
    //   // Se o usuário chegou a exatamente 100 de XP, sobe o nível dele e coloca o XP em 0
    //   newXp = 0;
    //   newUserLevel = Number(userLevel) + 1;
    // } else if ((userXp + xp_reward) >= 100) {
    //   // Se o usuário chegou a mais de 100 de XP, sobe o nível dele e coloca o XP em 0 + o reward da questão
    //   newXp = 0 + xp_reward;
    //   newUserLevel = Number(userLevel) + 1;
    // } else {
    //   // Se não, mantém o mesmo nível e só aumenta o XP
    //   newXp = userXp + xp_reward;
    //   newUserLevel = userLevel;
    // }

    if(newUserLevel > 3)
    {
      newUserLevel = 3;
    }

    // Insere a tentativa 
    await db('user_progress').insert({
      user_id,
      question_id,
      is_correct: is_correct,
      timestamp: Date.now()
    });

    // Atualiza o XP e o Nivel do usuário
    await db('users_login').where('id', '=', user_id).update({
      xp: newXp,
      level: newUserLevel,
    });

    return res.status(201).json({ message: 'XP atualizado com sucesso' });

  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Erro ao atualizar o XP e Level do usuário: ', error: error.message });
    }
    return res.status(500).json({ message: 'Erro desconhecido ao atualizar o XP e Level do usuário.' });
  }
});

routes.post('/reset-xp', async (req, res) => {
  const { user_id } = req.body;
  try {

    // Remove todas as tentativas do usuário
    await db('user_progress').where('user_id', '=', user_id).del();

    // Atualiza o XP e o Nivel do usuário
    await db('users_login').where('id', '=', user_id).update({
      xp: 0,
      level: 1,
    });

    return res.status(201).json({ message: 'Progresso zerado com sucesso' });

  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Erro ao zerar o XP e Level do usuário: ', error: error.message });
    }
    return res.status(500).json({ message: 'Erro desconhecido ao zerar o XP e Level do usuário.' });
  }
});
//#endregion

//#region 
// Endpoint para registrar novas revisões
routes.post('/register-revision', async (req, res) => {
  const { revision_id, revision_text, title, options } = req.body;

  try {
    // Certifique-se de que 'options' é um objeto JSON se não for stringificado automaticamente
    const optionsToSave = typeof options === 'string' ? JSON.parse(options) : options;

    await db('revisions').insert({
      revision_id,
      revision_text,
      title,
      options: optionsToSave // Armazena como JSON
    });

    return res.status(201).json({ message: 'Revisão registrada com sucesso' });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Erro ao registrar revisão: ', error: error.message });
    }
    return res.status(500).json({ message: 'Erro desconhecido ao registrar a revisão' });
  }
});

routes.post('/revisions', async (req, res) => {
  try {

    const existingRevision = await db('revisions');

    if (existingRevision) {
      return res.status(201).json({ existingRevision });
    } else {
      return res.status(404).json({ message: 'Revisões não encontradas' });
    }

  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Erro ao buscar as revisões: ', error: error.message });
    }
    return res.status(500).json({ message: 'Erro desconhecido ao ao buscar as revisões' });
  }
});
//#endregion

export default routes;