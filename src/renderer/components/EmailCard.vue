<template>
  <div class="email-card uk-card uk-card-default uk-flex uk-flex-column" :class="[`email-card-${displayMode}`]">
    <slot/>
  </div>
</template>

<script>
export default {
  name: 'EmailCard',
  props: {
    displayMode: String
  }
}
</script>

<style scoped lang="scss">
  .email-card {
    margin: 10px 20px 15px 15px;
    background: white;

    &.email-card-notification {
      width: 470px;
    }

    &.email-card-detail {
      width: 800px;
      height: 600px;
    }

    > * {
      padding: 15px;

      border: none !important;
      &:not(:first-child) {
        border-top: 1px solid #e5e5e5 !important;
      }
    }
  }
</style>
