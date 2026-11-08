const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 720,
    frame: true,
    titleBarStyle: 'default',
    backgroundColor: '#0a0c10',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'main-preload.js') // Fallback inline IPC handling
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.setMenu(null);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handler: Minecraft Process Spawner Engine
ipcMain.handle('launch-game', async (event, config) => {
  const {
    javaPath = 'java',
    gameDir = path.join(app.getPath('home'), '.glaxist', 'instances', 'LolYouAll', '.minecraft'),
    minMemory = '2G',
    maxMemory = '4G',
    playerName = 'Shylush',
    version = '1.21.1'
  } = config;

  // Ensure Instance Directory Layout Exists
  if (!fs.existsSync(gameDir)) {
    fs.mkdirSync(gameDir, { recursive: true });
  }

  // JVM Arguments Array Construction
  const jvmArgs = [
    `-Xms${minMemory}`,
    `-Xmx${maxMemory}`,
    '-Djava.net.preferIPv4Stack=true'
  ];

  // Client Command Arguments
  const gameArgs = [
    '--username', playerName,
    '--version', version,
    '--gameDir', gameDir,
    '--assetsDir', path.join(gameDir, 'assets'),
    '--uuid', 'e7b1a20c-8f43-421d-a95e-1b30df930c2a',
    '--accessToken', '0',
    '--userType', 'legacy'
  ];

  const fullArgs = [...jvmArgs, 'net.minecraft.client.main.Main', ...gameArgs];

  console.log(`[Glaxist Engine] Executing Java binary at: ${javaPath}`);

  try {
    const mcProcess = spawn(javaPath, fullArgs, {
      cwd: gameDir,
      detached: true,
      stdio: 'pipe'
    });

    mcProcess.stdout.on('data', (data) => {
      console.log(`[MC STDOUT]: ${data}`);
    });

    mcProcess.stderr.on('data', (data) => {
      console.error(`[MC STDERR]: ${data}`);
    });

    mcProcess.on('close', (code) => {
      console.log(`[Glaxist Engine] Minecraft process terminated with code: ${code}`);
    });

    return { success: true, pid: mcProcess.pid };
  } catch (err) {
    console.error(`[Glaxist Engine Error]: ${err.message}`);
    return { success: false, error: err.message };
  }
});
