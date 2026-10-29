import { defineComponent as n, openBlock as a, createElementBlock as o, normalizeClass as l, renderSlot as d } from "vue";
const s = ["type", "disabled"], i = /* @__PURE__ */ n({
  __name: "Button",
  props: {
    type: { default: "default" },
    nativeType: { default: "button" },
    disabled: { type: Boolean, default: !1 }
  },
  setup(e) {
    return (t, u) => (a(), o("button", {
      type: e.nativeType,
      disabled: e.disabled,
      class: l(["mc-button", `mc-button--${e.type}`])
    }, [
      d(t.$slots, "default")
    ], 10, s));
  }
});
export {
  i as McButton
};
