import express from 'express';
import routes from './routes';
import cors from 'cors';

const app = express();

// Lista de domínios permitidos
const allowedOrigins = ['http://localhost:3000', 'https://sqland.vercel.app'];

app.use(cors({
  origin: function (origin, callback) {
    // Permite a requisição se o domínio estiver na lista permitida ou se não houver origem (caso de certas requisições internas)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'], // Cabeçalhos permitidos
}));

app.use(express.json());
app.use(routes);

// Porta onde o servidor escutará
app.listen(3080, () => {
  console.log('Server running on port 3080');
});