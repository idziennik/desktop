module.exports = () => {
    loadPage('napisz')
	client.odbiorcy().then(odbiorcy => {
        console.log('odbiorcy', odbiorcy)
        data.odbiorcy = odbiorcy
        var klasy = {}, rodzice = {}, uczniowie = {}
        data.odbiorcy.ListK_Klasy.forEach(klasa => {
            klasy[klasa.IdKlasa] = klasa.Jedn + ':' + klasa.Klasa
        })
        data.odbiorcy.ListK_Opiekunowie.forEach(opiekun => {
            opiekun.desc = klasy[opiekun.IdKlasa]
            rodzice[opiekun.Id] = opiekun
        })
        data.odbiorcy.ListK_Uczniow.forEach(uczen => {
            var rodziceUcznia = []
            if(typeof rodzice[uczen.Matka] === 'object') rodziceUcznia.push('matka - ' + rodzice[uczen.Matka].ImieNazwisko)
            if(typeof rodzice[uczen.Ojciec] === 'object') rodziceUcznia.push('ojciec - ' + rodzice[uczen.Ojciec].ImieNazwisko)
            uczen.rodzice = rodziceUcznia.join(', ')
            uczen.desc = klasy[uczen.IdKlasa]
            uczniowie[uczen.Id] = uczen
        })
		var app = new Vue({
			el: '#app',
			data: () => {
				return {
                    nauczyciele: odbiorcy.ListK_Pracownicy,
                    uczniowie: uczniowie,
                    rodzice: rodzice
				}
            }
		})
        $('.collapsible').collapsible();
	}).catch(err => handleError(err, 'komunikator'))
}

Vue.component('lista', {
    props: ['osoby'],
    template: `
        <div class="collapsible-body">
            <div class="collection">
                <osoba v-for="osoba in osoby" :key="osoba.Id" :osoba="osoba"/>
            </div>
        </div>
    `
})

Vue.component('osoba', {
    props: ['osoba'],
    template: `
        <a @click="click(osoba.Id, osoba.ImieNazwisko)" class="collection-item" href="#!">
            {{ osoba.ImieNazwisko }} ({{ osoba.desc ? osoba.desc : osoba.ListaTypow.join(', ') }})
            <span v-if="osoba.rodzice"><br />{{ osoba.rodzice }}</span>
        </a>
    `,
    methods: {
        click: (id, nazwa) => {
        	document.querySelector('#napisz-odbiorca').value = nazwa
            document.querySelector('#napisz-odbiorca-id').value = id
            $('#modal').modal()
            $('#modal').modal('open')
        }
    }
})

document.wyslij = () => {
	client.wyslij(
		document.querySelector('#napisz-odbiorca-id').value,
		document.querySelector('#napisz-temat').value,
		document.querySelector('#napisz-tresc').value,
		document.querySelector('#napisz-potwierdzenie').checked
	).then(m => console.log('wyslij', m)).catch(err => handleError(err, 'komunikator'))
}