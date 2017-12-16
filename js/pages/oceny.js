module.exports = (filter, query) => {
	loadPage('oceny')
	if (typeof data.oceny !== 'undefined' && filter) {
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
		przedmiot.srednia = przedmiot.SrednieCaloroczne === '' ? 'brak ocen' : markToInt(parseInt(przedmiot.SrednieCaloroczne, 10))
		przedmiot.Oceny.forEach(ocena => {
			if (ocena.Typ !== 0) return
			ocena.toast = `M.toast({html: 'Ocena: ${ocena.Ocena}<br />Kategoria: ${ocena.Kategoria}<br />Waga: ${ocena.Waga}<br />Data: ${ocena.Data_wystaw}', displayLength: 5000})`
			ocena.style = `color: #${ocena.Kolor}`
			if (filter && filter !== 'all') {
				if (
					(filter === 'ostatniMiesiac' && Math.abs(new Date() - new Date(ocena.Data_wystaw.replace(/-/g, '/'))) < (1000 * 60 * 60 * 24 * 31)) ||
					(filter === 'szukaj' && (ocena.Kategoria.toLowerCase().includes(query) || ocena.Ocena.toLowerCase().includes(query)))
				)
				przedmiot.oceny.push(ocena)
			} else 
				przedmiot.oceny.push(ocena)
		})
		if (typeof przedmiot.srednia !== 'string') {
			srednia += markToInt(parseInt(przedmiot.SrednieCaloroczne, 10))
			sredniaCounter++
		}
		przedmioty.push(przedmiot)
	})
	document.querySelector('#srednia').innerHTML += srednia !== 0 ? Math.round(srednia / sredniaCounter * 100) / 100 : 'brak ocen'
	document.querySelector('#table').innerHTML = przedmioty.map(Przedmiot).join('')
}

const Przedmiot = przedmiot => `
	<tr>
		<td>${przedmiot.Przedmiot}</td>
		<td>
			${przedmiot.oceny.map(Ocena).join('')}
		</td>
		<td>${przedmiot.SrednieCaloroczne}</td>
		<td>${przedmiot.srednia}</td>
	</tr>
`

const Ocena = ocena => `
	<a href="#!" style="${ocena.style}" onclick="${ocena.toast}">
		${ocena.Ocena}&nbsp;
	</a>
`

function markToInt (ocena) {
	if(ocena >= 95) return 6
	if(ocena >= 85) return 5
	if(ocena >= 70) return 4
	if(ocena >= 50) return 3
	if(ocena >= 35) return 2
	return 1
}