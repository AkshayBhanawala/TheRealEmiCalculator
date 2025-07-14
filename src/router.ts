import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';

import EmiCalculator from './views/EmiCalculator.vue';
import TestPage from './views/TestPage.vue';

const routes: RouteRecordRaw[] = [
	{ path: '/', component: EmiCalculator },
	{ path: '/test', component: TestPage },
	{ path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
	history: createWebHashHistory(),
	routes,
});

export default router;
