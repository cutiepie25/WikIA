<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { supabase } from '../../lib/supabase.client'
import { useAuth } from '../../composables/useAuth'

interface Modelo {
	id: number
	nombre: string
	descripcion: string
	imagen_link: string
	fecha_lanzamiento: string | null
	tipo_arquitectura: string | null
	sitio_web: string | null
	tiene_capa_gratuita: boolean | null
}

interface Formulario {
	nombre: string
	descripcion: string
	imagen_link: string
	fecha_lanzamiento: string
	tipo_arquitectura: string
	sitio_web: string
	tiene_capa_gratuita: string
}

const Vacio: Formulario = {
	nombre: '',
	descripcion: '',
	imagen_link: '',
	fecha_lanzamiento: '',
	tipo_arquitectura: '',
	sitio_web: '',
	tiene_capa_gratuita: '',
}

const { requireSession, signOut } = useAuth()

const listo = ref(false) // no se pinta nada hasta confirmar la sesión
const modelos = ref<Modelo[]>([])
const error = ref<string | null>(null)
const editandoId = ref<number | null>(null)
const form = reactive<Formulario>({ ...Vacio })

let cancelarSuscripcion: (() => void) | null = null

onMounted(async () => {
	if (!(await requireSession())) return

	// Si la sesión se cierra (otra pestaña, token expirado) vuelve al login
	const { data } = supabase.auth.onAuthStateChange((evento) => {
		if (evento === 'SIGNED_OUT') window.location.replace('/auth/login')
	})
	cancelarSuscripcion = () => data.subscription.unsubscribe()

	listo.value = true
	await cargar()
})

onUnmounted(() => cancelarSuscripcion?.())

// READ
async function cargar() {
	const { data, error: err } = await supabase.from('modelo').select('*').order('id')
	if (err) return (error.value = err.message)
	modelos.value = data ?? []
}

function limpiar() {
	editandoId.value = null
	Object.assign(form, Vacio)
}

// CREATE / UPDATE según haya un id en edición
async function guardar() {
	error.value = null

	// Único cambio respecto a mandar { ...form }: los campos sin completar van
	// como null y no como ''. Una columna date rechaza la cadena vacía y el
	// insert fallaría antes de llegar a RLS. El select de capa gratuita devuelve
	// texto, así que se traduce a booleano (o null si quedó sin especificar).
	const payload = {
		nombre: form.nombre,
		descripcion: form.descripcion,
		imagen_link: form.imagen_link,
		fecha_lanzamiento: form.fecha_lanzamiento || null,
		tipo_arquitectura: form.tipo_arquitectura || null,
		sitio_web: form.sitio_web || null,
		tiene_capa_gratuita: form.tiene_capa_gratuita === '' ? null : form.tiene_capa_gratuita === 'true',
	}

	// .select() devuelve las filas afectadas: con RLS, un update/delete
	// bloqueado no lanza error, simplemente afecta 0 filas.
	const consulta = editandoId.value === null
		? supabase.from('modelo').insert(payload).select()
		: supabase.from('modelo').update(payload).eq('id', editandoId.value).select()

	const { data, error: err } = await consulta
	if (err) return (error.value = err.message)
	if (!data?.length) return (error.value = 'No se guardó: sin permiso (RLS) o el registro no existe.')

	limpiar()
	await cargar()
}

function editar(m: Modelo) {
	editandoId.value = m.id
	Object.assign(form, {
		nombre: m.nombre ?? '',
		descripcion: m.descripcion ?? '',
		imagen_link: m.imagen_link ?? '',
		fecha_lanzamiento: m.fecha_lanzamiento ?? '',
		tipo_arquitectura: m.tipo_arquitectura ?? '',
		sitio_web: m.sitio_web ?? '',
		tiene_capa_gratuita: m.tiene_capa_gratuita === null ? '' : String(m.tiene_capa_gratuita),
	})
}

// DELETE
async function eliminar(m: Modelo) {
	if (!confirm(`¿Eliminar "${m.nombre}"?`)) return
	error.value = null

	const { data, error: err } = await supabase.from('modelo').delete().eq('id', m.id).select()
	if (err) return (error.value = err.message)
	if (!data?.length) return (error.value = 'No se eliminó: sin permiso (RLS).')

	await cargar()
}
</script>

<template>
	<div v-if="listo">
		<header class="admin-head">
			<h1>Administración de modelos</h1>
			<button @click="signOut">Cerrar sesión</button>
		</header>

		<form class="admin-form" @submit.prevent="guardar">
			<h2>{{ editandoId === null ? 'Nuevo modelo' : `Editando #${editandoId}` }}</h2>
			<input v-model="form.nombre" placeholder="Nombre" required />
			<input v-model="form.imagen_link" type="url" placeholder="URL de la imagen" required />
			<textarea v-model="form.descripcion" placeholder="Descripción" required></textarea>
			<label>
				Fecha de lanzamiento
				<input v-model="form.fecha_lanzamiento" type="date" required />
			</label>
			<input v-model="form.tipo_arquitectura" placeholder="Tipo de arquitectura" />
			<input v-model="form.sitio_web" type="url" placeholder="Sitio web" />
			<label>
				¿Tiene capa gratuita?
				<select v-model="form.tiene_capa_gratuita">
					<option value="">Sin especificar</option>
					<option value="true">Sí</option>
					<option value="false">No</option>
				</select>
			</label>
			<button>{{ editandoId === null ? 'Crear' : 'Guardar cambios' }}</button>
			<button v-if="editandoId !== null" type="button" @click="limpiar">Cancelar</button>
		</form>

		<p v-if="error" role="alert">{{ error }}</p>

		<p v-if="modelos.length === 0">No hay modelos todavía.</p>

		<ul class="model-list">
			<li v-for="m in modelos" :key="m.id" class="model-row">
				<img class="model-thumb" :src="m.imagen_link" :alt="m.nombre" />
				<div class="model-body">
					<div><b>#{{ m.id }} {{ m.nombre }}</b> — {{ m.descripcion }}</div>
					<div class="model-meta">
						<small v-if="m.fecha_lanzamiento"> · Lanzamiento: {{ m.fecha_lanzamiento }}</small>
						<small v-if="m.tipo_arquitectura"> · {{ m.tipo_arquitectura }}</small>
						<small v-if="m.sitio_web"> · <a :href="m.sitio_web" target="_blank" rel="noopener">sitio</a></small>
						<small v-if="m.tiene_capa_gratuita !== null"> · Capa gratuita: {{ m.tiene_capa_gratuita ? 'sí' : 'no' }}</small>
					</div>
				</div>
				<div class="model-actions">
					<button @click="editar(m)">Editar</button>
					<button @click="eliminar(m)">Eliminar</button>
				</div>
			</li>
		</ul>
	</div>
</template>

<style scoped>
/* layout only */
.admin-head {
	display: flex;
	justify-content: space-between;
	align-items: center;
	flex-wrap: wrap;
	gap: 1rem;
}
.admin-form {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}
.admin-form label {
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
}
.admin-form input,
.admin-form textarea,
.admin-form select {
	width: 100%;
}
.model-list {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin: 0;
	padding: 0;
}
.model-row {
	display: flex;
	gap: 1rem;
	align-items: flex-start;
}
.model-thumb {
	width: 60px;
	height: 60px;
	object-fit: cover;
	flex-shrink: 0;
}
.model-body {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
}
.model-meta {
	display: flex;
	flex-wrap: wrap;
	gap: 0.25rem 0.75rem;
}
.model-actions {
	display: flex;
	gap: 0.5rem;
	flex-shrink: 0;
}
@media (max-width: 600px) {
	.model-row {
		flex-wrap: wrap;
	}
	.model-actions {
		width: 100%;
	}
}
</style>
