const generate = (len: number): string => {
  const temp = "123456789";
  let code = "";
  for (let i = 0; i < len; i++) {
    code += temp[Math.floor(Math.random() * len)];
  }

  return code;
};
export default generate;
