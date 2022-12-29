const discount30 = (price) => {
  const discounted = Math.round((price * 70) / 100).toFixed(2);
  return discounted;
};

export {
  discount30,
}