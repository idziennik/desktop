module.exports = tryb => {
  loadPage('preloader')
  if(!tryb) var tryb = 'odebrane'
  client[tryb]().then(wiadomosci => {
    console.log('wiadomosci', wiadomosci)
    loadPage('komunikator')
    document.querySelector('#tryb').innerHTML = tryb === 'odebrane' ? 'Nadawca' : 'Odbiorca'
    document.querySelector('tbody').innerHTML = wiadomosci.ListK.map(Wiadomosc).join('')
    
  }).catch(err => handleError(err, 'komunikator'))
}

const Wiadomosc = wiadomosc => `
  <tr>
    <td style="white-space: nowrap;">${wiadomosc.DataNadania}</td>
    <td style="white-space: nowrap;">${wiadomosc.Nadawca}</td>
    <td>
      <a href="#!" class="msg" onclick="document.loadMessage('${wiadomosc._recordId}')">${wiadomosc.Tytul}</a>
    </td>
  </tr>
`

const Modal = wiadomosc => `
		<h4>${wiadomosc.Tytul}</h4>
		Nadawca: ${wiadomosc.Nadawca}<br />
		Data nadania: ${wiadomosc.DataNadania}<br />
    Data odczytania: ${wiadomosc.DataOdczytania}<br /><br />
    ${typeof wiadomosc.Text === 'string' ? wiadomosc.Text.replace('\n', '<br />') : ''}
`

document.loadMessage = id => {
  client.wiadomosc(id).then(wiadomosc => {
    console.log('wiadomosc', wiadomosc)
    document.querySelector('#modal-content').innerHTML = Modal(wiadomosc.Wiadomosc)
    new M.Modal(document.querySelector('.modal')).open()
  }).catch(err => handleError(err, 'komunikator'))
}