<script setup>
defineProps({
	IAs: { type: Array, default: () => [] },
	error: { type: String, default: null },
	pagina: { type: Number, default: 1 },
	totalPaginas: { type: Number, default: 0 },
	total: { type: Number, default: 0 },
	esBusqueda: { type: Boolean, default: false },
});
</script>

<template>
	<form method="get" action="/main/">
		<input type="number" name="id" min="1" step="1" placeholder="Id de la IA" />
		<button type="submit">Consultar</button>
		<a v-if="esBusqueda" href="/main/">Ver todas</a>
	</form>

	<p v-if="error">Error al consultar Supabase: {{ error }}</p>
	<p v-else-if="IAs.length === 0">No se encontraron IAs.</p>

	<template v-else>
		<div v-for="ia in IAs" :key="ia.id">
			<img :src="ia.imagen_link" :alt="ia.nombre" width="120" />
			<p><b>Nombre:</b> {{ ia.nombre }}</p>
			<p><b>Descripción:</b> {{ ia.descripcion }}</p>
			<p><b>Arquitectura:</b> {{ ia.tipo_arquitectura }}</p>
			<p><b>Lanzamiento:</b> {{ ia.fecha_lanzamiento }}</p>
			<p>
				<b>Sitio web:</b>
				<a :href="ia.sitio_web" target="_blank" rel="noopener noreferrer">Visitar sitio</a>
			</p>
		</div>

		<nav v-if="!esBusqueda && totalPaginas > 1">
			<a v-if="pagina > 1" :href="`/main/?page=${pagina - 1}`">Anterior</a>
			<span>Página {{ pagina }} de {{ totalPaginas }}</span>
			<a v-if="pagina < totalPaginas" :href="`/main/?page=${pagina + 1}`">Siguiente</a>
		</nav>
	</template>
</template>
