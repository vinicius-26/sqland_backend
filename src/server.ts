import express from 'express';
import routes from './routes';
import cors from 'cors';

const app = express();

// Configura o middleware CORS
app.use(cors({
  origin: 'http://localhost:3000', // Permite apenas solicitações do frontend
  methods: ['GET', 'POST'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'], // Cabeçalhos permitidos
}));

app.use(express.json());
app.use(routes);

// localhost:3080
app.listen(3080)