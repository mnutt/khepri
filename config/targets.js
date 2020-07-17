const electronApp = require("../electron-app/package.json");
const electronVersion = electronApp["devDependencies"]["electron"];

if (!electronVersion) {
  throw new Error(
    "Expected ./electron-app/package.json to contain electron in devDependencies."
  );
}

const versionNumberOnly = electronVersion.split(" ").slice(-1);

module.exports = {
  browsers: [`electron >= ${versionNumberOnly}`]
};
