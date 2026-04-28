const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("path");

const isDev = !app.isPackaged;

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 960,
    minHeight: 540,
    backgroundColor: "#050606",
    title: "旧楼回声",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.once("ready-to-show", () => {
    win.show();
    win.focus();
    win.webContents.focus();
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.loadFile(path.join(__dirname, "..", "index.html"));
  return win;
}

function installMenu() {
  const template = [
    {
      label: "游戏",
      submenu: [
        { role: "reload", label: "重新载入" },
        { type: "separator" },
        { role: "quit", label: "退出" }
      ]
    }
  ];

  if (isDev) {
    template.push({
      label: "开发",
      submenu: [
        { role: "toggleDevTools", label: "开发者工具" },
        { role: "forceReload", label: "强制重新载入" }
      ]
    });
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.setAppUserModelId("com.story.horror.topdown");

app.whenReady().then(() => {
  installMenu();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
