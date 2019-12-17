import EventEmitter from 'events'
import util from 'util'
import Imap from 'imap'
import { simpleParser } from 'mailparser'
import streamToBuffer from './streamToBuffer'

class IMAPGateway extends EventEmitter {
  constructor () {
    super()

    this._handleMailboxUpdate = this._handleMailboxUpdate.bind(this)
    this._handleError = this._handleError.bind(this)
  }

  async init (config) {
    await this._connect(config)
    await this._openMailbox('INBOX', true)
  }

  async fetchUnreadMessageHeaders () {
    const uids = await this._fetchUnreadMessageUids()
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

  _connect (config) {
    return new Promise((resolve, reject) => {
      this._imapConnection = new Imap({
        ...config,
        // https://github.com/mscdex/node-imap/issues/724
        tlsOptions: {
          servername: config.host,
          ...config.tlsOptions
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
      this._imapConnection.on('error', this._handleError)

      this._imapConnection.connect()
    })
  }

  _disconnect () {
    this._imapConnection.off('mail', this._handleNewMail)
    this._imapConnection.off('mail', this._handleMailboxUpdate)
    this._imapConnection.off('expunge', this._handleMailboxUpdate)
    this._imapConnection.off('update', this._handleMailboxUpdate)
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
    const imapFetch = this._imapConnection.fetch(uids, { bodies })
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

  _handleError (err) {
    this.emit('error', err)
  }
}

export default IMAPGateway
