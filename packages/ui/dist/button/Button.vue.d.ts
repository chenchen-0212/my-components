declare const _default: __VLS_WithTemplateSlots<import('vue').DefineComponent<import('vue').ExtractPropTypes<__VLS_WithDefaults<__VLS_TypePropsToRuntimeProps<{
    /** 视觉类型 */
    type?: "default" | "primary" | undefined;
    /** 原生 button 的 type，避免与视觉类型 type 重名导致无法提交表单 */
    nativeType?: "reset" | "submit" | "button" | undefined;
    disabled?: boolean | undefined;
}>, {
    type: string;
    nativeType: string;
    disabled: boolean;
}>>, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<__VLS_WithDefaults<__VLS_TypePropsToRuntimeProps<{
    /** 视觉类型 */
    type?: "default" | "primary" | undefined;
    /** 原生 button 的 type，避免与视觉类型 type 重名导致无法提交表单 */
    nativeType?: "reset" | "submit" | "button" | undefined;
    disabled?: boolean | undefined;
}>, {
    type: string;
    nativeType: string;
    disabled: boolean;
}>>> & Readonly<{}>, {
    type: "default" | "primary";
    nativeType: "reset" | "submit" | "button";
    disabled: boolean;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, true, {}, any>, {
    default?(_: {}): any;
}>;
export default _default;
type __VLS_NonUndefinedable<T> = T extends undefined ? never : T;
type __VLS_TypePropsToRuntimeProps<T> = {
    [K in keyof T]-?: {} extends Pick<T, K> ? {
        type: import('vue').PropType<__VLS_NonUndefinedable<T[K]>>;
    } : {
        type: import('vue').PropType<T[K]>;
        required: true;
    };
};
type __VLS_WithDefaults<P, D> = {
    [K in keyof Pick<P, keyof P>]: K extends keyof D ? __VLS_Prettify<P[K] & {
        default: D[K];
    }> : P[K];
};
type __VLS_Prettify<T> = {
    [K in keyof T]: T[K];
} & {};
type __VLS_WithTemplateSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
