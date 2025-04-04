import jsonServer from 'json-server'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const server = jsonServer.create()
const router = jsonServer.router(path.join(__dirname, 'db.json'))
const middlewares = jsonServer.defaults({
  static: path.join(__dirname, 'dist') 
})

const PORT = process.env.PORT || 3001
server.use(middlewares)
server.use(jsonServer.bodyParser)
server.use('/api', router)
server.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
  } else {
    next()
  }
})

server.listen(PORT, () => {
  console.log(`JSON Server is running on port ${PORT}`)
})
