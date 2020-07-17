const { pathToFileURL } = require("url");
const { app, BrowserWindow } = require("electron");
const path = require("path");
const handleFileUrls = require("./handle-file-urls");
const MonitorGroup = require("./monitor-group");
const isDev = require("electron-is-dev");

const emberAppDir = path.resolve(__dirname, "..", "ember-dist");
const emberAppURL = pathToFileURL(
  path.join(emberAppDir, "index.html")
).toString();

const windowMenu = require("./window-menu");
const ipc = require("./ipc");

const dataDir = path.join(app.getPath("userData"), "data");
const monitorGroup = new MonitorGroup(dataDir);
ipc.setupHandlers(monitorGroup);

let mainWindow = null,
  canQuit;

app.setName("khepri");
app.setPath(
  "userData",
  app
    .getPath("userData")
    .replace(/Application Support\/Electron/, "Application Support/khepri")
);

app.on("window-all-closed", () => {
  app.quit();
});

app.on("will-quit", function(e) {
  if (canQuit) {
    return;
  }

  if (ipc.tailPid) {
    process.kill(ipc.tailPid, "SIGTERM");
  }

  monitorGroup.stopAll().then(() => {
    canQuit = true;

    setTimeout(() => {
      app.quit();
    }, 100);
  });

  e.preventDefault();
});

app.on("ready", async () => {
  canQuit = false;

  await handleFileUrls(emberAppDir);

  windowMenu(dataDir);

  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    titleBarStyle: "hidden",
    webPreferences: {
      nodeIntegration: true
    }
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // If you want to open up dev tools programmatically, call
  // mainWindow.openDevTools();

  // Load the ember application
  mainWindow.loadURL(emberAppURL);

  // If a loading operation goes wrong, we'll send Electron back to
  // Ember App entry point
  mainWindow.webContents.on("did-fail-load", () => {
    mainWindow.loadURL(emberAppURL);
  });

  mainWindow.webContents.on("crashed", () => {
    console.log(
      "Your Ember app (or other code) in the main window has crashed."
    );
    console.log(
      "This is a serious issue that needs to be handled and/or debugged."
    );
  });

  mainWindow.on("unresponsive", () => {
    console.log(
      "Your Ember app (or other code) has made the window unresponsive."
    );
  });

  mainWindow.on("responsive", () => {
    console.log("The main window has become responsive again.");
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
});

process.on("uncaughtException", err => {
  console.log("An exception in the main thread was not handled.");
  console.log(
    "This is a serious issue that needs to be handled and/or debugged."
  );
  console.log(`Exception: ${err}`);
});
