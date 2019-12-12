<template>
  <div>
    <EmailNotificationPage v-if="params.displayMode === 'notification'" />
    <EmailDetailPage v-if="params.displayMode === 'detail'" />
  </div>
</template>

<script>
import 'uikit'
import 'uikit/dist/js/uikit-icons'

import EmailNotificationPage from './EmailNotificationPage'
import EmailDetailPage from './EmailDetailPage'

export default {
  components: {
    EmailNotificationPage,
    EmailDetailPage
  },
  props: {
    params: Object
  }
}
</script>

<style lang="scss">
  @import "~uikit/dist/css/uikit.css";

  html {
    background: transparent;
  }

  html, body {
    width: max-content;
  }
</style>
