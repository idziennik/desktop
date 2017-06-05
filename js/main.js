var client, container, data
const idziennik = require('idziennik');
const fs = require('fs');
const cryptojs = require('crypto-js');
const path = require('path');

$(() => {
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
	
	var d = {lekcje: {arr: []}, sprawdziany: {arr: []}, zadania: {arr: []}, wydarzenia: {arr: []}}
	var j = {lekcje: {arr: []}, sprawdziany: {arr: []}, zadania: {arr: []}, wydarzenia: {arr: []}}

	client.plan(new Date()).then(plan => {
		d.dzien = new Date().getDay() === 0 ? 7 : new Date().getDay()
		j.dzien = d.dzien === 7 ? 0 : d.dzien + 1
		plan.Przedmioty.forEach(lekcja => {
			if(lekcja.DzienTygodnia === d.dzien){
				if(lekcja.TypZastepstwa !== -1){
					d.lekcje.arr.push(`<span style="text-decoration: line-through">${lekcja.Godzina}. ${lekcja.Nazwa}</span>`)
				} else {
					d.lekcje.arr.push(`${lekcja.Godzina}. ${lekcja.Nazwa}`)
				}
			}
			if(d.dzien !== 7 && lekcja.DzienTygodnia === j.dzien){
				if(lekcja.TypZastepstwa !== -1){
					j.lekcje.arr.push(`<span style="text-decoration: line-through">${lekcja.Godzina}. ${lekcja.Nazwa}</span>`)
				} else {
					j.lekcje.arr.push(`${lekcja.Godzina}. ${lekcja.Nazwa}`)
				}
			}
		})
		if(d.lekcje.arr.length !== 0){
			d.lekcje.arr.push('')
			document.querySelector('#dzisiaj-plan').innerHTML = 'Lekcje: <br />' + d.lekcje.arr.join('<br />')
		}
		if(d.dzien === 7){
			// Trzeba powtórzyć żądanie żeby pobrać plan na następny dzień (poniedziałek)
			return client.plan(new Date(new Date().getTime()+86400000))
		} else {
			if(j.lekcje.arr.length !== 0){
				j.lekcje.arr.push('')
				document.querySelector('#jutro-plan').innerHTML = 'Lekcje: <br />' + j.lekcje.arr.join('<br />')
			}
			return false
		}
	}).then(plan => {
		if(plan){
			plan.Przedmioty.forEach(lekcja => {
				if(lekcja.DzienTygodnia === j.dzien){
					if(lekcja.TypZastepstwa !== -1){
						j.lekcje.arr.push(`<span style="text-decoration: line-through">${lekcja.Godzina}. ${lekcja.Nazwa}</span>`)
					} else {
						j.lekcje.arr.push(`${lekcja.Godzina}. ${lekcja.Nazwa}`)
					}
				}
			})
			if(j.lekcje.arr.length !== 0){
				j.lekcje.arr.push('')
				document.querySelector('#jutro-plan').innerHTML = 'Lekcje: <br />' + j.lekcje.arr.join('<br />')
			}
		}
		return client.sprawdziany(new Date())
	}).then(sprawdziany => {
		d.date = new Date()
		d.date.setHours(d.date.getHours() - d.date.getTimezoneOffset() / 60)
		j.date = new Date(new Date().getTime()+86400000)
		j.date.setHours(j.date.getHours() - j.date.getTimezoneOffset() / 60)
		sprawdziany.ListK.forEach(sprawdzian => {
			if(sprawdzian.data === d.date.toJSON().split('T')[0]){
				d.sprawdziany.arr.push(`${sprawdzian.rodzaj} - ${sprawdzian.rodzaj}: ${sprawdzian.zakres}`)
			}
			if(sprawdzian.data === j.date.toJSON().split('T')[0]){
				j.sprawdziany.arr.push(`${sprawdzian.rodzaj} - ${sprawdzian.rodzaj}: ${sprawdzian.zakres}`)
			}
		})
		if(d.sprawdziany.arr.length !== 0){
			document.querySelector('#dzisiaj-sprawdziany').innerHTML = 'Sprawdziany: <br />' + d.sprawdziany.arr.join('<br />')
		}
		if(j.date.getDate() === 1){
			return client.sprawdziany(j.date)
		} else {
			if(j.sprawdziany.arr.length !== 0){
				document.querySelector('#jutro-sprawdziany').innerHTML = 'Sprawdziany: <br />' + j.sprawdziany.arr.join('<br />')
			}
			return false
		}
	}).then(sprawdziany => {
		if(sprawdziany){
			sprawdziany.ListK.forEach(sprawdzian => {
				if(sprawdzian.data === d.date.toJSON().split('T')[0]){
					d.sprawdziany.arr.push(`${sprawdzian.rodzaj} - ${sprawdzian.rodzaj}: ${sprawdzian.zakres}`)
				}
				if(sprawdzian.data === j.date.toJSON().split('T')[0]){
					j.sprawdziany.arr.push(`${sprawdzian.rodzaj} - ${sprawdzian.rodzaj}: ${sprawdzian.zakres}`)
				}
			})
			if(j.sprawdziany.arr.length !== 0){
				document.querySelector('#jutro-sprawdziany').innerHTML = 'Sprawdziany: <br />' + j.sprawdziany.arr.join('<br />')
			}
		}
		return client.praceDomowe(new Date())
	}).then(zadania => {
		zadania.ListK.forEach(zadanie => {
			if(zadanie.dataO === d.date.toJSON().split('T')[0]){
				d.zadania.arr.push(`${zadanie.przed}: ${zadanie.tytul}`)
			}
			if(zadanie.dataO === j.date.toJSON().split('T')[0]){
				j.zadania.arr.push(`${zadanie.przed}: ${zadanie.tytul}`)
			}
		})
		if(d.zadania.arr.length !== 0){
			document.querySelector('#dzisiaj-zadania').innerHTML = 'Zadania: <br />' + d.zadania.arr.join('<br />')
		}
		if(j.zadania.arr.length !== 0){
			document.querySelector('#jutro-zadania').innerHTML = 'Zadania: <br />' + j.zadania.arr.join('<br />')
		}
		return client.wydarzenia()
	}).then(wydarzenia => {
		wydarzenia.ListK.forEach(wydarzenie => {
			if(wydarzenie.data === d.date.toJSON().split('T')[0]){
				d.wydarzenia.arr.push(wydarzenie.info)
			}
			if(wydarzenie.data === j.date.toJSON().split('T')[0]){
				j.wydarzenia.arr.push(wydarzenie.info)
			}
		})
		if(d.wydarzenia.arr.length !== 0){
			document.querySelector('#dzisiaj-wydarzenia').innerHTML = 'Wydarzenia: <br />' + d.wydarzenia.arr.join('<br />')
		}
		if(j.wydarzenia.arr.length !== 0){
			document.querySelector('#jutro-wydarzenia').innerHTML = 'Wydarzenia: <br />' + j.wydarzenia.arr.join('<br />')
		}
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
		document.querySelector('#plan').innerHTML += temp
	}).catch(err => handleError(err, 'plan'))
}

function oceny(){
	loadPage('oceny')
	client.oceny().then(oceny => {
		data.oceny = oceny
		var srednia = 0, sredniaCounter = 0
		var temp = ''
		oceny.Przedmioty.forEach(przedmiot => {
			var tmp = []
			przedmiot.Oceny.forEach(ocena => {
				var desc = `Ocena: ${ocena.Ocena}<br />Kategoria: ${ocena.Kategoria}<br />Waga: ${ocena.Waga}<br />Data: ${ocena.Data_wystaw}`
				if(ocena.Typ === 0){
					tmp.push(`<a href="#!" style="color:#${ocena.Kolor}" onclick="Materialize.toast('${desc}', 5000)">${ocena.Ocena}</a>`)
				}
			})

			temp += `
				<tr>
					<td>${przedmiot.Przedmiot}</td>
					<td>${tmp.join(' ')}</td>
					<td>${przedmiot.SrednieCaloroczne}</td>
					<td>${markToInt(parseInt(przedmiot.SrednieCaloroczne, 10))}</td>
				</tr>
			`

			srednia += markToInt(parseInt(przedmiot.SrednieCaloroczne, 10))
			sredniaCounter++
		})
		srednia = Math.round(srednia / sredniaCounter * 100) / 100
		data.ocenyRendered = temp
		document.querySelector('#oceny').innerHTML = temp
		document.querySelector('#srednia').innerHTML += srednia
	}).catch(err => handleError(err, 'oceny'))
}

function oceny_filter(filter){
	var temp = ''
	var query = filter === 'szukaj' ? document.querySelector('#szukaj').value : undefined
	data.oceny.Przedmioty.forEach(przedmiot => {
		var tmp = []
		przedmiot.Oceny.forEach(ocena => {
			var desc = `Ocena: ${ocena.Ocena}<br />Kategoria: ${ocena.Kategoria}<br />Waga: ${ocena.Waga}<br />Data: ${ocena.Data_wystaw}`
			if(ocena.Typ === 0){
				switch(filter){
					case 'ostatniMiesiac': 
						if(Math.abs(new Date() - new Date(ocena.Data_wystaw.replace(/-/g, '/'))) < 2678400000){
							tmp.push(`<a href="#!" style="color:#${ocena.Kolor}" onclick="Materialize.toast('${desc}', 5000)">${ocena.Ocena}</a>`)
						}
						break
					case 'szukaj':
						if(ocena.Kategoria.toLowerCase().includes(query.toLowerCase()) || ocena.Ocena.toLowerCase().includes(query.toLowerCase())){
							tmp.push(`<a href="#!" style="color:#${ocena.Kolor}" onclick="Materialize.toast('${desc}', 5000)">${ocena.Ocena}</a>`)
						}
						break

				}
			}
		})
		temp += `
			<tr>
				<td>${przedmiot.Przedmiot}</td>
				<td>${tmp.join(' ')}</td>
				<td>${przedmiot.SrednieCaloroczne}</td>
				<td>${markToInt(parseInt(przedmiot.SrednieCaloroczne, 10))}</td>
			</tr>
		`
	})
	document.querySelector('#oceny').innerHTML = temp
}

function oceny_wszystkie(){
	document.querySelector('#oceny').innerHTML = data.ocenyRendered
}

function zadania(){
	loadPage('zadania')
	var temp = `
	<tr>
		<th>Przedmiot</th>
		<th>Data zadania</th>
		<th>Data oddania</th>
		<th>Tytuł</th>
	</tr>
	`
	client.praceDomowe(new Date()).then(zadania => {
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
		if(temp.length === 101){
			temp += `
				<tr>
					<td colspan="4" style="text-align: center">Brak zadań domowych</td>
				</tr>
				`
		}
		data.zadaniaRendered = temp
		document.querySelector('#zadania').innerHTML = temp
	})
}

function zadania_wszystkie(){
	var temp = '<tr><th>Przedmiot</th><th>Data zadania</th><th>Data oddania</th><th>Tytuł</th></tr>'
	data.zadania.ListK.forEach(zadanie => {
		temp += '<tr>'
		temp += '<td>' + zadanie.przed + '</td>'
		temp += '<td>' + zadanie.dataZ + '</td>'
		temp += '<td>' + zadanie.dataO + '</td>'
		temp += `<td><a href="javascript:zadanie(${zadanie._recordId})">${zadanie.tytul}</a></td>`
		temp += '</tr>'
	})
	document.querySelector('#zadania').innerHTML = temp
}

function zadania_nadchodzace(){
	document.querySelector('#zadania').innerHTML = data.zadaniaRendered
}

function zadanie(recordID){
	client.pracaDomowa(recordID).then(zadanie => {
		zadanie = zadanie.praca
		document.querySelector('#zadanie').innerHTML = `
			<h4>${zadanie.tytul}</h4><br />
			Przedmiot: ${zadanie.przedNazwa}<br />
			Data zadania: ${zadanie.dataZ}<br />
			Treść: ${zadanie.tresc.replace('\n', '<br />')}
		`
		$('#zadanie-modal').modal()
		$('#zadanie-modal').modal('open')
	})
}

function uwagi(){
	loadPage('uwagi')
	var temp = '<tr><th>Data</th><th>Nauczyciel</th><th>Treść</th><th>Punkty</th></tr>'
	client.uwagi().then(uwagi => {
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
		document.querySelector('#uwagi').innerHTML = temp
		document.querySelector('#punkty').innerHTML += counter
	})
}

function uwagi_filter(filter){
	var temp = '<tr><th>Data</th><th>Nauczyciel</th><th>Treść</th><th>Punkty</th></tr>'
	data.uwagi.SUwaga.forEach(uwaga => {
		switch(uwaga.Typ){
			case 'o':
				if(filter === 'neutralne'){
					uwaga.color = 'rgb(255, 255, 214)'
					temp += `
						<tr style="background-color: ${uwaga.color};">
							<td style="white-space: nowrap;">${uwaga.Data}</td>
							<td style="white-space: nowrap;">${uwaga.Nauczyciel}</td>
							<td>${uwaga.Tresc}</td>
							<td>${uwaga.Punkty}</td>
						</tr>
					`
				}
				break
			case 'n':
				if(filter === 'nagany'){
					uwaga.color = 'rgb(255, 214, 214)'
					temp += `
						<tr style="background-color: ${uwaga.color};">
							<td style="white-space: nowrap;">${uwaga.Data}</td>
							<td style="white-space: nowrap;">${uwaga.Nauczyciel}</td>
							<td>${uwaga.Tresc}</td>
							<td>${uwaga.Punkty}</td>
						</tr>
					`
				}
				break
			case 'p':
				if(filter === 'pochwaly'){
					uwaga.color = 'rgb(214, 255, 214)'
					temp += `
						<tr style="background-color: ${uwaga.color};">
							<td style="white-space: nowrap;">${uwaga.Data}</td>
							<td style="white-space: nowrap;">${uwaga.Nauczyciel}</td>
							<td>${uwaga.Tresc}</td>
							<td>${uwaga.Punkty}</td>
						</tr>
					`
				}
				break
		}
	})
	document.querySelector('#uwagi').innerHTML = temp
}

function uwagi_wszystkie(){
	document.querySelector('#uwagi').innerHTML = data.uwagiRendered
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
	var temp = `
	<tr>
		<th>Data</th>
		<th>Przedmiot</th>
		<th>Rodzaj</th>
		<th>Zakres</th>
	</tr>
	`
	client.sprawdziany(typeof date === 'object' ? date : new Date()).then(sprawdziany => {
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
		if(temp.length === 88){
			temp += `
				<tr>
					<td colspan="4" style="text-align: center">Brak sprawdzianów w tym miesiącu</td>
				</tr>
				`
		}
		document.querySelector('#sprawdziany').innerHTML = temp
	})
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
	alert('Wystąpił błąd: ' + err)
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