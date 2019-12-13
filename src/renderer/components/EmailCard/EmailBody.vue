<template>
  <div class="email-body uk-card-body uk-text-break" v-html="body"/>
</template>

<script>
export default {
  name: 'EmailBody',
  props: {
    message: Object,
    loading: Boolean
  },
  computed: {
    body () {
      if (this.loading) {
        return 'Loading...'
      } else {
        return this.message.textAsHtml
      }
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
