var client, data
const idziennik = require('idziennik')
const fs = require('fs')
const cryptojs = require('crypto-js')
const path = require('path')
const utils = require('./js/utils')
const confpath = process.platform === "win32" ? path.join(process.env.appdata, 'iDziennik', 'data.json') : path.join(require('os').homedir(), '.idziennik')

const pages = require('./js/pages')

document.querySelector('.footer-copyright > div').innerHTML += '; version: ' + require('./package.json').version
try {
	data = require(confpath)
} catch(err) {
	data = {}
}

if(utils.dataValid(data)){
	loadPage('preloader')
	idziennik({username: data.username, hash: data.hash})
	.then(cl => {
		client = cl
		pages[typeof data.defaultPage === 'string' ? data.defaultPage : 'terminarz']()
	})
	.catch(err => {
		alert(err.toString() === 'Error: Incorrect password.' ? 'Nieprawidłowe dane. Zaloguj się' : err )
		console.error(err)
		loadPage('login')
	})
} else
	loadPage('login')

function login () {
	var status = document.querySelector('#status')
	var button = document.querySelector('#loginbtn')
	var username = document.querySelector('#username')
	var password = document.querySelector('#password')
	if (username.value === '' || password.value === '') {
		status.innerHTML = 'Nie wpisano danych!'
		return false
	}
	[button.parentNode, username, password].forEach(utils.disable)
	status.innerHTML = 'Loguję...'
	idziennik({username: username.value, password: password.value})
	.then(cl => {
		data.username = cl.name
		data.hash = cryptojs.MD5(cl.name.toLowerCase() + password.value).toString(cryptojs.enc.Hex)
		fs.writeFileSync(confpath, JSON.stringify(data), 'utf8')
		client = cl
		pages[typeof data.defaultPage === 'string' ? data.defaultPage : 'terminarz']()
	})
	.catch(err => {
		if (status) {
			status.innerHTML = err.toString() === 'Error: Incorrect password.' ? 'Nieprawidłowe hasło.' : err;
			[button.parentNode, username, password].forEach(utils.enable)
		}
		console.error(err)
	})
}

function handleError (err, page) {
	if (err.toString().includes('Unauthorized')) {
		loadPage('preloader')
		idziennik({username: data.username, hash: data.hash})
		.then(cl => {
			client = cl
			pages[typeof data.defaultPage === 'string' ? data.defaultPage : 'terminarz']()
		})
		return
	}
	alert('Wystąpił błąd: ' + err + '\nWięcej informacji w konsoli: naciśnij F12')
	console.error(err)
}

function loadPage (page) {
	document.title = 'iDziennik: ' + page.charAt(0).toUpperCase() + page.slice(1)
	document.querySelector('main').innerHTML = fs.readFileSync(path.join(__dirname, 'html', page + '.html'), 'utf8')
	if(page !== 'login' && page !== 'preloader'){
		document.querySelectorAll('nav li').forEach(el => el.classList.remove('active'))
		document.querySelector('#nav-' + page).classList.add('active')
		document.querySelector('#logout').innerHTML = 'Wyloguj ' + client.name
	}
	new M.Sidenav(document.querySelector('#sidenav'))
	new M.Dropdown(document.querySelector('.dropdown-button'))
}