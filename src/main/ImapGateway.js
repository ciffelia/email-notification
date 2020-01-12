import EventEmitter from 'events'
import util from 'util'
import Imap from 'imap'
import { simpleParser } from 'mailparser'
import streamToBuffer from './streamToBuffer'
import isProduction from './isProduction'

class ImapGateway extends EventEmitter {
  constructor (config) {
    super()

    this._handleMailboxUpdate = this._handleMailboxUpdate.bind(this)
    this._handleNewMail = this._handleNewMail.bind(this)
    this._handleClose = this._handleClose.bind(this)
    this._handleError = this._handleError.bind(this)

    this.config = config
    this.isReady = false
  }

  async init () {
    await this._connect()
    await this._openMailbox('INBOX')
    this.isReady = true
  }

  terminate () {
    this._disconnect()
  }

  async countUnreadMessages () {
    const uids = await this._fetchUnreadMessageUids()
    return uids.length
  }

  async fetchUnreadMessageHeaders () {
    const uids = await this._fetchUnreadMessageUids()
    if (uids.length === 0) return []

    const messages = await this._fetchMessages(uids, 'HEADER.FIELDS (From To Date Subject)')

    return messages.map(({ attributes, bodies }) => ({
      attributes,
      body: bodies[0].parsed
    }))
  }

  async fetchMessage (uid) {
    const messages = await this._fetchMessages(uid)
    return {
      attributes: messages[0].attributes,
      body: messages[0].bodies[0].parsed
    }
  }

  async markMessageAsRead (uid) {
    const _addFlags = util.promisify(this._imapConnection.addFlags)
    return _addFlags.call(this._imapConnection, uid, 'Seen')
  }

  _connect () {
    return new Promise((resolve, reject) => {
      this._imapConnection = new Imap({
        debug: isProduction ? undefined : console.log,
        ...this.config,
        // https://github.com/mscdex/node-imap/issues/724
        tlsOptions: {
          servername: this.config.host,
          ...this.config.tlsOptions
        }
      })

      const readyHandler = () => {
        this._imapConnection.off('error', errorHandler)
        resolve()
      }
      const errorHandler = err => {
        this._imapConnection.off('ready', readyHandler)
        reject(err)
      }

      this._imapConnection.once('ready', readyHandler)
      this._imapConnection.once('error', errorHandler)

      this._imapConnection.on('mail', this._handleNewMail)
      this._imapConnection.on('mail', this._handleMailboxUpdate)
      this._imapConnection.on('expunge', this._handleMailboxUpdate)
      this._imapConnection.on('update', this._handleMailboxUpdate)
      this._imapConnection.on('close', this._handleClose)
      this._imapConnection.on('error', this._handleError)

      this._imapConnection.connect()
    })
  }

  _disconnect () {
    this._imapConnection.off('mail', this._handleNewMail)
    this._imapConnection.off('mail', this._handleMailboxUpdate)
    this._imapConnection.off('expunge', this._handleMailboxUpdate)
    this._imapConnection.off('update', this._handleMailboxUpdate)
    this._imapConnection.off('close', this._handleClose)
    this._imapConnection.off('error', this._handleError)

    this._imapConnection.destroy()
  }

  async _openMailbox (path, readOnly) {
    const _openBox = util.promisify(this._imapConnection.openBox)
    return _openBox.call(this._imapConnection, path, readOnly)
  }

  async _fetchUnreadMessageUids () {
    const _search = util.promisify(this._imapConnection.search)
    return _search.call(this._imapConnection, ['UNSEEN'])
  }

  async _fetchMessages (uids, bodies = '') {
    const imapFetch = this._imapConnection.fetch(uids, { markSeen: false, bodies })
    return this._processImapFetch(imapFetch)
  }

  _processImapFetch (imapFetch) {
    return new Promise((resolve, reject) => {
      const messages = []

      imapFetch.on('message', async imapMessage => {
        const message = await this._processImapMessage(imapMessage)
        messages.push(message)
      })
      imapFetch.once('error', err => {
        reject(err)
      })
      imapFetch.once('end', () => {
        setImmediate(async () => {
          for (const message of messages) {
            for (const body of message.bodies) {
              await this._processBody(body)
            }
          }
          resolve(messages)
        })
      })
    })
  }

  _processImapMessage (imapMessage) {
    return new Promise(resolve => {
      const bodies = []
      let attributes

      imapMessage.on('body', (stream, info) => {
        bodies.push({ ...info, stream })
      })
      imapMessage.on('attributes', attrs => {
        attributes = attrs
      })
      imapMessage.on('end', () => {
        resolve({ bodies, attributes })
      })
    })
  }

  async _processBody (body) {
    body.buffer = await streamToBuffer(body.stream)
    delete body.stream

    body.parsed = await simpleParser(body.buffer, {
      skipHtmlToText: true,
      skipImageLinks: true
    })
    delete body.buffer
  }

  _handleMailboxUpdate () {
    this.emit('mailboxUpdated')
  }

  _handleNewMail () {
    this.emit('newMailAvailable')
  }

  _handleClose () {
    this.isReady = false
  }

  _handleError (err) {
    // Fix https://github.com/mscdex/node-imap/issues/487
    if (this._imapConnection._tmrKeepalive) {
      clearTimeout(this._imapConnection._tmrKeepalive)
    }
    this.emit('error', err)
  }
}

export default ImapGateway
