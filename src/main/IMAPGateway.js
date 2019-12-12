import EventEmitter from 'events'
import util from 'util'
import inbox from 'inbox'
import { simpleParser } from 'mailparser'
import streamToBuffer from './streamToBuffer'

class IMAPGateway extends EventEmitter {
  constructor () {
    super()

    this._handleNewMessage = this._handleNewMessage.bind(this)
  }

  async init (config) {
    await this._connect(config)
    await this._openMailbox('INBOX', { readOnly: true })
  }

  async fetchUnreadMessages () {
    const uids = await this._fetchUnreadMessageUids()
    return Promise.all(uids.map(uid => this._fetchMessageBody(uid)))
  }

  _connect ({ host, port, ...options }) {
    return new Promise(resolve => {
      this._imapClient = inbox.createConnection(port, host, options)
      this._imapClient.on('new', this._handleNewMessage)
      this._imapClient.once('connect', resolve)
      this._imapClient.connect()
    })
  }

  _disconnect () {
    this._imapClient.off('new', this._handleNewMessage)
    this._imapClient.close()
  }

  async _openMailbox (path, options) {
    const _openMailBox = util.promisify(this._imapClient.openMailbox)
    return _openMailBox.call(this._imapClient, path, options)
  }

  async _fetchUnreadMessageUids () {
    const _search = util.promisify(this._imapClient.search)
    return _search.call(this._imapClient, { unseen: true }, true)
  }

  async _fetchMessageData (uid) {
    const _fetchData = util.promisify(this._imapClient.fetchData)
    return _fetchData.call(this._imapClient, uid)
  }

  async _fetchMessageBody (uid) {
    const stream = this._imapClient.createMessageStream(uid)
    const rawBody = await streamToBuffer(stream)
    return simpleParser(rawBody, { skipHtmlToText: true, skipImageLinks: true })
  }

  async _handleNewMessage (message) {
    const messageBody = await this._fetchMessageBody(message.UID)
    this.emit('newMailReceived', messageBody)
  }
}

export default IMAPGateway
