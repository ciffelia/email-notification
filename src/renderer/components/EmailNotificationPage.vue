import { ipcRenderer } from "electron"
<template>
  <EmailCard display-mode="notification">
    <EmailHeader
      @click="showMessage(message)"
      v-for="message in messageList"
      :key="message.messageId"
      :message="message"
    />
  </EmailCard>
</template>

<script>
import { ipcRenderer } from 'electron'

import resizeToContentAndMoveWindow from '../resizeToContentAndMoveWindow'
import EmailCard from './EmailCard'
import EmailHeader from './EmailCard/EmailHeader'

export default {
  name: 'EmailNotificationPage',
  components: {
    EmailCard,
    EmailHeader
  },
  data () {
    return {
      messageList: []
    }
  },
  methods: {
    updateMessageList (e, messageList) {
      this.messageList = messageList.reverse()
      this.$nextTick(function () {
        resizeToContentAndMoveWindow('bottomRight')
      })
    },
    showMessage (message) {
      ipcRenderer.send('showMessage', message)
    }
  },
  mounted () {
    ipcRenderer.on('updateMessageList', this.updateMessageList)
  },
  beforeDestroy () {
    ipcRenderer.off('updateMessageList', this.updateMessageList)
  }
}
</script>
