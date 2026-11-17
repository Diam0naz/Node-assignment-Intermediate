function generateRandomNumber() {
  return Math.floor(Math.random() * 100) + 1;
}

// CJS Syntax
// module.exports = generateRandomNumber;

// ESM Syntax
// exporting as default
export default generateRandomNumber;

