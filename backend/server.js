const express = require('express')
const http = require('http')
const cors = require('cors')
const { Server } = require('socket.io')

const app = express()

app.use(cors())
app.use(express.json())

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: '*',
  },
})

let orders = []
let orderCounter = 1

// MENU
app.get('/menu', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'Nasi Goreng',
      price: 50000,
      category: 'Main Course',
    },
    {
      id: 2,
      name: 'Mie Goreng',
      price: 45000,
      category: 'Main Course',
    },
  ])
})

// GET ORDERS
app.get('/orders', (req, res) => {
  const activeOrders = orders.filter(
    (order) => order.status !== 'done'
  )

  res.json(activeOrders)
})

// CREATE ORDER
app.post('/orders', (req, res) => {
  const order = {
    id: `ORD-${String(orderCounter).padStart(
      3,
      '0'
    )}`,
    queueNumber: orderCounter,
    tableNumber:
      req.body.tableNumber || 'A1',
    items: req.body.items || [],
    subtotal: req.body.subtotal || 0,
    status: 'pending',
    createdAt: new Date(),
  }

  orderCounter++

  orders.unshift(order)

  io.emit('incoming-order', order)

  res.json(order)
})

// UPDATE STATUS
app.patch('/orders/:id', (req, res) => {
  const { id } = req.params
  const { status } = req.body

  orders = orders.map((order) => {
    if (order.id === id) {
      const updated = {
        ...order,
        status,
      }

      io.emit('order-updated', updated)

      return updated
    }

    return order
  })

  res.json({
    success: true,
  })
})

io.on('connection', () => {
  console.log('socket connected')
})

server.listen(3001, () => {
  console.log('server running 3001')
})