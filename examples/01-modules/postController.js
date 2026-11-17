const posts = [
  { id: 1, post: "Hello" },
  { id: 2, post: "World" },
];

export const getPosts = () => posts;

export const getPostsLength = (posts) => {
  return posts.length;
};
