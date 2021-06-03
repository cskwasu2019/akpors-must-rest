const express = require('express')
const { CONFIG_RESPONSE_ITEM_LIMIT } = require('./config')

function getPageParams(req) {
  const page = Math.max((parseInt(req.query.page) || 1) - 1, 0)
  const start = page * CONFIG_RESPONSE_ITEM_LIMIT
  const end = (page + 1) * CONFIG_RESPONSE_ITEM_LIMIT

  return {
    page,
    start,
    end,
    current: page + 1,
  }
}

function errorMsg(message) {
  return {
    error: true,
    message,
  }
}

function getResouces(route, datas, req, res) {
  const pageParams = getPageParams(req)
  const resDatas = datas.slice(pageParams.start, pageParams.end)
  res.send({
    data: resDatas,
    pagination: {
      page: pageParams.current,
      next:
        pageParams.end + CONFIG_RESPONSE_ITEM_LIMIT >= datas.length
          ? null
          : `/${route}/?page=${pageParams.current + 1}`,
      prev:
        pageParams.current == 1 || pageParams.start >= datas.length
          ? null
          : `/${route}/?page=${pageParams.current - 1}`,
    },
  })
}

function getSingleResource(route, datas, req, res) {
  const id = req.params.id
  if (id == 'random') {
    const randIndex = Math.floor(datas.length * Math.random())
    const resData = datas[randIndex]
    res.json(resData)
  } else {
    const idValue = parseInt(id) || -1
    const resData = datas.find((data) => data.id == idValue)

    if (!resData) {
      res.status(400)
      res.send(errorMsg(`${route} ID is invalid`))
    } else {
      res.json(resData)
    }
  }
}

module.exports = function apiRouter() {
  const router = express.Router()

  const routes = {
    jokes: {
      data: require('./datas/pidgin-jokes.json'),
      single: 'joke',
    },
    motivations: {
      data: require('./datas/pidgin-motivations.json'),
      single: 'motivation',
    },
    proverbs: {
      data: require('./datas/pidgin-proverbs.json'),
      single: 'proverb',
    },
  }
  for (const [route, routeData] of Object.entries(routes)) {
    router.get(`/${route}/`, getResouces.bind(this, route, routeData.data))
    router.get(
      `/${routeData.single}/:id`,
      getSingleResource.bind(this, routeData.single, routeData.data)
    )
  }

  router.all('/ping', function (_, res) {
    res.json({
      jokes_items_count: routes.jokes.data.length,
      motivation_items_count: routes.motivations.data.length,
      proverbs_items_count: routes.proverbs.data.length,
    })
  })

  router.get('*', (_, res) => {
    res.status(404)
    res.json(errorMsg('Resource not found!'))
  })

  return router
}
