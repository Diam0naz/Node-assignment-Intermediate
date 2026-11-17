// console.log(process);
// const generateRandomNumber = require("./utils");

// import { getPosts, getPostsLength } from "./postController.js";

// import generateRandomNumber from "./utils.js";
// console.log(`random number: ${generateRandomNumber()}`);
// console.log(getPosts());
// console.log(getPostsLength(getPosts()));

import fs from "fs"
import path from "path"

const filePath = path.resolve("/home/user", "lorem.md");

console.log(filePath);


fs.readFile(filePath, "utf-8", (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(data);
});