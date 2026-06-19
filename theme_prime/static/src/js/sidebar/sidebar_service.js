import { Component, markRaw, reactive, useChildSubEnv, xml } from "@odoo/owl";
import { registry } from "@web/core/registry";

class SidebarWrapper extends Component {
    static template = xml`<t t-component="props.subComponent" t-props="props.subProps" />`;
    static props = ["*"];
    setup() {
        useChildSubEnv({ sidebarData: this.props.subEnv });
    }
}

export const sidebarService = {
    dependencies: ["overlay"],
    start(env, { overlay }) {
        const stack = [];
        let nextId = 0;

        const deactivate = () => {
            for (const subEnv of stack) {
                subEnv.isActive = false;
            }
        };

        const add = (sidebarClass, props, options = {}) => {
            const id = nextId++;
            const close = (params) => remove(params);
            const subEnv = reactive({
                id,
                close,
                isActive: true,
            });

            deactivate();
            stack.push(subEnv);

            const remove = overlay.add(
                SidebarWrapper,
                {
                    subComponent: sidebarClass,
                    subProps: markRaw({ ...props, close }),
                    subEnv,
                },
                {
                    onRemove: async (closeParams) => {
                        await options.onClose?.(closeParams);
                        stack.splice(
                            stack.findIndex((d) => d.id === id),
                            1
                        );
                        deactivate();
                        if (stack.length) {
                            stack.at(-1).isActive = true;
                        }
                    },
                }
            );

            return remove;
        };

        function closeAll(params) {
            for (const sidebar of [...stack].reverse()) {
                sidebar.close(params);
            }
        }

        return { add, closeAll };
    },
};

registry.category("services").add("primeSidebar", sidebarService);
