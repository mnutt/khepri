const electron = require("electron");
const path = require("path");

const { Menu, shell } = electron;

module.exports = function(dataDir) {
  const fileTemplate = {
    label: "Khepri",
    submenu: [
      {
        label: "Open config file",
        click() {
          shell.showItemInFolder(path.join(dataDir, "config.json"));
        }
      },
      {
        role: "reload"
      },
      {
        type: "separator"
      },
      {
        role: "quit"
      }
    ]
  };

  const editTemplate = {
    role: "editMenu"
  };

  const windowTemplate = {
    role: "windowMenu"
  };

  const menu = Menu.buildFromTemplate([
    fileTemplate,
    editTemplate,
    windowTemplate
  ]);
  Menu.setApplicationMenu(menu);
};
