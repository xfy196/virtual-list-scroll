<template>
  <div :style="containerStyle" ref="vb"></div>
</template>

<script>
export default {
  props: {
    // 具体的列表的数组
    data: {
      type: Array,
      required: true,
    },
    // 虚拟块的高度
    height: {
      type: Number,
    },
    // 虚拟滚动去每一个item的高度
    flexdBlockHeight: {
      type: Number,
    },
    // 假定是window有滚动条还是虚拟滚动区有滚动条
    pageMode: {
      type: Boolean,
      required: true,
    },
  },
  created() {
    // 判断页面的模式
    if (this.pageMode) {
      window.addEventListener("scroll", this.handleScroll);
    }
  },
  mounted() {
    if (this.pageMode) {
      this.computeTransformedData(this.data);
    }
    this.updateVb(0);
  },
  destory() {
    // 组价销毁时清除之前的事件
    if (this.pageMode) {
      window.removeEventListener("scroll", this.handleScroll);
    }
  },
  methods: {
    computeTransformedData(oldArr) {
      if (
        (!this.flexdBlockHeight && this.pageMode && this.$refs.vb) ||
        !this.pageMode
      ) {
        let curHeight = this.pageMode ? this.$refs.vb.offsetTop : 0;
        // 每一次的虚拟列表的第一个的scrolTop
        let rt = [curHeight];
        oldArr.forEach((item) => {
          curHeight += item.height;
          // 每一次计算后端的scrollTop
          rt.push(curHeight);
        });
        this.transformedData = rt;
      }
    },
    /**
  	滚动检测方法
  	*/
    handleScroll() {
      // 计算高度
      const scrollTop = this.pageMode
        ? window.pageYOffset
        : this.$refs.vb.scrollTop;
      // 为了必要滚动过快需要使用动画帧
      window.reuquestAnimationFrame(() => {
        // 更新虚拟滚动区内的内容
        this.updateVb(scrollTop);
      });
    },
    findBlockHeightLowerBound(viewportBegin, flxedBlockHeight) {
      const sAdjusted = this.pageMode
        ? viewportBegin - this.$refs.scrollTop
        : viewportBegin;
      const computedStartIndex = ~~(sAdjusted / flxedBlockHeight);
      return computedStartIndex >= 0 ? computedStartIndex : 0;
    },
    binarySearchLowerBound(viewportBegin, transformedData) {
      console.log(viewportBegin, transformedData);
    },
    findBlocksInViewport(viewportBegin, viewportEnd, transformedData, data) {
      // 当视窗的开始高度小于视窗结束的高度
      if (viewportBegin < viewportEnd) {
        // 判断flxedBlockHeight是否存在
        const lo = this.flexdBlockHeight
          ? this.findBlockHeightLowerBound(viewportBegin, this.flexdBlockHeight)
          : this.binarySearchLowerBound(viewportBegin, transformedData);
      } else {
        this.offsetTop = 0;
        this.offsetBot = 0;
        // 直接返回一个空的列表
        return [];
      }
    },
    // 更新虚拟滚动区域内部的高度
    updateVb(scrollTop) {
      // 计算滚动可视区真实的高度
      const viewportHeight = this.pageMode ? window.innerHeight : this.height;
      this.viewportBegin = scrollTop;
      this.viewportEnd = scrollTop + viewportHeight;
      this.renderList = this.findBlocksInViewport(
        this.viewportBegin,
        this.viewportEnd,
        this.transformedData,
        this.data
      );
    },
  },
  data() {
    return {
      renderList: [],
      viewportEnd: this.height,
      viewportBegin: 0,
      offsetTop: 0,
      offsetBot: 0,
      transformedData: [],
    };
  },
  watch: {
    data: {
      handler: (newValue, oldValue) => {},
    },
  },
  computed: {
    containerStyle() {
      return {
        ...(!this.pageMode && { height: `${this.height}px` }),
        ...(!this.pageMode && { "overflow-y": "scroll" }),
      };
    },
  },
};
</script>