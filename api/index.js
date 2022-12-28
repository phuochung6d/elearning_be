import 'dotenv/config'
import app from './app';
// dotenv.config({ path: './.env' });

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`Listening on port ${port}...!`);
});

