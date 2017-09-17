# idziennik [![Chat](https://img.shields.io/badge/chat-on%20discord-7289da.svg)](https://discord.gg/Fqhus) [![Docs](https://img.shields.io/badge/docs-on%20doclets-blue.svg)](https://doclets.io/Bjornskjald/idziennik/master)
## Moduł API iDziennika dla Node.js

### Uwaga! Moduł działa tylko z dziennikiem na Portalu Edukacyjnym (pe.szczecin.pl)!

### Instalacja

##### Wersja stabilna:
```
npm install idziennik
```

##### Najnowsza wersja:
```
npm install Bjornskjald/idziennik
```

### Używanie:

Wypisanie obiektu z ocenami ucznia
```javascript
const idziennik = require('idziennik')
idziennik({
	username: 'nazwaUzytkownika',
	password: 'haslo'
}).then(client => {
	client.oceny().then(console.log)
})
```

### Uwaga!

Zapisywanie hasła w postaci jawnej w kodzie jest niebezpieczne! (zwłaszcza, jeżeli ten kod umieszczasz na GitHubie)
Bezpieczniejsze jest zapisanie hashu hasła:

```javascript
const idziennik = require('idziennik')
const fs = require('fs')

idziennik({
	username: 'nazwaUzytkownika',
	password: 'haslo'
}).then(client => {
	fs.writeFileSync('hash.json', client.getHash(), 'utf8')
})
```

oraz wykorzystanie go ponownie w ten sposób:

```javascript
const idziennik = require('idziennik')
const fs = require('fs')

idziennik({
	username: 'nazwaUzytkownika',
	hash: fs.readFileSync('hash.json', 'utf8')
}).then(client => {
	// Dalsze czynności
})
```

Zapobiegnie to łatwemu wyciekowi hasła z kodu.

### Dokumentacja:
Dokumentacja w postaci JSDoc jest dostępna na [doclets.io](https://doclets.io/Bjornskjald/idziennik/master)
