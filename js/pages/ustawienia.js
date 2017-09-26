module.exports = () => {
    loadPage('ustawienia')
    var defaultPage = data.defaultPage ? data.defaultPage : "terminarz"
    document.querySelector('#select').value = defaultPage
    $('select').material_select()
    document.querySelector('#savebtn').addEventListener('click', () => {
        var data_orig = JSON.parse(fs.readFileSync(confpath, 'utf8'))
        data_orig.defaultPage = document.querySelector('#select').value
        fs.writeFileSync(confpath, JSON.stringify(data_orig), 'utf8')
        Materialize.toast('Zapisano!', 1000)
    })
}