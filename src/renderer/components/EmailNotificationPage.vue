import { ipcRenderer } from "electron"
<template>
  <transition name="fade" @enter="showWindow()" @after-leave="hideWindow()">
    <EmailCard
      display-mode="notification"
      v-show="active || hover"
      @mouseenter="hover = true"
      @mouseleave="hover = false"
    >
      <EmailHeader
        @click="showMessage(message)"
        v-for="message in messageList"
        :key="message.messageId"
        :message="message"
      />
    </EmailCard>
  </transition>
</template>

<script>
import { ipcRenderer, remote } from 'electron'

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
      messageList: [],
      active: false,
      hover: false,
      inactivateTimeout: null
    }
  },
  methods: {
    updateMessageList (e, messageList) {
      this.messageList = messageList

      this.active = true

      clearTimeout(this.inactivateTimeout)
      this.inactivateTimeout = setTimeout(function () {
        this.active = false
      }.bind(this), 3000)

      this.$nextTick(function () {
        resizeToContentAndMoveWindow('bottomRight')
      })
    },
    showMessage (message) {
      ipcRenderer.send('showMessage', message)
    },
    showWindow () {
      remote.getCurrentWindow().show()
    },
    hideWindow () {
      remote.getCurrentWindow().hide()
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

<style scoped lang="scss">
  .fade-leave-active {
    transition: {
      property: opacity;
      delay: 0.8s;
      duration: 0.8s;
      timing-function: linear;
    };
  }
  .fade-leave-to {
    opacity: 0;
  }
</style>
