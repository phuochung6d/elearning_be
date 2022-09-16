import bcrypt from 'bcrypt';

export const hashPassword = (password) => {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(12, (err, salt) => {
      if (err)
        reject(err)
      bcrypt.hash(password, salt, (err, encrypted) => {
        if (err)
          reject(err);
        resolve(encrypted);
      })
    })
  })
}

export const comparePassword = (password, hashed) => {
  return bcrypt.compare(password, hashed);
}