<template>
  <div class="email-body uk-card-body uk-text-break" v-html="body"/>
</template>

<script>
export default {
  name: 'EmailBody',
  props: {
    message: Object
  },
  computed: {
    body () {
      return this.message?.textAsHtml || 'Loading...'
    }
  }
}
</script>

<style scoped lang="scss">
  .email-body {
    height: stretch;
    overflow-y: scroll;
  }
</style>
