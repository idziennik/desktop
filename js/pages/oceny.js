module.exports = (filter, query) => {
	loadPage('oceny')
	if (typeof data.oceny !== 'undefined') {
		handler(data.oceny, filter, query)
		return
	}
	client.oceny().then(handler).catch(err => handleError(err, 'oceny'))
}

function handler (oceny, filter, query) {
	console.log('oceny', oceny)
	data.oceny = oceny
	var przedmioty = [], srednia = 0, sredniaCounter = 0
	oceny.Przedmioty.forEach(przedmiot => {
		przedmiot.oceny = []
		przedmiot.srednia = przedmiot.SrednieCaloroczne === "" ? 'brak ocen' : markToInt(parseInt(przedmiot.SrednieCaloroczne, 10))
		przedmiot.Oceny.forEach(ocena => {
			if (ocena.Typ === 0) {
				ocena.toast = `Materialize.toast('Ocena: ${ocena.Ocena}<br />Kategoria: ${ocena.Kategoria}<br />Waga: ${ocena.Waga}<br />Data: ${ocena.Data_wystaw}', 5000)`
				ocena.style = `color: #${ocena.Kolor}`
				if (typeof filter === 'string') {
					if (filter === 'ostatniMiesiac' && Math.abs(new Date() - new Date(ocena.Data_wystaw.replace(/-/g, '/'))) < 2678400000)
						przedmiot.oceny.push(ocena)
					if (filter === 'szukaj') {
						var kategoria = ocena.Kategoria.toLowerCase()
						var ocenaString = ocena.Ocena.toLowerCase()
						if (kategoria.includes(query) || ocenaString.includes(query)) {
							przedmiot.oceny.push(ocena)
						}
					}
				} else {
					przedmiot.oceny.push(ocena)
				}
			}
		})
		if (typeof przedmiot.srednia !== 'string') {
			srednia += markToInt(parseInt(przedmiot.SrednieCaloroczne, 10))
			sredniaCounter++
		}
		przedmioty.push(przedmiot)
	})
	srednia = srednia !== 0 ? Math.round(srednia / sredniaCounter * 100) / 100 : 'brak ocen'
	var table = new Vue({
		el: '#table',
		data: () => { return {przedmioty: przedmioty} }
	})
	var srednia = new Vue({
		el: '#srednia',
		data: () => { return {srednia: srednia} }
	})
}

Vue.component('ocena', {
	props: ['ocena'],
	template: `
		<a href="#!" :style="ocena.style" :onclick="ocena.toast">
			{{ ocena.Ocena }}&nbsp;
		</a>
	`
})

Vue.component('przedmiot', {
	props: ['przedmiot'],
	template: `
		<tr>
			<td>{{ przedmiot.Przedmiot }}</td>
			<td>
				<ocena v-for="ocena in przedmiot.oceny" :ocena="ocena" :key="ocena.idK"/>
			</td>
			<td>{{ przedmiot.SrednieCaloroczne }}</td>
			<td>{{ przedmiot.srednia }}</td>
		</tr>
	`
})

function markToInt (ocena) {
	if(ocena >= 95) return 6
	if(ocena >= 85) return 5
	if(ocena >= 70) return 4
	if(ocena >= 50) return 3
	if(ocena >= 35) return 2
	return 1
}