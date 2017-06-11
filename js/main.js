var client, container, data
const idziennik = require('idziennik')
const fs = require('fs')
const cryptojs = require('crypto-js')
const path = require('path')

$(() => {
	document.querySelector('footer').children[0].children[0].innerHTML += '; version: ' + require('./package.json').version
	try {
		data = JSON.parse(fs.readFileSync(path.join(require('os').homedir(), '.idziennik'), 'utf8'))
	} catch(err) {
		data = {}
	}
	container = document.querySelector('main')
	if(typeof data.username === 'string' && typeof data.hash === 'string'){
		loadPage('preloader')
		idziennik({username: data.username, hash: data.hash})
		.then(cl => {
			client = cl
			pulpit()
		})
		.catch(err => {
			if(err.toString() === 'Error: Incorrect password.'){
				alert('Nieprawidłowe dane. Zaloguj się')
			} else {
				alert(err)
			}
			console.error(err)
			loadPage('login')
		})
	} else {
		loadPage('login')
	}
});

function login(){
	if(document.querySelector('#username').value === '' || document.querySelector('#password').value === ''){
		document.querySelector('#status').innerHTML = 'Nie wpisano danych!'
		return false
	}
	document.querySelector('#loginbtn').parentNode.classList.add('disabled')
	document.querySelector('#status').innerHTML = 'Loguję...'
	idziennik({username: document.querySelector('#username').value, password: document.querySelector('#password').value})
	.then(cl => {
		console.log('client', cl)
		data.username = cl.name
		data.hash = cryptojs.MD5(cl.name.toLowerCase() + document.querySelector('#password').value).toString(cryptojs.enc.Hex)
		fs.writeFileSync(require('os').homedir() + '/.idziennik', JSON.stringify(data), 'utf8')
		client = cl
		pulpit()
	})
	.catch(err => {
		if(document.querySelector('#status')){
			if(err.toString() === 'Error: Incorrect password.'){
				document.querySelector('#status').innerHTML = 'Nieprawidłowe hasło.'
			} else {
				document.querySelector('#status').innerHTML = err
			}
			document.querySelector('#loginbtn').parentNode.classList.remove('disabled')
		}
		console.error(err)
	})
}

function pulpit(){
	loadPage('pulpit')
	
	var d = {lekcje: 'Lekcje: <br />', sprawdziany: 'Sprawdziany: <br />', zadania: 'Zadania: <br />', wydarzenia: 'Wydarzenia: <br />'}
	var j = {lekcje: 'Lekcje: <br />', sprawdziany: 'Sprawdziany: <br />', zadania: 'Zadania: <br />', wydarzenia: 'Wydarzenia: <br />'}

	d.date = new Date()
	d.dzien = d.date.getDay() === 0 ? 7 : d.date.getDay()
	d.jsondate = new Date(d.date)
	d.jsondate.setHours(d.date.getHours() - d.date.getTimezoneOffset() / 60)
	d.jsondate = d.jsondate.toJSON().split('T')[0]

	j.date = new Date()
	j.date.setDate(d.date.getDate() + 1)
	j.dzien = d.dzien === 7 ? 1 : d.dzien + 1
	j.jsondate = new Date(j.date)
	j.jsondate.setHours(j.date.getHours() - j.date.getTimezoneOffset() / 60)
	j.jsondate = j.jsondate.toJSON().split('T')[0]

	client.plan(d.date).then(plan => {
		console.log('pulpit: plan', plan)
		plan.Przedmioty.forEach(l => {
			if (l.DzienTygodnia === d.dzien) {
				d.lekcje += l.TypZastepstwa === -1 ? `${l.Godzina}. ${l.Nazwa}<br />` : `<span style="text-decoration: line-through">${l.Godzina}. ${l.Nazwa}</span> <br />`
			}
			if (j.dzien !== 1 && l.DzienTygodnia === j.dzien) {
				j.lekcje += l.TypZastepstwa === -1 ? `${l.Godzina}. ${l.Nazwa}<br />` : `<span style="text-decoration: line-through">${l.Godzina}. ${l.Nazwa}</span> <br />`
			}
		})

		document.querySelector('#dzisiaj-plan').innerHTML = d.lekcje.length === 14 ? 'Brak lekcji' : d.lekcje

		if (d.dzien !== 7) {
			document.querySelector('#jutro-plan').innerHTML = j.lekcje.length === 14 ? 'Brak lekcji' : j.lekcje
			return false
		} else {
			// Trzeba powtórzyć żądanie żeby pobrać plan na następny dzień (poniedziałek)
			return client.plan(j.date)
		}
	}).then(plan => {
		if(plan){
			console.log('pulpit: plan 2', plan)
			plan.Przedmioty.forEach(l => {
				if (l.DzienTygodnia === j.dzien) {
					j.lekcje += l.TypZastepstwa === -1 ? `${l.Godzina}. ${l.Nazwa}<br />` : `<span style="text-decoration: line-through">${l.Godzina}. ${l.Nazwa}</span> <br />`
				}
			})
			document.querySelector('#jutro-plan').innerHTML = j.lekcje.length === 14 ? 'Brak lekcji' : j.lekcje
		}
		return client.sprawdziany(d.date)
	}).then(sprawdziany => {
		console.log('pulpit: sprawdziany', sprawdziany)
		sprawdziany.ListK.forEach(spr => {
			d.sprawdziany += spr.data === d.jsondate ? `${spr.rodzaj} - ${spr.rodzaj}: ${spr.zakres} <br />` : ''
			j.sprawdziany += spr.data === j.jsondate ? `${spr.rodzaj} - ${spr.rodzaj}: ${spr.zakres} <br />` : ''
		})

		document.querySelector('#dzisiaj-sprawdziany').innerHTML = d.sprawdziany.length === 19 ? 'Brak sprawdzianów' : d.sprawdziany
		
		if (j.date.getDate() !== 1) {
			document.querySelector('#jutro-sprawdziany').innerHTML = j.sprawdziany.length === 19 ? 'Brak sprawdzianów' : j.sprawdziany
			return false
		} else {
			return client.sprawdziany(j.date)
		}
	}).then(sprawdziany => {
		if (sprawdziany) {
			console.log('pulpit: sprawdziany 2', sprawdziany)
			sprawdziany.ListK.forEach(spr => {
				j.sprawdziany += spr.data === j.jsondate.toJSON().split('T')[0] ? `${spr.rodzaj} - ${spr.rodzaj}: ${spr.zakres} <br />` : ''
			})
			document.querySelector('#jutro-sprawdziany').innerHTML = j.sprawdziany.length === 19 ? 'Brak sprawdzianów' : j.sprawdziany
		}
		return client.praceDomowe(new Date())
	}).then(zadania => {
		console.log('pulpit: zadania', zadania)
		zadania.ListK.forEach(zadanie => {
			d.zadania += zadanie.dataO === d.jsondate ? `${zadanie.przed}: ${zadanie.tytul} <br />` : ''
			j.zadania += zadanie.dataO === j.jsondate ? `${zadanie.przed}: ${zadanie.tytul} <br />` : ''
		})

		document.querySelector('#dzisiaj-zadania').innerHTML = d.zadania.length === 15 ? 'Brak zadań domowych' : d.zadania
		document.querySelector('#jutro-zadania').innerHTML = j.zadania.length === 15 ? 'Brak zadań domowych' : j.zadania
		return client.wydarzenia()
	}).then(wydarzenia => {
		console.log('pulpit: wydarzenia', wydarzenia)
		wydarzenia.ListK.forEach(wydarzenie => {
			d.wydarzenia += wydarzenie.data === d.jsondate ? wydarzenie.info : ''
			j.wydarzenia += wydarzenie.data === j.jsondate ? wydarzenie.info : ''
		})
		document.querySelector('#dzisiaj-wydarzenia').innerHTML = d.wydarzenia.length === 18 ? 'Brak wydarzeń' : d.wydarzenia
		document.querySelector('#jutro-wydarzenia').innerHTML = j.wydarzenia.length === 18 ? 'Brak wydarzeń' : j.wydarzenia
	}).catch(err => handleError(err, 'pulpit'))
}

function plan(date){
	loadPage('plan')
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
				plan(new Date(picker.get('select', 'yyyy/mm/dd')))
			}
		}
	})
	var picker = $input.pickadate('picker')
	var lekcje = []
	client.plan(typeof date === 'object' ? date : new Date()).then(plan => {
		console.log('plan', plan)
		var descBase = '<span style="color: #ff3300">'
		plan.Przedmioty.forEach(lekcja => {
			var tmp = []
			tmp.push(lekcja.Nazwa.length < 15 ? lekcja.Nazwa : lekcja.Skrot)
			switch(lekcja.TypZastepstwa){
				case 0:
					tmp.push(descBase + 'Odwołane</span>')
					break
				case 1:
					tmp.push(descBase + 'Zastępstwo')
					tmp.push(`(${lekcja.NauZastepujacy})</span>`)
					break
				case 2:
					tmp.push(descBase + 'Zastępstwo')
					tmp.push(`(${lekcja.NauZastepujacy} - ${lekcja.PrzedmiotZastepujacy})</span>`)
					break
				case 3:
					tmp.push(descBase + 'Zastępstwo - inne')
					tmp.push(`(${lekcja.NauZastepujacy})</span>`)
					break
				case 4:
					tmp.push(descBase + 'Łączona')
					tmp.push(`(${lekcja.NauZastepujacy})</span>`)
					break
				case 5:
					tmp.push(descBase + 'Łączona - inna')
					tmp.push(`(${lekcja.NauZastepujacy} - ${lekcja.PrzedmiotZastepujacy})</span>`)
					break
			}
			if(typeof lekcje[lekcja.Godzina] !== 'object'){
				lekcje[lekcja.Godzina] = []
			}
			if(typeof lekcje[lekcja.Godzina][0] !== 'object'){
				lekcje[lekcja.Godzina][0] = plan.GodzinyLekcyjne[lekcja.Godzina].Poczatek + ' - ' + plan.GodzinyLekcyjne[lekcja.Godzina].Koniec
			}
			lekcje[lekcja.Godzina][lekcja.DzienTygodnia] = tmp.join('<br />')
		})
		var temp = ''
		lekcje.forEach(godzina => {
			temp += '<tr>'
			for(var i = 0; i < 6; i++){
				if(typeof godzina[i] === 'undefined'){
					temp += '<td></td>'
				} else {
					temp += '<td>' + godzina[i] + '</td>'
				}
			}
			temp += '</tr>'
		})
		document.querySelector('#table').innerHTML = temp
	}).catch(err => handleError(err, 'plan'))
}

function oceny(){
	loadPage('oceny')
	client.oceny().then(oceny => {
		console.log('oceny', oceny)
		data.oceny = oceny
		var temp = '', srednia = 0, sredniaCounter = 0
		oceny.Przedmioty.forEach(przedmiot => {
			temp += `
				<tr>
					<td>${przedmiot.Przedmiot}</td>
					<td>
			`
			przedmiot.Oceny.forEach(ocena => {
				if(ocena.Typ === 0){
					temp += `<a href="#!" style="color:#${ocena.Kolor}" onclick="Materialize.toast('`
					temp += `Ocena: ${ocena.Ocena}<br />Kategoria: ${ocena.Kategoria}<br />Waga: ${ocena.Waga}<br />Data: ${ocena.Data_wystaw}`
					temp += `', 5000)">${ocena.Ocena}&nbsp;</a>`
				}
			})
			temp += `
					</td>
					<td>${przedmiot.SrednieCaloroczne}</td>
					<td>${markToInt(parseInt(przedmiot.SrednieCaloroczne, 10))}</td>
				</tr>
			`
			srednia += markToInt(parseInt(przedmiot.SrednieCaloroczne, 10))
			sredniaCounter++
		})
		srednia = Math.round(srednia / sredniaCounter * 100) / 100
		data.ocenyRendered = temp
		document.querySelector('#table').innerHTML = temp
		document.querySelector('#srednia').innerHTML += srednia
	}).catch(err => handleError(err, 'oceny'))
}

function oceny_filter(filter){
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

function oceny_wszystkie(){
	document.querySelector('#table').innerHTML = data.ocenyRendered
}

function zadania(){
	loadPage('zadania')
	client.praceDomowe(new Date()).then(zadania => {
		var temp = ''
		console.log('zadania', zadania)
		data.zadania = zadania
		zadania.ListK.forEach(zadanie => {
			if(new Date(zadanie.dataO) > new Date()){
				temp += `
					<tr>
						<td>${zadanie.przed}</td>
						<td>${zadanie.dataZ}</td>
						<td>${zadanie.dataO}</td>
						<td>
							<a href="javascript:zadanie(${zadanie._recordId})">${zadanie.tytul}</a>
						</td>
					</tr>
				`
			}
		})
		if(temp.length === 0){
			temp += `
				<tr>
					<td colspan="4" style="text-align: center">Brak zadań domowych</td>
				</tr>
			`
		}
		data.zadaniaRendered = temp
		document.querySelector('#table').innerHTML = temp
	}).catch(err => handleError(err, 'zadania'))
}

function zadania_wszystkie(){
	var temp = ''
	data.zadania.ListK.forEach(zadanie => {
		temp += `
			<tr>
				<td>${zadanie.przed}</td>
				<td>${zadanie.dataZ}</td>
				<td>${zadanie.dataO}</td>
				<td>
					<a href="javascript:zadanie(${zadanie._recordId})">${zadanie.tytul}</a>
				</td>
			</tr>
		`
	})
	if(temp.length === 0){
		temp += `
			<tr>
				<td colspan="4" style="text-align: center">Brak zadań domowych</td>
			</tr>
		`
	}
	document.querySelector('#table').innerHTML = temp
}

function zadania_nadchodzace(){
	document.querySelector('#table').innerHTML = data.zadaniaRendered
}

function zadanie(recordID){
	client.pracaDomowa(recordID).then(zadanie => {
		console.log('zadanie', zadanie)
		zadanie = zadanie.praca
		document.querySelector('#zadanie').innerHTML = `
			<h4>${zadanie.tytul}</h4><br />
			Przedmiot: ${zadanie.przedNazwa}<br />
			Data zadania: ${zadanie.dataZ}<br />
			Treść: ${zadanie.tresc.replace('\n', '<br />')}
		`
		$('#zadanie-modal').modal()
		$('#zadanie-modal').modal('open')
	}).catch(err => handleError(err, 'zadania'))
}

function uwagi(){
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

function uwagi_filter(filter){
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

function uwagi_wszystkie(){
	document.querySelector('#table').innerHTML = data.uwagiRendered
}

function sprawdziany(date){
	loadPage('sprawdziany')
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
				sprawdziany(new Date(picker.get('select', 'yyyy/mm/dd')))
			}
		}
	})
	var picker = $input.pickadate('picker')
	client.sprawdziany(typeof date === 'object' ? date : new Date()).then(sprawdziany => {
		console.log('sprawdziany', sprawdziany)
		var temp = ''
		sprawdziany.ListK.forEach(sprawdzian => {
			temp += `
				<tr>
					<td style="white-space: nowrap;">${sprawdzian.data}</td>
					<td>${sprawdzian.przedmiot}</td>
					<td style="white-space: nowrap;">${sprawdzian.rodzaj}</td>
					<td>${sprawdzian.zakres}</td>
				</tr>
			`
		})
		if(temp.length === 0){
			temp += `
				<tr>
					<td colspan="4" style="text-align: center">Brak sprawdzianów w tym miesiącu</td>
				</tr>
			`
		}
		document.querySelector('#table').innerHTML = temp
	}).catch(err => handleError(err, 'sprawdziany'))
}

function komunikator(tryb){
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

function wiadomosc(id){
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

function napisz(){
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

function napisz_fullList(){
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

function nowa(id, nazwa){
	document.querySelector('#napisz-odbiorca').value = nazwa
	document.querySelector('#napisz-odbiorca-id').value = id
	$('#modal').modal()
	$('#modal').modal('open')
}

function wyslij(){
	client.wyslij(
		document.querySelector('#napisz-odbiorca-id').value,
		document.querySelector('#napisz-temat').value,
		document.querySelector('#napisz-tresc').value,
		document.querySelector('#napisz-potwierdzenie').checked
	).then(m => console.log('wyslij', m)).catch(err => handleError(err, 'komunikator'))
}

function obecnosci(date){
	loadPage('obecnosci')
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
				obecnosci(new Date(picker.get('select', 'yyyy/mm/dd')))
			}
		}
	})
	var picker = $input.pickadate('picker')
	var date = typeof date === 'object' ? date : new Date()
	var temp = ''
	var miesiac = []
	var offset = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
	if(offset === 0){
		offset = 7
	} else {
		offset--
	}
	for(var i = 0; i < offset; i++){
		miesiac.push({godziny: [], dzien: 0})
	}
	client.obecnosci(date).then(obecnosci => {
		console.log(obecnosci)
		obecnosci.Obecnosci.forEach(lekcja => {
			switch(lekcja.TypObecnosci){
				case 'T':
					var color = '#CCFFCC' // zielony
					break
				case 'N':
					var color = '#FFAD99' // czerwony
					break
				case 'F':
				case 'B':
					var color = '#E3E3E3' // szary
					break
				case 'S':
					var color = '#FFFFAA' // żółty
					break
				case 'U':
					var color = '#FFE099' // pomarańczowy
					break
				case 'Z':
					var color = '#A8BEFF' // niebieski
					break
				case 'ZO':
					var color = '#FF69B4' // fioletowy
					break
			}
			if(typeof miesiac[lekcja.Dzien - 1 + offset] !== 'object'){
				miesiac[lekcja.Dzien - 1 + offset] = {godziny: [], dzien: lekcja.Dzien}
			}
			miesiac[lekcja.Dzien - 1 + offset].godziny[lekcja.Godzina-1] = {
				opis: `${lekcja.Przedmiot}`,
				color: color
			}
		})
		console.log(miesiac)
		for(var j = 0; j < miesiac.length; j += 7){
			temp += '<tr>'
			miesiac.slice(j, j+7).forEach(dzien => {
				if(dzien.dzien !== 0){
					temp += `<td style="vertical-align: top">${date.getFullYear()}-${date.getMonth()+1}-${dzien.dzien}<ul class="collection">`
					for(var k = 0; k < dzien.godziny.length; k++){
						var godzina = dzien.godziny[k]
						if(typeof godzina === 'undefined'){
							temp += `<li class="collection-item">&nbsp;</li>`
						} else {
							temp += `<li class="collection-item" style="background-color: ${godzina.color}; white-space: nowrap;">${godzina.opis}</li>`
						}
					}
					temp += '</ul></td>'
				} else {
					temp += '<td></td>'
				}
			})
			temp += '</tr>'
		}
		document.querySelector('#table').innerHTML = temp
	}).catch(err => handleError(err, 'obecnosci'))
}


function markToInt(ocena){
	if(ocena >= 95) return 6
	if(ocena >= 85) return 5
	if(ocena >= 70) return 4
	if(ocena >= 50) return 3
	if(ocena >= 35) return 2
	return 1
}

function handleError(err, page){
	if(err.toString().includes('Unauthorized')){
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

function loadPage(page){
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