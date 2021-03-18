import VirtaukListScroll from "./VirtualListScroll/index.vue"
const plugin = {
	install(Vue) {
		Vue.component("VirtualListScroll", VirtaukListScroll)
	}
}
export default plugin