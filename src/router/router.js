import Vue from 'vue'
import Router from 'vue-router'  // 引入vue-router


Vue.use(Router)  // 在vue中注入Router
// 配置路由路径
const routes = [
    {
        path: '*',
        name: '主页',
        component: () =>
            import( /* webpackChunkName: "page" */ `@/views/temp/bigPreview`),
    }
]
// 将路径注入到Router中
var router = new Router({
    'mode': 'history',
    routes
})
// 导出路由
export default router;
