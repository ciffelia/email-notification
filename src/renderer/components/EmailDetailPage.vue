<template>
  <EmailCard display-mode="detail">
    <template>
      <EmailHeader v-if="message === null" loading/>
      <EmailHeader
        v-else
        @click="closePage()"
        :message="message"
        showCloseButton
        windowDraggable
      />
    </template>
    <template>
      <EmailBody v-if="message === null" loading/>
      <EmailBody v-else :message="message"/>
    </template>
    <EmailFooter @markAsReadClick="markMessageAsRead()" v-if="!alreadyMarkedAsRead"/>
  </EmailCard>
</template>

<script>
import { ipcRenderer } from 'electron'

import resizeToContentAndMoveWindow from '../resizeToContentAndMoveWindow'
import EmailCard from './EmailCard'
import EmailHeader from './EmailCard/EmailHeader'
import EmailFooter from './EmailCard/EmailFooter'
import EmailBody from './EmailCard/EmailBody'

export default {
  name: 'EmailDetailPage',
  components: {
    EmailCard,
    EmailHeader,
    EmailBody,
    EmailFooter
  },
  data () {
    return {
      message: null,
      alreadyMarkedAsRead: false
    }
  },
  methods: {
    updateMessage (e, message) {
      this.message = message
    },
    markMessageAsRead () {
      ipcRenderer.send('markMessageAsRead', {
        imapAccountId: this.message.imapAccountId,
        uid: this.message.attributes.uid
      })
      this.alreadyMarkedAsRead = true
    },
    closePage () {
      window.close()
    }
  },
  mounted () {
    ipcRenderer.on('updateMessage', this.updateMessage)
    this.$nextTick(function () {
      resizeToContentAndMoveWindow('center')
    })
  },
  beforeDestroy () {
    ipcRenderer.off('updateMessage', this.updateMessage)
  }
}
</script>
