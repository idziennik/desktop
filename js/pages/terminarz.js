const opisyObecnosci = obecnosc => '<span style="color: #f30">' + [
    'obecny',
    'nieobecność usprawiedliwiona',
    'spóźnienie',
    'nieobecność nieusprawiedliwiona',
    'zwolnienie',
    'zajęcia nie odbyły się',
    '', // nie wiem dlaczego, ale 6 jest pominięte
    'ferie',
    'wycieczka',
    'zwolniony / obecny'
][obecnosc.TypObecnosci] + '</span>'

const opisyZastepstw = lekcja => '<span style="color: #f30; float: right">' + [
	'Odwołane',
	`Zastępstwo (${lekcja.NauZastepujacy})`,
	`Zastępstwo (${lekcja.NauZastepujacy} - ${lekcja.PrzedmiotZastepujacy})`,
	`Zastępstwo - inne (${lekcja.NauZastepujacy})`,
	`Łączona (${lekcja.NauZastepujacy})`,
	`Łączona - inna (${lekcja.NauZastepujacy} - ${lekcja.PrzedmiotZastepujacy})`
][lekcja.TypZastepstwa] + '</span>'

const godziny = (plan, lekcja) => {
	return plan.GodzinyLekcyjne[lekcja.Godzina].Poczatek + ' - ' + plan.GodzinyLekcyjne[lekcja.Godzina].Koniec
}

const ne = s => s ? s : ''

module.exports = (date) => {
	loadPage('terminarz')
	var picker = new M.Datepicker(document.querySelector('#date'), {
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
		onSelect: date => {
			module.exports(date)
		}
	})
	var date = typeof date === 'object' ? date : new Date()
	var jsondate = date
	jsondate.setHours(jsondate.getHours() + jsondate.getTimezoneOffset() / 60)
	jsondate = jsondate.toJSON().split('T')[0]
	var tydzien = ['poniedzialek', 'wtorek', 'sroda', 'czwartek', 'piatek'].map(d => {
		return {nazwa: d, lekcje: [], html: ''}
	})
	client.plan(date).then(plan => {
		console.log('terminarz: plan', plan)
		plan.Przedmioty.forEach(lekcja => {
			lekcja.godziny = godziny(plan, lekcja)
			lekcja.nazwa = lekcja.TypZastepstwa !== -1 ? '<span class="strike">' + lekcja.Nazwa + '</span>' : lekcja.Nazwa
			lekcja.zastepstwo = lekcja.TypZastepstwa !== -1 ? opisyZastepstw(lekcja) : ''
			tydzien[lekcja.DzienTygodnia - 1].lekcje.push(lekcja)
		})
		M.toast({html: "Pobrano plan lekcji!", displayLength: 1000})
		return client.obecnosci(date, true)
	}).then(obecnosci => {
		console.log('terminarz: obecnosci', obecnosci)
		obecnosci.Obecnosci.forEach(obecnosc => {
			var dzien = tydzien[obecnosc.DzienTygodnia - 1]
			dzien.data = obecnosc.Data.split(' ')[0]
			dzien.lekcje.find(el => el.Godzina == obecnosc.Godzina).obecnosc = obecnosc.TypObecnosci !== 0 ? opisyObecnosci(obecnosc) : ''
		})
		M.toast({html: "Pobrano obecności!", displayLength: 1000})
		return client.praceDomowe(date)
	}).then(zadania => {
		console.log('terminarz: zadania', zadania)
		zadania.ListK.forEach(zadanie => {
			tydzien.forEach(dzien => {
				if (dzien.data === zadanie.dataO) {
					client.pracaDomowa(zadanie._recordId).then(zadanie_full => {
						var lekcja = dzien.lekcje.find(el => el.Nazwa == zadanie.przed)
						lekcja.zadanie = zadanie_full.praca
						lekcja.collapsible = true
					})
				}
			})
		})
		M.toast({html: "Pobrano zadania domowe!", displayLength: 1000})
		return client.sprawdziany(date)
	}).then(sprawdziany => {
		console.log('terminarz: sprawdziany', sprawdziany)
		sprawdziany.ListK.forEach(sprawdzian => {
			tydzien.forEach(dzien => {
				if (dzien.data === sprawdzian.data) {
					var lekcja = dzien.lekcje.find(el => el.Nazwa == sprawdzian.przedmiot)
					lekcja.sprawdzian = sprawdzian
					lekcja.collapsible = true
				}
			})
		})

		document.querySelector('#app').innerHTML += tydzien.map(Dzien).join('')
		new M.Tabs(document.querySelector('ul.tabs'))
		document.querySelectorAll('.collapsible').forEach(el => new M.Collapsible(el))
	}).catch(err => { handleError(err, 'terminarz') })
}

const Dzien = dzien => `
	<div id="${dzien.nazwa}-tab" class="col s12">
		<h5 id="${dzien.nazwa}-data">${dzien.data}</h5>
		<ul id="${dzien.nazwa}" class="collapsible">
			${dzien.lekcje.map(Lekcja).join('')}
		</ul>
	</div>
`

const Lekcja = lekcja => `
	<li>
		<div class="collapsible-header" data-godzina="${lekcja.Godzina}" data-nazwa="${lekcja.Nazwa}">
			${lekcja.Godzina}. ${lekcja.nazwa} ${lekcja.zastepstwo}<br />
			<i class="icon">person</i> <span style="color: #aaa">${lekcja.Nauczyciel}</span><br />
			<i class="icon">access_time</i> <span style="color: #06f">${lekcja.godziny}</span>
			${lekcja.obecnosc ? lekcja.obecnosc : ''}
			${lekcja.zadanie ? 
				`<br /><i class="icon">home</i> <span style="color: #f30">${lekcja.zadanie.tytul}</span>` : ''
			}
			${lekcja.sprawdzian ? 
				`<br /><i class="icon">assignment</i> <span style="color: #f30">${lekcja.sprawdzian.rodzaj}</span>` : ''
			}
		</div>
		${lekcja.collapsible ? 
			`<div class="collapsible-body">${lekcja.zadanie ? Zadanie(lekcja.zadanie) : ''}${lekcja.sprawdzian ? Sprawdzian(lekcja.sprawdzian) : ''}</div>` : ''
		}
	</li>
`

const Zadanie = zadanie => Tresc({icon: 'home', title: zadanie.tytul, content: zadanie.tresc})
const Sprawdzian = sprawdzian => Tresc({icon: 'assignment', title: sprawdzian.rodzaj, content: sprawdzian.zakres})
const Tresc = options => `<div><i class="glyph">${options.icon}</i> <span style="font-size: 150%">${options.title}</span><br />${options.content}<br /></div>`