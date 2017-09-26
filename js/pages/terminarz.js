const dni = [
	'poniedzialek',
	'wtorek',
	'sroda',
	'czwartek',
	'piatek'
]
const obecnosci = [
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
]
const opisy = lekcja => {
		return [
			'Odwołane',
			`Zastępstwo (${lekcja.NauZastepujacy})`,
			`Zastępstwo (${lekcja.NauZastepujacy} - ${lekcja.PrzedmiotZastepujacy})`,
			`Zastępstwo - inne (${lekcja.NauZastepujacy})`,
			`Łączona (${lekcja.NauZastepujacy})`,
			`Łączona - inna (${lekcja.NauZastepujacy} - ${lekcja.PrzedmiotZastepujacy})`
		][lekcja.TypZastepstwa]
    }
const godziny = (plan, lekcja) => {
	return plan.GodzinyLekcyjne[lekcja.Godzina].Poczatek + ' - ' + plan.GodzinyLekcyjne[lekcja.Godzina].Koniec
}

module.exports = (date) => {
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
				module.exports(new Date(picker.get('select', 'yyyy/mm/dd')))
			}
		}
	})
	var picker = $input.pickadate('picker')
	var date = typeof date === 'object' ? date : new Date()
	var jsondate = date
	jsondate.setHours(jsondate.getHours() + jsondate.getTimezoneOffset() / 60)
	jsondate = jsondate.toJSON().split('T')[0]
	var tydzien = dni.map(d => {
		return {nazwa: d, lekcje: []}
	})
	client.plan(date).then(plan => {
		console.log('terminarz: plan', plan)
		plan.Przedmioty.forEach(lekcja => {
			lekcja.godziny = godziny(plan, lekcja)
			lekcja.nazwa = lekcja.TypZastepstwa === -1 ? lekcja.Nazwa : '<span class="strike">' + lekcja.Nazwa + '</span>'
			lekcja.zastepstwo = lekcja.TypZastepstwa !== -1 ? '(<span style="color: #f30; float: right">' + opisy(lekcja) + '</span>)' : ''
			tydzien[lekcja.DzienTygodnia - 1].lekcje.push(lekcja)
		})
		Materialize.toast("Pobrano plan lekcji!", 1000)
		return client.obecnosci(date)
	}).then(obecnosci => {
		console.log('terminarz: obecnosci', obecnosci)
		obecnosci.Obecnosci.forEach(obecnosc => {
			tydzien[obecnosc.DzienTygodnia - 1].data = obecnosc.Data.split(' ')[0]
			tydzien[obecnosc.DzienTygodnia - 1].lekcje.find(el => {
				return el.Godzina == obecnosc.Godzina
			}).obecnosc = obecnosc.TypObecnosci !== 0 ? obecnosci[obecnosc.TypObecnosci] : ''
		})
		Materialize.toast("Pobrano obecności!", 1000)
		return client.praceDomowe(date)
	}).then(zadania => {
		console.log('terminarz: zadania', zadania)
		zadania.ListK.forEach(zadanie => {
			tydzien.forEach(dzien => {
				if (dzien.data === zadanie.dataO) {
					client.pracaDomowa(zadanie._recordId).then(zadanie_full => {
						var {tytul, tresc} = zadanie_full.praca
						var lekcja = dzien.lekcje.find(element => {
							return element.Nazwa == zadanie.przed
						})
						lekcja.zadanie = {tytul: tytul, tresc: tresc}
						lekcja.collapsible = true
					})
				}
			})
		})
		Materialize.toast("Pobrano zadania domowe!", 1000)
		return client.sprawdziany(date)
	}).then(sprawdziany => {
		console.log('terminarz: sprawdziany', sprawdziany)
		sprawdziany.ListK.forEach(sprawdzian => {
			tydzien.forEach(dzien => {
				if (dzien.data === sprawdzian.data) {
					var {rodzaj, zakres} = sprawdzian
					var lekcja = dzien.lekcje.find(element => {
						return element.Nazwa == sprawdzian.przedmiot
					})
					lekcja.sprawdzian = {rodzaj: rodzaj, zakres: zakres}
					lekcja.collapsible = true
				}
			})
		})
		var app = new Vue({
			el: '#app',
			data: () => { return {
				tydzien: tydzien
			}}
		})
		$('ul.tabs').tabs()
		$('.collapsible').collapsible()
	}).catch(err => { handleError(err, 'terminarz') })
}

Vue.component('dzien', {
	props: ['dzien'],
	template: `
		<div :id="dzien.nazwa + '-tab'" class="col s12">
			<h5 :id="dzien.nazwa + '-data'">{{ dzien.data }}</h5>
			<ul :id="dzien.nazwa" class="collapsible">
				<lekcja v-for="lekcja in dzien.lekcje" :lekcja="lekcja" :key="lekcja.Godzina" />
			</ul>
		</div>
	`
})

Vue.component('lekcja', {
    props: ['lekcja'],
    template: `
		<li>
			<div class="collapsible-header" :data-godzina="lekcja.Godzina" :data-nazwa="lekcja.Nazwa">
				{{ lekcja.Godzina }}. {{ lekcja.nazwa }} {{ lekcja.zastepstwo }}<br />
				<i class="icon">person</i> <span style="color: #aaa">{{ lekcja.Nauczyciel }}</span><br />
				<i class="icon">access_time</i> <span style="color: #06f">{{ lekcja.godziny }}</span>
				<div v-if="lekcja.obecnosc">
					<br /><span style="color: #f30">{{ lekcja.obecnosc }}</span>
				</div>
				<div v-if="lekcja.zadanie">
					<br /><i class="icon">home</i> <span style="color: #f30">{{ lekcja.zadanie.tytul }}</span>
				</div>
				<div v-if="lekcja.sprawdzian">
					<br /><i class="icon">assignment</i> <span style="color: #f30">{{ lekcja.sprawdzian.rodzaj }}</span>
				</div>
			</div>
			<div v-if="lekcja.collapsible" class="collapsible-body">
				<zadanie v-if="lekcja.zadanie" :zadanie="lekcja.zadanie" />
				<sprawdzian v-if="lekcja.sprawdzian" :sprawdzian="lekcja.sprawdzian" />
			</div>
		</li>
    `
})

Vue.component('zadanie', { props: ['zadanie'], template: `<collapsible-tresc icon="home" :title="zadanie.tytul" :content="zadanie.tresc" />`})

Vue.component('sprawdzian', { props: ['sprawdzian'], template: `<collapsible-tresc icon="assignment" :title="sprawdzian.rodzaj" :content="sprawdzian.zakres" />`})

Vue.component('collapsible-tresc', { props: ['icon', 'title', 'content'], template: `<div><i class="glyph">{{ icon }}</i> <span style="font-size: 150%">{{ title }}</span><br />{{ content }}<br /></div>`})