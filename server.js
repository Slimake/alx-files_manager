import express from 'express';
import router from './routes/index';

const app = express();
const port = process.env.PORT || 5000;

// Middleware to pass JSON, Respond to request
app.use(express.json({ limit: '5mb' }), router);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
