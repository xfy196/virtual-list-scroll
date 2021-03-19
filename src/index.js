import VirtualListScroll from "./VirtualListScroll"
const plugin = {
	install(Vue) {
		Vue.component("VirtualListScroll", VirtualListScroll)
	}
}
export default plugin