<template>
  <div @click.prevent="$emit('click')" class="email-header uk-card-header" :class="{ windowDraggable }">
    <div class="uk-grid-small uk-margin-small-bottom" uk-grid>
      <div class="uk-width-expand">
        <h1 class="email-subject uk-card-title uk-text-center uk-text-truncate">{{ subject }}</h1>
      </div>
      <button v-if="showCloseButton" @click="$emit('closeClick')" class="email-close uk-close-large" uk-close/>
    </div>
    <table class="email-props uk-table uk-table-small uk-margin-remove-top uk-text-small">
      <tr>
        <td class="uk-table-shrink">Date</td>
        <td class="uk-text-truncate">{{ date }}</td>
      </tr>
      <tr>
        <td class="uk-table-shrink">From</td>
        <td class="uk-text-truncate" v-html="from"/>
      </tr>
      <tr>
        <td class="uk-table-shrink">To</td>
        <td class="uk-text-truncate" v-html="to"/>
      </tr>
    </table>
  </div>
</template>

<script>
import { DateTime } from 'luxon'

export default {
  name: 'EmailHeader',
  props: {
    message: Object,
    loading: Boolean,
    showCloseButton: Boolean,
    windowDraggable: Boolean
  },
  computed: {
    from () {
      if (this.loading) {
        return '- Someone -'
      } else {
        return this.message.from.html
      }
    },
    to () {
      if (this.loading) {
        return '- You -'
      } else {
        return this.message.to.html
      }
    },
    subject () {
      if (this.loading) {
        return 'Loading...'
      } else {
        return this.message.subject
      }
    },
    date () {
      if (this.loading) {
        return '- Someday -'
      } else {
        const date = DateTime.fromISO(this.message.date)
        return `${date.toRelative()} - ${date.toLocaleString(DateTime.DATETIME_SHORT)}`
      }
    }
  }
}
</script>

<style scoped lang="scss">
  .email-header {
    user-select: none;
  }

  .windowDraggable {
    -webkit-app-region: drag;

    .email-close {
      -webkit-app-region: no-drag;
    }
  }

  .email-subject {
    font-size: 1.2rem;
  }

  .email-props td {
    padding: 0;

    &:first-child {
      padding-right: 5px;
    }

    &:not(:first-child) {
      border-left: 1px solid #e5e5e5;
      padding-left: 5px;
    }
  }
</style>
