<template>
  <div class="uk-card-footer">
    <button @click.prevent="$emit('markAsReadClick')" class="uk-button uk-button-primary">Mark as read</button>
  </div>
</template>

<script>
export default {
  name: 'EmailFooter'
}
</script>
