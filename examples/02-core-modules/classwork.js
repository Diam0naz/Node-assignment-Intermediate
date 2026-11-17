const timer = () =>
  setInterval(() => {
    console.log("HelloWorld");
  }, 2000);

setTimeout(() => {
  clearInterval(timer);
}, 10000); 

timer();
