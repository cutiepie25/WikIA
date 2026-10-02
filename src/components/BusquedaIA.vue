<script setup>
const props = defineProps({
	IAs: { type: Array, default: () => [] },
	error: { type: String, default: null },
	id: { type: String, default: '' },
	q: { type: String, default: '' },
	pagina: { type: Number, default: 1 },
	totalPaginas: { type: Number, default: 0 },
	total: { type: Number, default: 0 },
	esBusqueda: { type: Boolean, default: false },
	esBusquedaId: { type: Boolean, default: false },
	esBusquedaNombre: { type: Boolean, default: false },
});

// La paginacion tiene que arrastrar el termino de busqueda, si no al pasar de
// pagina se pierde la query y vuelve al listado completo.
const paginaHref = (n) =>
	props.esBusquedaNombre
		? `/main/?q=${encodeURIComponent(props.q)}&page=${n}`
		: `/main/?page=${n}`;
</script>

<template>
	<!-- Layout only: forms grouped in a panel, listing in results. -->
	<section class="search-panel">
		<!-- Dos forms separados a proposito: en un solo form, cada boton mandaria
		     los dos campos y el servidor recibiria id y q juntos. -->
		<form class="search-form" method="get" action="/main/">
			<label for="buscar-id">Buscar por ID:</label>
			<input
				id="buscar-id"
				type="number"
				name="id"
				min="1"
				step="1"
				:value="id"
				placeholder="Ej: 3"
				autocomplete="off"
			/>
			<button type="submit">Consultar</button>
		</form>

		<form class="search-form" method="get" action="/main/">
			<label for="buscar-nombre">Buscar por nombre:</label>
			<input
				id="buscar-nombre"
				type="search"
				name="q"
				:value="q"
				placeholder="Ej: llama, gpt, claude"
				autocomplete="off"
			/>
			<button type="submit">Buscar</button>
		</form>
	</section>

	<section class="results">
		<a v-if="esBusqueda" href="/main/">Ver todas</a>

		<p v-if="error">Error al consultar Supabase: {{ error }}</p>
		<p v-else-if="esBusquedaId && IAs.length === 0">
			No se encontró ninguna IA con id {{ id }}.
		</p>
		<p v-else-if="esBusquedaNombre && IAs.length === 0">
			No se encontraron IAs para "{{ q }}".
		</p>
		<p v-else-if="IAs.length === 0">No se encontraron IAs.</p>

		<template v-else>
			<p v-if="esBusquedaNombre">
				{{ total }} resultado{{ total === 1 ? '' : 's' }} para "{{ q }}".
			</p>

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

			<nav v-if="totalPaginas > 1">
				<a v-if="pagina > 1" :href="paginaHref(pagina - 1)">Anterior</a>
				<span>Página {{ pagina }} de {{ totalPaginas }}</span>
				<a v-if="pagina < totalPaginas" :href="paginaHref(pagina + 1)">Siguiente</a>
			</nav>
		</template>
	</section>
</template>

<style scoped>
/* Layout only: stacking and wrapping, no decoration. */
.search-panel {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}
.search-form {
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
	align-items: end;
}
.search-form label {
	width: 100%;
}
.results {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}
</style>