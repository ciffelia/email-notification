import { ipcRenderer } from "electron"
<template>
  <transition name="fade" @enter="showWindow()" @after-leave="hideWindow()">
    <EmailCard
      display-mode="notification"
      v-show="active || hover"
      @mouseenter="hover = true"
      @mouseleave="hover = false"
    >
      <EmailHeader v-if="messageList === null" :message="null"/>
      <EmailEmpty v-else-if="messageList.length === 0"/>
      <template v-else>
        <EmailHeader
          @click="showMessageDetail(message)"
          v-for="message in messageList"
          :key="message.messageId"
          :message="message"
        />
      </template>
    </EmailCard>
  </transition>
</template>

<script>
import { ipcRenderer, remote } from 'electron'

import resizeToContentAndMoveWindow from '../resizeToContentAndMoveWindow'
import EmailCard from './EmailCard'
import EmailEmpty from './EmailCard/EmailEmpty'
import EmailHeader from './EmailCard/EmailHeader'

export default {
  name: 'EmailNotificationPage',
  components: {
    EmailEmpty,
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
    showMessageDetail (message) {
      ipcRenderer.send('showMessageDetail', message)
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
