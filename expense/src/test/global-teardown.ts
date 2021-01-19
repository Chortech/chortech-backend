import { exec } from "child_process";
import path from "path";
import util from "util";

const exec1 = util.promisify(exec);
const script = path.join(__dirname, "neo4j-create.sh");

export = async function setup() {
  const child = await exec1(`bash ${script} delete`);
  console.log(child.stdout);
  return;
};
