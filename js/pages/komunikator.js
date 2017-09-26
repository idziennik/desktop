module.exports = (tryb) => {
	loadPage('komunikator')
    if(!tryb) var tryb = 'odebrane'
    var app = new Vue({
        el: '#table',
        data: () => {
            return {
                wiadomosci: [],
                tryb: tryb
            }
        }
    })
	client[tryb]().then(wiadomosci => {
		console.log('wiadomosci', wiadomosci)
        app.wiadomosci = wiadomosci.ListK
    }).catch(err => handleError(err, 'komunikator'))
    window.modal = new Vue({
        el: '#modal',
        data: () => {
            return { 
                wiadomosc: {}
            }
        }
    })
}

Vue.component('wiadomosc', {
    props: ['wiadomosc'],
    template: `
        <tr>
            <td style="white-space: nowrap;">{{ wiadomosc.DataNadania }}</td>
            <td style="white-space: nowrap;">{{ wiadomosc.Nadawca }}</td>
            <td>
                <a href="#!" @click="click" :data-id="wiadomosc._recordId">{{ wiadomosc.Tytul }}</a>
            </td>
        </tr>
    `,
    methods: {
        click: (e) => {
            client.wiadomosc(e.target.dataset.id).then(wiadomosc => {
                console.log('wiadomosc', wiadomosc)
                wiadomosc.Wiadomosc.tresc = typeof wiadomosc.Wiadomosc.Text === 'string' ? wiadomosc.Wiadomosc.Text.replace('\n', '<br />') : ''
                modal.wiadomosc = wiadomosc.Wiadomosc
                $('#modal').modal()
                $('#modal').modal('open')
            }).catch(err => handleError(err, 'komunikator'))
        }
    }
})