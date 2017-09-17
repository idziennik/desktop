module.exports = {
	dni: ['poniedzialek', 'wtorek', 'sroda', 'czwartek', 'piatek'],
	plan: {
		opisy: lekcja => {
			return [
				'Odwołane',
				`Zastępstwo (${lekcja.NauZastepujacy})`,
				`Zastępstwo (${lekcja.NauZastepujacy} - ${lekcja.PrzedmiotZastepujacy})`,
				`Zastępstwo - inne (${lekcja.NauZastepujacy})`,
				`Łączona (${lekcja.NauZastepujacy})`,
				`Łączona - inna (${lekcja.NauZastepujacy} - ${lekcja.PrzedmiotZastepujacy})`
			][lekcja.TypZastepstwa]
		},
		godziny: (plan, lekcja) => {
			return plan.GodzinyLekcyjne[lekcja.Godzina].Poczatek + ' - ' + plan.GodzinyLekcyjne[lekcja.Godzina].Koniec
		}
	},
	obecnosci: {
		opisy: [
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
	}
}