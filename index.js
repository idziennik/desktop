const {app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')

let mainWindow

function createWindow () {
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		icon: path.join(__dirname, 'icons', '128x128.png')
	})

	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'main.html'),
		protocol: 'file:',
		slashes: true
	}))

	mainWindow.setMenu(null)

	// mainWindow.toggleDevTools()

	mainWindow.on('closed', () => {
		mainWindow = null
	})
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	if (mainWindow === null) {
		createWindow()
	}
})
