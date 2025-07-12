// hashPassword.js
const bcrypt = require('bcryptjs');

bcrypt.hash('satya', 10).then(hash => {
  console.log('Hashed password:', hash);
});
//Hashed password: $2b$10$4g8RV0ybRUhBPhPozVLm2uriqHHEKQobbz9qePtX6TO2jvJ.v5FrS