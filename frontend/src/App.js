const axios = require('axios').default
const escape = require('escape-html')
const html2canvas = require('html2canvas')
const download = require('downloadjs')

const API_BASE = '/api'

const RESOURCE_JOKE = 'joke'
const RESOURCE_MOTIVATION = 'motivation'
const RESOURCE_PROVERB = 'proverb'

const reResource = /^\/?(?<resource>[a-zA-Z]+)\/?/

class App {
  constructor(router) {
    this.router = router
    this.elBtnReload = document.getElementById('btn-reload')
    this.elBtnDownloadScreenshot = document.getElementById(
      'btn-download-sreenshot'
    )
    this.elFigureCard = document.getElementById('figure-card')
    this.elFigureCardTitle = document.getElementById('figure-card-title')
    this.elFigure = document.querySelector('#figure-card figure')
    this.elFigCaption = document.querySelector('#figure-card figcaption')

    this.canDownloadScreenshot = false
    this.canReload = false
    this.currentResource = null

    this.elBtnDownloadScreenshot.addEventListener('click', () =>
      this.downloadScreenshot()
    )
    this.elBtnReload.addEventListener('click', () => this.loadResource())

    this.elNavLinks = Array.from(
      document.querySelectorAll('nav a[data-navigo]')
    )

    this.elShareFacebook = document.querySelector('[data-share-facebook]')
    this.elShareTwitter = document.querySelector('[data-share-twitter]')
    this.elShareNative = document.querySelector('[data-share-native]')

    if (this.elShareNative) {
      this.elShareNative.addEventListener('click', (e) => {
        e.preventDefault()
        this.handleNativeShare()
      })
    }
  }

  set canDownloadScreenshot(value) {
    if (!value) {
      this.__screenshot = null
      this.elBtnDownloadScreenshot.setAttribute('disabled', true)
    } else {
      this.elBtnDownloadScreenshot.removeAttribute('disabled')
    }
  }

  set canReload(value) {
    if (!value) {
      this.elBtnReload.setAttribute('disabled', true)
      this.elFigureCard.setAttribute('data-state', 'loading')
      this.canDownloadScreenshot = false
    } else {
      this.elBtnReload.removeAttribute('disabled')
      this.elFigureCard.setAttribute('data-state', 'active')
      this.canDownloadScreenshot = true
    }
  }

  async downloadScreenshot() {
    // cache card background-color
    if (!this.__cardBGColor) {
      const style = window.getComputedStyle(this.elFigure)
      this.__cardBGColor = style.backgroundColor
    }

    if (!this.__screenshot) {
      try {
        this.canDownloadScreenshot = false
        const canvas = await html2canvas(this.elFigure, {
          backgroundColor: this.__cardBGColor,
        })
        this.__screenshot = await new Promise((resolve) => {
          canvas.toBlob(
            (blob) => {
              resolve(blob)
            },
            'image/png',
            1.0
          )
        })
      } catch (e) {
        console.error(e)
        return
      }
    }
    const d = new Date()
    const prefixZero = (value) => (value < 10 ? '0' + value : value)
    const filename = `screenshot-${prefixZero(d.getDate())}-${prefixZero(
      d.getMonth() + 1
    )}-${prefixZero(d.getFullYear())}--${prefixZero(
      d.getHours() + 1
    )}-${prefixZero(d.getMinutes() + 1)}-${prefixZero(d.getSeconds() + 1)}.png`

    download(this.__screenshot, filename, 'image/png')
    this.canDownloadScreenshot = true
  }

  loadFailed() {
    this.elFigureCard.setAttribute('data-state', 'load-failed')
    this.elBtnReload.removeAttribute('disabled')
  }

  updateUrl(path) {
    this.router.navigate(path, {
      stateObj: 'replaceState',
      callHandler: false,
      callHooks: true,
      updateState: false,
    })
  }

  updateShareData() {
    if (this.elShareFacebook && this.elShareFacebook.href) {
      this.elShareFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        document.location.href
      )}`
    }

    if (this.elShareTwitter && this.elShareTwitter.href) {
      this.elShareTwitter.href = `http://twitter.com/share?url=${encodeURIComponent(
        document.location.href
      )}&hashtags=joke,akpors`
    }

    if (this.elShareNative) {
      this.elShareNative.setAttribute('data-share-link', document.location.href)
    }
  }

  handleNativeShare() {
    if (
      this.elShareNative &&
      this.elShareNative.hasAttribute('data-share-link')
    ) {
      if ('share' in window.navigator) {
        window.navigator.share({
          url: this.elShareNative.getAttribute('data-share-link'),
        })
      }
    }
  }

  init(router) {
    const elNavLinks = this.elNavLinks
    router.hooks({
      after(match) {
        const matchLink = match.url

        if (!matchLink) {
          return
        }

        for (const elNavLink of elNavLinks) {
          const linkResource = elNavLink.getAttribute('href').match(reResource)
          const matchResouce = matchLink.match(reResource)

          if (linkResource.groups.resource == matchResouce.groups.resource) {
            elNavLink.setAttribute('data-current', '')
          } else {
            elNavLink.removeAttribute('data-current')
          }
        }
      },
    })

    router.on(() => {
      this.loadResource(RESOURCE_MOTIVATION)
    })

    const that = this
    const routes = [
      RESOURCE_JOKE,
      RESOURCE_MOTIVATION,
      RESOURCE_PROVERB,
    ].reduce(
      (object, resource) => ({
        ...object,
        [`/${resource}/`]: () => that.loadResource(resource),
        [`/${resource}/:id`]: ({ data }) =>
          that.loadResource(resource, data.id),
      }),
      {}
    )

    router.on(routes)

    this.routeNavigate = (path) => {
      router.navigate(path, {
        stateObj: 'replaceState',
        callHandler: false,
        callHooks: true,
        updateState: false,
      })
    }
  }

  parseResourceData(resource, data) {
    switch (resource) {
      case RESOURCE_JOKE:
        return `<strong>${escape(data.title)}</strong><br>${escape(
          data.body
        ).replace(/\n/g, '<br>')}`
      case RESOURCE_MOTIVATION:
        return escape(data.text)
          .replace()
          .replace(/\*(.+?)\*/g, '<strong>$1</strong><br>')
          .replace('\n', '<br>')
      case RESOURCE_PROVERB:
        return `<strong>Proverb:</strong> ${escape(
          data.proverb
        )}<br><strong>Meaning:</strong> ${escape(data.moral)}`
      default:
        return ''
    }
  }

  async loadResource(resource, id) {
    resource = resource || this.currentResource
    id = id || 'random'

    if (!resource) {
      return
    }

    try {
      this.canReload = false
      this.currentResource = resource

      const res = await axios(`${API_BASE}/${resource}/${id}`)
      const data = res.data
      this.elFigCaption.innerHTML = this.parseResourceData(resource, data)
      this.elFigureCardTitle.innerText = resource
      this.routeNavigate(`${resource}/${data.id}`)
      this.updateShareData()
      this.canReload = true
    } catch (e) {
      console.error(e)
      this.loadFailed()
    }
  }
}

module.exports = App
