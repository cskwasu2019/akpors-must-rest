const Navigo = require('navigo')
const App = require('./App')

const router = new Navigo('/', { hash: true })
const app = new App(router)

app.init(router)
router.resolve()
