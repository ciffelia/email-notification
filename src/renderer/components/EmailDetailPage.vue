<template>
  <EmailCard display-mode="detail">
    <EmailHeader :message="message" windowDraggable/>
    <EmailBody :message="message"/>
    <EmailFooter/>
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
      message: {}
    }
  },
  methods: {
    updateMessage (e, message) {
      this.message = message
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
