<template>
	<RouterView />
</template>

<script setup lang="ts">
</script>

<style scoped>
:root {
	--primary-color: rgba(52, 152, 219, 0.8);
	--secondary-color: rgba(44, 62, 80, 0.8);
	--background-color: rgba(255, 255, 255, 0.2);
	--card-background: rgba(255, 255, 255, 0.1);
	--text-color: #ecf0f1;
}

body {
	background-color: var(--background-color);
	color: var(--text-color);
	line-height: 1.6;
	backdrop-filter: blur(40px);
}

#app {
	max-width: 1000px;
	margin: 0 auto;
	padding: 20px;
}
</style>
