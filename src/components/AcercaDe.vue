<script setup>
// Pagina "Acerca de": contenido 100 % estatico.
// Sin estado, sin eventos y sin fetch: Astro lo convierte en HTML
// durante el build y el navegador no descarga JavaScript por este componente.
</script>

<template>
	<section class="about">
		<h1>Acerca de WikIA</h1>

		<p>
			WikIA es un catalogo publico de inteligencias artificiales: cada ficha
			reune el nombre, la descripcion, la arquitectura, la fecha de lanzamiento
			y el sitio web oficial de un modelo.
		</p>

		<h2>Como esta construida</h2>
		<ul>
			<li><b>Astro</b> con arquitectura hibrida: el listado se genera en el servidor en cada request (SSR) y las paginas publicas se pre-renderizan en el build (SSG).</li>
			<li><b>Vue 3</b> para los componentes interactivos: formularios de autenticacion y administracion del catalogo.</li>
			<li><b>Supabase</b> como base de datos y autenticacion, con politicas RLS que protegen la escritura.</li>
		</ul>

		<h2>Secciones del sitio</h2>
		<ul>
			<li><a href="/main/">Listado publico</a>: consulta, busqueda y paginacion de modelos, generados en el servidor.</li>
			<li><a href="/auth/login">Administracion</a>: alta, edicion y borrado de fichas (requiere sesion).</li>
		</ul>
	</section>
</template>

<style scoped>
/* Layout only: vertical rhythm for static content. */
.about {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	line-height: 1.6;
}
.about ul {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	padding-left: 1.25rem;
	margin: 0;
}
</style>
