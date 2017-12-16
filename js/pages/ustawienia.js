module.exports = () => {
    loadPage('ustawienia')
    var defaultPage = data.defaultPage ? data.defaultPage : "terminarz"
    document.querySelector('#select').value = defaultPage
    new M.Select(document.querySelector('select'))
    document.querySelector('#savebtn').addEventListener('click', () => {
        var data_orig = JSON.parse(fs.readFileSync(confpath, 'utf8'))
        data_orig.defaultPage = document.querySelector('#select').value
        fs.writeFileSync(confpath, JSON.stringify(data_orig), 'utf8')
        M.toast({html:'Zapisano!', displayLength: 1000})
    })
}