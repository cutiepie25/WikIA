<script setup>
defineProps({
	IAs: { type: Array, default: () => [] },
});
</script>

<template>
	<form>
		<input type="number" placeholder="Id de la IA" name="id" />
		<button>Consultar</button>
	</form>

	<p v-if="IAs.length === 0">No se encontraron IAs.</p>

	<div v-for="ia in IAs" :key="ia.id">
		<img :src="ia.imagen_link" :alt="ia.nombre" width="120" />
		<p><b>Nombre:</b> {{ ia.nombre }}</p>
		<p>{{ ia.descripcion }}</p>
	</div>
</template>
