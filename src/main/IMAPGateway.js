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
      this.imapClient = inbox.createConnection(port, host, options)
      this.imapClient.on('new', this._handleNewMessage)
      this.imapClient.once('connect', resolve)
      this.imapClient.connect()
    })
  }

  _disconnect () {
    this.imapClient.off('new', this._handleNewMessage)
    this.imapClient.close()
  }

  async _openMailbox (path, options) {
    const _openMailBox = util.promisify(this.imapClient.openMailbox)
    return _openMailBox.call(this.imapClient, path, options)
  }

  async _fetchUnreadMessageUids () {
    const _search = util.promisify(this.imapClient.search)
    return _search.call(this.imapClient, { unseen: true }, true)
  }

  async _fetchMessageData (uid) {
    const _fetchData = util.promisify(this.imapClient.fetchData)
    return _fetchData.call(this.imapClient, uid)
  }

  async _fetchMessageBody (uid) {
    const stream = this.imapClient.createMessageStream(uid)
    const rawBody = await streamToBuffer(stream)
    return simpleParser(rawBody, { skipHtmlToText: true, skipImageLinks: true })
  }

  async _handleNewMessage (message) {
    const messageBody = await this._fetchMessageBody(message.UID)
    this.emit('newMailReceived', messageBody)
  }
}

export default IMAPGateway
