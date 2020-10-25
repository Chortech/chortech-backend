export const generate = async (map: Map<string, string>): Promise<string> => {
  return new Promise((res, rej) => {
    for (let i = 0; i < 1000; i++) {
      const random = Math.floor(Math.random() * 999999999);

      if (!map.has(random + "")) {
        res(random + "");
        break;
      }
    }

    rej(new Error("Couldn't generate a code!"));
  });
};
