var client, data
const idziennik = require('idziennik')
const fs = require('fs')
const cryptojs = require('crypto-js')
const path = require('path')
const confpath = process.platform == "win32" ? path.join(process.env.appdata, 'iDziennik', 'data.json') : path.join(require('os').homedir(), '.idziennik')

$(() => {
	document.querySelector('footer').children[0].children[0].innerHTML += '; version: ' + require('./package.json').version
	try {
		data = JSON.parse(fs.readFileSync(confpath, 'utf8'))
	} catch(err) {
		data = {}
	}
	if(typeof data.username === 'string' && typeof data.hash === 'string'){
		loadPage('preloader')
		idziennik({username: data.username, hash: data.hash})
		.then(cl => {
			client = cl
			if (typeof data.defaultPage === 'string') {
				require('./js/pages/'+data.defaultPage)()
			} else {
				terminarz()
			}
			return
		})
		.catch(err => {
			alert(err.toString() === 'Error: Incorrect password.' ? 'Nieprawidłowe dane. Zaloguj się' : err )
			console.error(err)
			loadPage('login')
		})
		return
	}
	loadPage('login')
});

function login () {
    var status = document.querySelector('#status')
    var button = document.querySelector('#loginbtn')
    var username = document.querySelector('#username')
	var password = document.querySelector('#password')
	if (username.value === '' || password.value === '') {
		status.innerHTML = 'Nie wpisano danych!'
		return false
	}
	[button.parentNode, username, password].forEach(el => { el.classList.add('disabled') })
	status.innerHTML = 'Loguję...'
	idziennik({username: username.value, password: password.value})
	.then(cl => {
		data.username = cl.name
		data.hash = cryptojs.MD5(cl.name.toLowerCase() + password.value).toString(cryptojs.enc.Hex)
		fs.writeFileSync(confpath, JSON.stringify(data), 'utf8')
		client = cl
		if (typeof data.defaultPage === 'string') {
			require('./js/pages/'+data.defaultPage)()
		} else {
			terminarz()
		}
	})
	.catch(err => {
		if (status) {
			status.innerHTML = err.toString() === 'Error: Incorrect password.' ? 'Nieprawidłowe hasło.' : err;
			[button.parentNode, username, password].forEach(el => { el.classList.remove('disabled') })
		}
		console.error(err)
	})
}

const oceny = require('./js/pages/oceny.js')

const terminarz = require('./js/pages/terminarz.js')

const uwagi = require('./js/pages/uwagi.js')

const komunikator = require('./js/pages/komunikator.js')

const napisz = require('./js/pages/napisz.js')

const ustawienia = require('./js/pages/ustawienia.js')

function handleError (err, page) {
	if (err.toString().includes('Unauthorized')) {
		alert('Sesja wygasła. Loguję...')
		loadPage('preloader')
		console.log('Niezalogowany.')
		idziennik({username: data.username, hash: data.hash})
		.then(cl => {
			client = cl
			require('./js/pages/'+data.defaultPage)[data.defaultPage]()
		})
		return
	}
	alert('Wystąpił błąd: ' + err + '\nWięcej informacji w konsoli: naciśnij F12')
	console.error(err)
}

function loadPage (page) {
	$('.button-collapse').sideNav('hide')
	document.title = 'iDziennik: ' + page.charAt(0).toUpperCase() + page.slice(1)
	document.querySelector('main').innerHTML = fs.readFileSync(path.join(__dirname, 'html', page + '.html'), 'utf8')
	if(page !== 'login' && page !== 'preloader'){
		document.querySelector('#navbar').innerHTML = fs.readFileSync(path.join(__dirname, 'html', 'nav.html'), 'utf8')
		document.querySelector('#nav-' + page).classList.add('active')
		document.querySelector('#logout').innerHTML += client.name
	}
	$('.button-collapse').sideNav()
	$(".dropdown-button").dropdown()
}

function disable (item) {
	item.parentNode.classList.add('disabled')
}