const kolory = {
	o: 'rgb(255, 255, 214)',
	n: 'rgb(255, 214, 214)',
	p: 'rgb(214, 255, 214)'
}

module.exports = (filter) => {
	loadPage('uwagi')
	if (typeof data.uwagi !== 'undefined') {
		handler(data.uwagi, filter)
		return
	}
	client.uwagi().then(handler).catch(err => handleError(err, 'uwagi'))
}

function handler (uwagi, filter) {
	var counter = new Vue({
		el: '#punkty',
		data: () => { return { count: uwagi.Poczatkowa } }
	})
	var app = new Vue({
		el: '#uwagi', 
		data: () => { return { lista: [] } }
	})
	console.log('uwagi', uwagi)
	data.uwagi = uwagi
	uwagi.SUwaga.forEach(uwaga => {
		counter.count += parseInt(uwaga.Punkty, 10)
		uwaga.style = 'background-color: ' + kolory[uwaga.Typ]
		if (filter) {
			if (uwaga.Typ === filter) {
				app.lista.push(uwaga)
			}
		} else {
			app.lista.push(uwaga)
		}
	})
}

Vue.component('uwaga', {
	props: ['uwaga'],
	template: `
		<tr :style="uwaga.style">
			<td style="white-space: nowrap;">{{ uwaga.Data }}</td>
			<td style="white-space: nowrap;">{{ uwaga.Nauczyciel }}</td>
			<td>{{ uwaga.Tresc }}</td>
			<td>{{ uwaga.Punkty }}</td>
		</tr>
	`
})