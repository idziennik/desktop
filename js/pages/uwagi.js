const kolory = {
	o: 'rgb(255, 255, 214)',
	n: 'rgb(255, 214, 214)',
	p: 'rgb(214, 255, 214)'
}

module.exports = filter => {
	loadPage('uwagi')
	if (typeof data.uwagi !== 'undefined' && filter) {
		handler(data.uwagi, filter)
		return
	}
	client.uwagi().then(handler).catch(err => handleError(err, 'uwagi'))
}

function handler (uwagi, filter) {
	console.log('uwagi', uwagi)
	data.uwagi = uwagi
	var lista = []
	var counter = uwagi.Poczatkowa
	uwagi.SUwaga.forEach(uwaga => {
		counter += parseInt(uwaga.Punkty, 10)
		uwaga.style = 'background-color: ' + kolory[uwaga.Typ]
		if (filter) {
			if (uwaga.Typ === filter)
				lista.push(uwaga)
		} else
			lista.push(uwaga)
	})
	document.querySelector('#punkty').innerHTML += counter
	document.querySelector('tbody').innerHTML = lista.map(Uwaga).join('')
}

const Uwaga = uwaga => `
	<tr style="${uwaga.style}">
		<td style="white-space: nowrap;">${uwaga.Data}</td>
		<td style="white-space: nowrap;">${uwaga.Nauczyciel}</td>
		<td>${uwaga.Tresc}</td>
		<td>${uwaga.Punkty}</td>
	</tr>
`