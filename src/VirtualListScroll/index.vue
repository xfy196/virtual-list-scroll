<template>
  <div v-on="pageMode ? {} : {scroll: handleScroll}" :style="containerStyle" ref="vb">
    <div :style="{height: `${offsetTop}px`}"></div>
    <div
      :style="{height: `${flxedBlockHeight? flxedBlockHeight: item.height}px`}"
      v-for="item in renderList"
      :key="item.id"
    >
      <slot :data="item"></slot>
    </div>
    <div :style="{height: `${offsetBot}px`}"></div>
  </div>
</template>

<script>
export default {
  props: {
    // 具体的列表的数组
    data: {
      type: Array,
      required: true
    },
    // 虚拟块的高度
    height: {
      type: Number
    },
    // 虚拟滚动去每一个item的高度
    flxedBlockHeight: {
      type: Number
    },
    // 假定是window有滚动条还是虚拟滚动区有滚动条
    pageMode: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return {
      renderList: [],
      viewportEnd: this.height,
      viewportBegin: 0,
      offsetTop: 0,
      offsetBot: 0,
      transformedData: []
    };
  },
  watch: {
    data: {
      handler: function(newValue, oldValue) {
        this.computeTransformedData(newValue)
        // 如果存在旧值
        if (oldValue) {
          this.$nextTick(() => {
            this.$refs.vb.scrollTop = 0;
            this.handleScroll();
          });
        }
      },
      immediate: true
    },
    pageMode(newValue) {
      if (newValue) {
        window.addEventListener("scroll", this.handleScroll);
      } else {
        // 如果不存在新的之变化直接清楚这个scorll的滚动监听
        window.removeEventListener("scroll", this.handleScroll);
      }
      // 值发生变化直接需要重新计算
      this.computeTransformedData(this.data);
      this.$nextTick(() => {
        this.$refs.vb.scrollTop = 0;
        this.handleScroll();
      });
    },
    flxedBlockHeight() {
      //重新调用滚动事件的方法
      this.handleScroll();
    }
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
  destroyed() {
    // 组价销毁时清除之前的事件
    if (this.pageMode) {
      window.removeEventListener("scroll", this.handleScroll);
    }
  },
  methods: {
    computeTransformedData(oldArr) {
      if (
        (!this.flxedBlockHeight && this.pageMode && this.$refs.vb) ||
        !this.pageMode
      ) {
        let curHeight = this.pageMode ? this.$refs.vb.offsetTop : 0;
        // 每一次的虚拟列表的第一个的scrolTop
        let rt = [curHeight];
        oldArr.forEach(item => {
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
      window.requestAnimationFrame(() => {
        // 更新虚拟滚动区内的内容
        this.updateVb(scrollTop);
      });
    },
    /**
     * 存在指定的盒子高度寻找开始的下表
     */
    findBlockHeightLowerBound(viewportBegin, flxedBlockHeight) {
      const sAdjusted = this.pageMode
        ? viewportBegin - this.$refs.scrollTop
        : viewportBegin;
      const computedStartIndex = ~~(sAdjusted / flxedBlockHeight);
      return computedStartIndex >= 0 ? computedStartIndex : 0;
    },
    /**
     * 不存在盒子指定的高度二分法寻找开始的下表
     */
    binarySearchLowerBound(viewportBegin, transformedData) {
      let lo = 0;
      // 最后一个高度的前一个其实就代表最后一个的头部位置
      let hi = transformedData.length - 1;
      let mid;
      while (lo <= hi) {
        // 向下取整
        mid = ~~((lo + hi) / 2);
        // 判断这个中间位置的高度是否大于当前开始的高度
        if (transformedData[mid] > viewportBegin) {
          // 如果中间值为0说明就是开始位置
          if (mid === 0) {
            return 0;
          } else {
            hi = mid - 1;
          }
        } else if (transformedData[mid] < viewportBegin) {
          // 如果当前中间的高度 小于 当前开始的高度
          if (mid + 1 < transformedData.length) {
            if (transformedData[mid + 1] > viewportBegin) {
              return mid;
            } else {
              lo = mid + 1;
            }
          } else {
            return -1;
          }
        } else {
          return mid;
        }
      }
    },
    findBlockHeightUpperBound(viewportEnd, flxedBlockHeight) {
      const eAdjusted = this.pageMode
        ? viewportEnd - this.$refs.vb.scrollTop
        : viewportEnd;
      // 末尾的开始下标
      const computedStartIndex = ~~(eAdjusted / flxedBlockHeight);
      // 判断一下大于0就是正常返回否则就是返回0
      return computedStartIndex <= this.data.length
        ? computedStartIndex
        : this.data.length;
    },
    /**
     * 找到后面的的开始下标，但是不能有固定的高度
     */
    binarySearchUpperBound(viewportEnd, transformedData) {
      let lo = 0;
      let hi = transformedData.length - 1;
      let mid;
      // 二分法查找，找到末尾的下标
      while (lo <= hi) {
        mid = ~~((lo + hi) / 2);
        if (transformedData[mid] > viewportEnd) {
          if (mid > 0) {
            if (transformedData[mid - 1] < viewportEnd) {
              return mid;
            } else {
              hi = mid - 1;
            }
          } else {
            return -1;
          }
        } else if (transformedData[mid] < viewportEnd) {
          // 如果中间下标等于数组的长度减一
          if (mid === transformedData.length - 1) {
            return mid;
          } else {
            // 如果不等于数组长度那么我们需要加1
            lo = mid + 1;
          }
        } else {
          return mid;
        }
      }
    },

    findBlocksInViewport(viewportBegin, viewportEnd, transformedData, data) {
      // 当视窗的开始高度小于视窗结束的高度
      if (viewportBegin < viewportEnd) {
        // 判断flxedBlockHeight是否存在
        // 开始下标
        const lo = this.flxedBlockHeight
          ? this.findBlockHeightLowerBound(viewportBegin, this.flxedBlockHeight)
          : this.binarySearchLowerBound(viewportBegin, transformedData);
        // 结束下标
        const hi = this.flxedBlockHeight
          ? this.findBlockHeightUpperBound(viewportEnd, this.flxedBlockHeight)
          : this.binarySearchUpperBound(viewportEnd, transformedData);
        // 计算虚拟偏移量
        let vbOffset = this.pageMode ? this.$refs.vb.offsetTop : 0;
        // 判断是否存在固定的item的高度
        if (this.flxedBlockHeight) {
          this.offsetTop = lo >= 0 ? lo * this.flxedBlockHeight : 0;
          this.offsetBot =
            hi >= 0
              ? (data.length - hi) * this.flxedBlockHeight : 0
        } else {
          this.offsetTop = lo >= 0 ? transformedData[lo] - vbOffset : 0;
          this.offsetBot =
            hi >= 0
              ? transformedData[transformedData.length - 1] -
                transformedData[hi]
              : 0;
        }
        return data.slice(lo, hi);
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
    }
  },

  computed: {
    containerStyle() {
      return {
        ...(!this.pageMode && { height: `${this.height}px` }),
        ...(!this.pageMode && { "overflow-y": "auto" })
      };
    }
  }
};
</script>