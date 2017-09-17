var client, data
const idziennik = require('idziennik')
const fs = require('fs')
const cryptojs = require('crypto-js')
const path = require('path')
const constants = require('./js/constants.js')
const confpath = process.platform == "win32" ? path.join(process.env.appdata, 'iDziennik', 'data.json') : path.join(require('os').homedir(), '.idziennik')

$(() => {
	document.querySelector('footer').children[0].children[0].innerHTML += '; version: ' + require('./package.json').version
	try {
		data = JSON.parse(fs.readFileSync(confpath))
	} catch(err) {
		data = {}
	}
	if(typeof data.username === 'string' && typeof data.hash === 'string'){
		loadPage('preloader')
		idziennik({username: data.username, hash: data.hash})
		.then(cl => {
			client = cl
			if (typeof data.defaultpage === 'string') {
				window[data.defaultpage]()
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
		if (typeof data.defaultpage === 'string') {
			window[data.defaultpage]()
		} else {
			terminarz()
		}
	})
	.catch(err => {
		if (status) {
			status.innerHTML = err.toString() === 'Error: Incorrect password.' ? 'Nieprawidłowe hasło.' : err
			[button.parentNode, username, password].forEach(el => { el.classList.remove('disabled') })
		}
		console.error(err)
	})
}

function terminarz (date) {
	loadPage('terminarz')
	var $input = $('#date').pickadate({
		selectMonths: true,
		selectYears: 15,
		today: 'Dzisiaj',
		clear: 'Wyczyść',
		close: 'Zamknij',
		monthsFull: [ 'styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień' ],
		monthsShort: [ 'sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru' ],
		weekdaysFull: [ 'niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota' ],
		weekdaysShort: [ 'niedz.', 'pn.', 'wt.', 'śr.', 'cz.', 'pt.', 'sob.' ],
		firstDay: 1,
		format: 'd mmmm yyyy',
		formatSubmit: 'yyyy/mm/dd',
		onSet: event => {
			if (event.select) {
				terminarz(new Date(picker.get('select', 'yyyy/mm/dd')))
			}
		}
	})
	var picker = $input.pickadate('picker')
	$('ul.tabs').tabs();
	var date = typeof date === 'object' ? date : new Date()
	var jsondate = date
	jsondate.setHours(jsondate.getHours() + jsondate.getTimezoneOffset() / 60)
	jsondate = jsondate.toJSON().split('T')[0]
	const {dni} = constants
	client.plan(date).then(plan => {
		var {godziny, opisy} = constants.plan
		console.log('terminarz: plan', plan)
		plan.Przedmioty.forEach(lekcja => {
			var container = document.querySelector("#" + dni[lekcja.DzienTygodnia - 1])
			var zastepstwo = lekcja.TypZastepstwa !== -1 ? `(<red><right>${opisy(lekcja)}</right></red>)` : ''
			var name = lekcja.TypZastepstwa === -1 ? `<przedmiot>${lekcja.Nazwa}</przedmiot>` : `<przedmiot class="strike">${lekcja.Nazwa}</przedmiot>`
			container.innerHTML += `
				<li>
					<div class="collapsible-header" style="line-height: 2rem" data-godzina="${lekcja.Godzina}" data-nazwa="${lekcja.Nazwa}">
						${lekcja.Godzina}. ${name} ${zastepstwo}<br />
						<icon>person</icon> <gray>${lekcja.Nauczyciel}</gray><br />
						<icon>access_time</icon> <blue>${godziny(plan, lekcja)}</blue>
					</div>
				</li>
			`
		})
		Materialize.toast("Pobrano plan lekcji!", 1000)
		return client.obecnosci(date)
	}).then(obecnosci => {
		console.log('terminarz: obecnosci', obecnosci)
		obecnosci.Obecnosci.forEach(obecnosc => {
			var dzien = dni[obecnosc.DzienTygodnia - 1]
			document.querySelector(`#${dzien}-data`).innerHTML = obecnosc.Data.split(' ')[0]
			if (obecnosc.TypObecnosci !== 0) {
				var daytab = document.querySelector(`#${dzien}`)
				var container = Array.from(daytab.children).find(element => {
					return element.children[0].dataset.godzina == obecnosc.Godzina
				})
				container.children[0].innerHTML += `<br /><red>${constants.obecnosci.opisy[obecnosc.TypObecnosci]}</red>`
			}
		})
		Materialize.toast("Pobrano obecności!", 1000)
		return client.praceDomowe(date)
	}).then(zadania => {
		console.log('terminarz: zadania', zadania)
		zadania.ListK.forEach(zadanie => {
			dni.forEach(dzien => {
				if (document.querySelector(`#${dzien}-data`).innerHTML === zadanie.dataO) {
					client.pracaDomowa(zadanie._recordId).then(zadanie_full => {
						var daytab = document.querySelector(`#${dzien}`)
						var container = Array.from(daytab.children).find(element => {
							return element.children[0].dataset.nazwa == zadanie.przed
						})
						var {tytul, tresc} = zadanie_full.praca
						container.children[0].innerHTML += `<br /><icon>home</icon> <red>${tytul}</red>`
						var content = `
							<glyph>home</glyph> <span style="font-size:150%">${tytul}</span><br />
							${tresc}<br />
						`
						if (container.children.length === 1) {
							container.innerHTML += `
								<div class="collapsible-body">
									${content}
								</div>
							`
						} else {
							container.children[1].innerHTML += content
						}
					})
				}
			})
		})
		Materialize.toast("Pobrano zadania domowe!", 1000)
		$('.collapsible').collapsible()
		return client.sprawdziany(date)
	}).then(sprawdziany => {
		console.log('terminarz: sprawdziany', sprawdziany)
		sprawdziany.ListK.forEach(sprawdzian => {
			dni.forEach(dzien => {
				if (document.querySelector(`#${dzien}-data`).innerHTML === sprawdzian.data) {
					var daytab = document.querySelector(`#${dzien}`)
					var container = Array.from(daytab.children).find(element => {
						return element.children[0].dataset.nazwa == sprawdzian.przedmiot
					})
					var {rodzaj, zakres} = sprawdzian
					container.children[0].innerHTML += `<br /><icon>assignment</icon> <red>${rodzaj}</red>`
					var content = `
						<glyph>assignment</glyph> <span style="font-size:150%">${rodzaj}</span><br />
						${zakres}<br />
					`
					if (container.children.length === 1) {
						container.innerHTML += `
							<div class="collapsible-body">
								${content}
							</div>
						`
					} else {
						container.children[1].innerHTML += content
					}
				}
			})
		})
	})
}

function oceny () {
	loadPage('oceny')
	client.oceny().then(oceny => {
		console.log('oceny', oceny)
		data.oceny = oceny
		var temp = '', srednia = 0, sredniaCounter = 0
		oceny.Przedmioty.forEach(przedmiot => {
			przedmiot.srednia = przedmiot.SrednieCaloroczne === "" ? 'brak ocen do sredniej' : markToInt(parseInt(przedmiot.SrednieCaloroczne, 10))
			temp += `
				<tr>
					<td>${przedmiot.Przedmiot}</td>
					<td>
			`
			przedmiot.Oceny.forEach(ocena => {
				if(ocena.Typ === 0){
					temp += `
						<a href="#!" style="color:#${ocena.Kolor}"
						onclick="
							Materialize.toast('
								Ocena: ${ocena.Ocena}<br />
								Kategoria: ${ocena.Kategoria}<br />
								Waga: ${ocena.Waga}<br />
								Data: ${ocena.Data_wystaw}
							', 5000)
						">
							${ocena.Ocena}&nbsp;
						</a>
					`
				}
			})
			temp += `
					</td>
					<td>${przedmiot.SrednieCaloroczne}</td>
					<td>${przedmiot.srednia}</td>
				</tr>
			`
			if (typeof przedmiot.srednia !== 'string') {
				srednia += markToInt(parseInt(przedmiot.SrednieCaloroczne, 10))
				sredniaCounter++
			}
		})
		srednia = srednia !== 0 ? Math.round(srednia / sredniaCounter * 100) / 100 : 'brak ocen'
		data.ocenyRendered = temp
		document.querySelector('#table').innerHTML = temp
		document.querySelector('#srednia').innerHTML += srednia
	}).catch(err => handleError(err, 'oceny'))
}

function oceny_filter (filter) {
	var temp = ''
	var query = filter === 'szukaj' ? document.querySelector('#szukaj').value : undefined
	data.oceny.Przedmioty.forEach(przedmiot => {
		temp += `
			<tr>
				<td>${przedmiot.Przedmiot}</td>
				<td>
		`
		var tmp = []
		przedmiot.Oceny.forEach(ocena => {
			if(ocena.Typ === 0){
				switch(filter){
					case 'ostatniMiesiac': 
						if(Math.abs(new Date() - new Date(ocena.Data_wystaw.replace(/-/g, '/'))) < 2678400000){
							temp += `<a href="#!" style="color:#${ocena.Kolor}" onclick="Materialize.toast('`
							temp += `Ocena: ${ocena.Ocena}<br />Kategoria: ${ocena.Kategoria}<br />Waga: ${ocena.Waga}<br />Data: ${ocena.Data_wystaw}`
							temp += `', 5000)">${ocena.Ocena}&nbsp;</a>`
						}
						break
					case 'szukaj':
						if(ocena.Kategoria.toLowerCase().includes(query.toLowerCase()) || ocena.Ocena.toLowerCase().includes(query.toLowerCase())){
							console.log(ocena.Kategoria, ocena.Ocena, query)
							temp += `<a href="#!" style="color:#${ocena.Kolor}" onclick="Materialize.toast('`
							temp += `Ocena: ${ocena.Ocena}<br />Kategoria: ${ocena.Kategoria}<br />Waga: ${ocena.Waga}<br />Data: ${ocena.Data_wystaw}`
							temp += `', 5000)">${ocena.Ocena}&nbsp;</a>`
						}
						break

				}
			}
		})
		temp += `
				</td>
				<td>${przedmiot.SrednieCaloroczne}</td>
				<td>${markToInt(parseInt(przedmiot.SrednieCaloroczne, 10))}</td>
			</tr>
		`
	})
	document.querySelector('#table').innerHTML = temp
}

function oceny_wszystkie () {
	document.querySelector('#table').innerHTML = data.ocenyRendered
}

function uwagi () {
	loadPage('uwagi')
	client.uwagi().then(uwagi => {
		console.log('uwagi', uwagi)
		var temp = ''
		var counter = uwagi.Poczatkowa
		uwagi.SUwaga.forEach(uwaga => {
			counter += parseInt(uwaga.Punkty, 10)
			switch(uwaga.Typ){
				case 'o':
					uwaga.color = 'rgb(255, 255, 214)'
					break
				case 'n':
					uwaga.color = 'rgb(255, 214, 214)'
					break
				case 'p':
					uwaga.color = 'rgb(214, 255, 214)'
					break
			}
			temp += `
				<tr style="background-color: ${uwaga.color};">
					<td style="white-space: nowrap;">${uwaga.Data}</td>
					<td style="white-space: nowrap;">${uwaga.Nauczyciel}</td>
					<td>${uwaga.Tresc}</td>
					<td>${uwaga.Punkty}</td>
				</tr>
			`
		})
		data.uwagi = uwagi
		data.uwagiRendered = temp
		document.querySelector('#table').innerHTML += temp
		document.querySelector('#punkty').innerHTML += counter
	}).catch(err => handleError(err, 'uwagi'))
}

function uwagi_filter (filter) {
	var temp = ''
	data.uwagi.SUwaga.forEach(uwaga => {
		if(uwaga.Typ === filter){
			temp += `
				<tr style="background-color: ${uwaga.color};">
					<td style="white-space: nowrap;">${uwaga.Data}</td>
					<td style="white-space: nowrap;">${uwaga.Nauczyciel}</td>
					<td>${uwaga.Tresc}</td>
					<td>${uwaga.Punkty}</td>
				</tr>
			`
		}
	})
	document.querySelector('#table').innerHTML = temp
}

function uwagi_wszystkie () {
	document.querySelector('#table').innerHTML = data.uwagiRendered
}

function komunikator (tryb) {
	loadPage('komunikator')
	if(!tryb) var tryb = 'odebrane'
	client[tryb]().then(wiadomosci => {
		console.log('wiadomosci', wiadomosci)
		switch(tryb){
			case 'odebrane':
				var temp = `
					<tr>
						<th>Data</th>
						<th>Nadawca</th>
						<th>Temat</th>
					</tr>
				`
				break
			case 'wyslane':
				var temp = `
					<tr>
						<th>Data</th>
						<th>Odbiorca</th>
						<th>Temat</th>
					</tr>
				`
				break
		}
		wiadomosci.ListK.forEach(wiadomosc => {
			temp += `
				<tr>
					<td style="white-space: nowrap;">${wiadomosc.DataNadania}</td>
					<td style="white-space: nowrap;">${wiadomosc.Nadawca}</td>
					<td><a href="javascript:wiadomosc('${wiadomosc._recordId}')">${wiadomosc.Tytul}</td>
				</tr>
			`
		})
		document.querySelector('#table').innerHTML = temp
	}).catch(err => handleError(err, 'komunikator'))
}

function wiadomosc (id) {
	client.wiadomosc(id).then(wiadomosc => {
		console.log('wiadomosc', wiadomosc)
		document.querySelector('#modal-content').innerHTML = `
			<h4>${wiadomosc.Wiadomosc.Tytul}</h4>
			Nadawca: ${wiadomosc.Wiadomosc.Nadawca}<br />
			Data nadania: ${wiadomosc.Wiadomosc.DataNadania}<br />
			Data odczytania: ${wiadomosc.Wiadomosc.DataOdczytania}<br /><br />
			${wiadomosc.Wiadomosc.Text.replace('\n', '<br />')}
		`
		$('#modal').modal()
		$('#modal').modal('open')
		console.log(wiadomosc)
	}).catch(err => handleError(err, 'komunikator'))
}

function napisz () {
	loadPage('napisz')
	console.time('downloading')
	client.odbiorcy().then(odbiorcy => {
		console.log('odbiorcy', odbiorcy)
		data.odbiorcy = odbiorcy
		console.timeEnd('downloading')
		console.time('processing')
		odbiorcy.ListK_Pracownicy.forEach(pracownik => {
			document.querySelector('#collection-nauczyciele').innerHTML += `
				<a href="javascript:nowa('${pracownik.Id}', '${pracownik.ImieNazwisko}')" class="collection-item">
					${pracownik.ImieNazwisko} (${pracownik.ListaTypow.join(', ')})
				</a>
			`
		})
		console.timeEnd('processing')
		$('.collapsible').collapsible();
	}).catch(err => handleError(err, 'komunikator'))
}

function napisz_fullList () {
	console.time('processing-full')
	var klasy = {}, rodzice = {}
	data.odbiorcy.ListK_Klasy.forEach(klasa => {
		klasy[klasa.IdKlasa] = klasa.Jedn + ' : ' + klasa.Klasa
	})
	data.odbiorcy.ListK_Opiekunowie.forEach(opiekun => {
		rodzice[opiekun.Id] = opiekun
		document.querySelector('#collection-rodzice').innerHTML += `
			<a href="javascript:nowa('${opiekun.Id}', '${opiekun.ImieNazwisko}')" class="collection-item">
				${opiekun.ImieNazwisko} (${klasy[opiekun.IdKlasa]})
			</a>
		`
	})
	data.odbiorcy.ListK_Uczniow.forEach(uczen => {
		var rodziceUcznia = []
		if(typeof rodzice[uczen.Matka] === 'object') rodziceUcznia.push('matka - ' + rodzice[uczen.Matka].ImieNazwisko)
		if(typeof rodzice[uczen.Ojciec] === 'object') rodziceUcznia.push('ojciec - ' + rodzice[uczen.Ojciec].ImieNazwisko)
		document.querySelector('#collection-uczniowie').innerHTML += `
			<a href="javascript:nowa('', '${uczen.ImieNazwisko}')" class="collection-item">
				${uczen.ImieNazwisko} (${klasy[uczen.IdKlasa]})<br />
				${rodziceUcznia.join(', ')}
			</a>
		`
	})
	console.timeEnd('processing-full')
	document.querySelector('#napisz-fulllist-btn').classList.add('disabled')
	$('.collapsible').collapsible();
}

function nowa (id, nazwa) {
	document.querySelector('#napisz-odbiorca').value = nazwa
	document.querySelector('#napisz-odbiorca-id').value = id
	$('#modal').modal()
	$('#modal').modal('open')
}

function wyslij () {
	client.wyslij(
		document.querySelector('#napisz-odbiorca-id').value,
		document.querySelector('#napisz-temat').value,
		document.querySelector('#napisz-tresc').value,
		document.querySelector('#napisz-potwierdzenie').checked
	).then(m => console.log('wyslij', m)).catch(err => handleError(err, 'komunikator'))
}

function markToInt (ocena) {
	if(ocena >= 95) return 6
	if(ocena >= 85) return 5
	if(ocena >= 70) return 4
	if(ocena >= 50) return 3
	if(ocena >= 35) return 2
	return 1
}

function handleError (err, page) {
	if (err.toString().includes('Unauthorized')) {
		alert('Sesja wygasła. Loguję...')
		loadPage('preloader')
		console.log('Niezalogowany.')
		idziennik({username: data.username, hash: data.hash})
		.then(cl => {
			client = cl
			window[page]()
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