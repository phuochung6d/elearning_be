import axios from 'axios';

const exchangeCurrency = async () => {
  const data = await axios.get(
    `${process.env.OPENEXCHANGERATES_URL}?app_id=${process.env.OPENEXCHANGERATES_APP_ID}`
  );

  return +data.data.rates.VND;
}

export {
  exchangeCurrency,
}