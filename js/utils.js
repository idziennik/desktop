module.exports = {
  disable: item => item.classList.add('disabled'),
  enable: item => item.classList.remove('disabled'),
  dataValid: data => typeof data.username === 'string' && typeof data.hash === 'string'
}