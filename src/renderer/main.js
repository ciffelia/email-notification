import Vue from 'vue'

import parseQuery from './parseQuery'
import App from './components/App'

Vue.config.productionTip = false

new Vue({
  render: h => h(App, {
    props: {
      params: parseQuery()
    }
  })
}).$mount('#app')
