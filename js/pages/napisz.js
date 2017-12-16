module.exports = () => {
  loadPage('preloader')
  client.odbiorcy().then(odbiorcy => {
    console.log('odbiorcy', odbiorcy)
    var lista = {
      Pracownicy: odbiorcy.ListK_Pracownicy,
      Rodzice: odbiorcy.ListK_Opiekunowie,
      Uczniowie: odbiorcy.ListK_Uczniow,
      Klasy: {}
    }
    odbiorcy.ListK_Klasy.forEach(e => lista.Klasy[e.IdKlasa] = e.Klasa)
    lista.Pracownicy = lista.Pracownicy.map(el => {
      var desc = []
      desc.push(el.ListaTypow.join(', '))
      if (el.CzyJestWychowawca) desc.push('wychowawca')
      el.desc = ': ' + desc.join(', ')
      return el
    })
    lista.Rodzice = lista.Rodzice.map(el => { el.desc = ', klasa: ' + lista.Klasy[el.IdKlasa]; return el })
    lista.Uczniowie = lista.Uczniowie.map(el => {
      var desc = []
      if (el.Skreslony) desc.push('skreslony')
      var matka = lista.Rodzice.find(e => el.Matka === e.Id)
      var ojciec = lista.Rodzice.find(e => el.Ojciec === e.Id)
      if (matka) desc.push('matka: ' + matka.ImieNazwisko)
      if (ojciec) desc.push('ojciec: ' + ojciec.ImieNazwisko)
      desc.push('klasa: ' + lista.Klasy[el.IdKlasa])
      el.desc = ', ' + desc.join(', ')
      return el
    })
    loadPage('napisz')
    document.modal = new M.Modal(document.querySelector('.modal'))
    new M.Collapsible(document.querySelector('.collapsible'))
    document.querySelector('#nauczyciele').innerHTML = lista.Pracownicy.map(Osoba).join('')
    document.querySelector('#uczniowie').innerHTML = lista.Uczniowie.map(Osoba).join('')
    document.querySelector('#rodzice').innerHTML = lista.Rodzice.map(Osoba).join('')
  }).catch(err => handleError(err, 'komunikator'))
}

document.click = (id, name) => {
  document.querySelector('#napisz-odbiorca').value = name
  document.querySelector('#napisz-odbiorca-id').value = id
  document.modal.open()
}

document.wyslij = () => {
  client.wyslij(
    document.querySelector('#napisz-odbiorca-id').value,
    document.querySelector('#napisz-temat').value,
    document.querySelector('#napisz-tresc').value,
    document.querySelector('#napisz-potwierdzenie').checked
  ).then(m => console.log('wyslij', m)).catch(err => handleError(err, 'komunikator'))
}

const Lista = lista => `
  <div class="collapsible-body">
    <div class="collection">
      ${lista.map(Osoba).join('')}
    </div>
  </div>
`

const Osoba = osoba => `
  <a onclick="document.click('${osoba.Id}', '${osoba.ImieNazwisko}')" class="collection-item" href="#!">
    ${osoba.ImieNazwisko}${osoba.desc}
  </a>
`