<template>
	<VirtualListScroll :data="[]" :pageMode="false"></VirtualListScroll>
</template>

<script>
import Vue from "vue"
import VirtualListScroll from "./index.js"
Vue.use(VirtualListScroll)
export default {

  name: 'App',

  data () {
    return {

    }
  }
}
</script>

<style lang="css" scoped>
</style>