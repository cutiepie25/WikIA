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
	id_compania: number | null
	id_licencia: number | null
}

interface Formulario {
	nombre: string
	descripcion: string
	imagen_link: string
	fecha_lanzamiento: string
	tipo_arquitectura: string
	sitio_web: string
	tiene_capa_gratuita: string
	id_compania: string
	id_licencia: string
}

// Filas de los catÃ¡logos: solo id + nombre, que es lo que se necesita para pintar el desplegable
interface Catalogo {
	id: number
	nombre: string
}

const Vacio: Formulario = {
	nombre: '',
	descripcion: '',
	imagen_link: '',
	fecha_lanzamiento: '',
	tipo_arquitectura: '',
	sitio_web: '',
	tiene_capa_gratuita: '',
	id_compania: '',
	id_licencia: '',
}

const { requireSession, signOut } = useAuth()

const listo = ref(false) // no se pinta nada hasta confirmar la sesiÃ³n
const modelos = ref<Modelo[]>([])
const companias = ref<Catalogo[]>([])
const licencias = ref<Catalogo[]>([])
const error = ref<string | null>(null)
const editandoId = ref<number | null>(null)
const form = reactive<Formulario>({ ...Vacio })

let cancelarSuscripcion: (() => void) | null = null

onMounted(async () => {
	if (!(await requireSession())) return

	// Si la sesiÃ³n se cierra (otra pestaÃ±a, token expirado) vuelve al login
	const { data } = supabase.auth.onAuthStateChange((evento) => {
		if (evento === 'SIGNED_OUT') window.location.replace('/auth/login')
	})
	cancelarSuscripcion = () => data.subscription.unsubscribe()

	listo.value = true
	await Promise.all([cargar(), cargarCatalogos()])
})

onUnmounted(() => cancelarSuscripcion?.())

// READ
async function cargar() {
	const { data, error: err } = await supabase.from('modelo').select('*').order('id')
	if (err) return (error.value = err.message)
	modelos.value = data ?? []
}

// READ de los catÃ¡logos que alimentan los desplegables.
// El componente es client:only, asÃ­ que no hay forma de pasarlos desde el servidor.
async function cargarCatalogos() {
	const [compania, licencia] = await Promise.all([
		supabase.from('compania').select('id, nombre').order('nombre'),
		supabase.from('licencia').select('id, nombre').order('nombre'),
	])
	if (compania.error) return (error.value = compania.error.message)
	if (licencia.error) return (error.value = licencia.error.message)
	companias.value = compania.data ?? []
	licencias.value = licencia.data ?? []
}

// Traduce el id guardado al nombre del catÃ¡logo. Si el catÃ¡logo aÃºn no cargÃ³, cae al id.
function nombreDe(catalogo: Catalogo[], id: number | null): string {
	return catalogo.find((c) => c.id === id)?.nombre ?? `#${id}`
}

function limpiar() {
	editandoId.value = null
	Object.assign(form, Vacio)
}

// CREATE / UPDATE segÃºn haya un id en ediciÃ³n
async function guardar() {
	error.value = null

	const payload = {
		nombre: form.nombre,
		descripcion: form.descripcion,
		imagen_link: form.imagen_link,
		fecha_lanzamiento: form.fecha_lanzamiento || null,
		tipo_arquitectura: form.tipo_arquitectura || null,
		sitio_web: form.sitio_web || null,
		tiene_capa_gratuita: form.tiene_capa_gratuita === '' ? null : form.tiene_capa_gratuita === 'true',
		// Los desplegables devuelven string ('' cuando no hay selecciÃ³n): se castea a integer o null
		id_compania: form.id_compania === '' ? null : Number(form.id_compania),
		id_licencia: form.id_licencia === '' ? null : Number(form.id_licencia),
	}

	const consulta = editandoId.value === null
		? supabase.from('modelo').insert(payload).select()
		: supabase.from('modelo').update(payload).eq('id', editandoId.value).select()

	const { data, error: err } = await consulta
	if (err) return (error.value = err.message)
	if (!data?.length) return (error.value = 'No se guardÃ³: sin permiso (RLS) o el registro no existe.')

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
		id_compania: m.id_compania === null ? '' : String(m.id_compania),
		id_licencia: m.id_licencia === null ? '' : String(m.id_licencia),
	})
}

// DELETE
async function eliminar(m: Modelo) {
	if (!confirm(`Â¿Eliminar "${m.nombre}"?`)) return
	error.value = null

	const { data, error: err } = await supabase.from('modelo').delete().eq('id', m.id).select()
	if (err) return (error.value = err.message)
	if (!data?.length) return (error.value = 'No se eliminÃ³: sin permiso (RLS).')

	await cargar()
}
</script>

<template>
	<div v-if="listo">
		<header class="admin-head">
			<h1>AdministraciÃ³n de modelos</h1>
			<button @click="signOut">Cerrar sesiÃ³n</button>
		</header>

		<form class="admin-form" @submit.prevent="guardar">
			<h2>{{ editandoId === null ? 'Nuevo modelo' : `Editando #${editandoId}` }}</h2>
			<input v-model="form.nombre" placeholder="Nombre" required />
			<input v-model="form.imagen_link" type="url" placeholder="URL de la imagen" required />
			<textarea v-model="form.descripcion" placeholder="DescripciÃ³n" required></textarea>
			<label>
				Fecha de lanzamiento
				<input v-model="form.fecha_lanzamiento" type="date" required />
			</label>
			<input v-model="form.tipo_arquitectura" placeholder="Tipo de arquitectura" />
			<input v-model="form.sitio_web" type="url" placeholder="Sitio web" />
			<label>
				Â¿Tiene capa gratuita?
				<select v-model="form.tiene_capa_gratuita">
					<option value="">Sin especificar</option>
					<option value="true">SÃ­</option>
					<option value="false">No</option>
				</select>
			</label>
			<label>
				CompaÃ±Ã­a
				<select v-model="form.id_compania">
					<option value="">Sin especificar</option>
					<option v-for="c in companias" :key="c.id" :value="String(c.id)">{{ c.nombre }}</option>
				</select>
			</label>
			<label>
				Licencia
				<select v-model="form.id_licencia">
					<option value="">Sin especificar</option>
					<option v-for="l in licencias" :key="l.id" :value="String(l.id)">{{ l.nombre }}</option>
				</select>
			</label>
			<button>{{ editandoId === null ? 'Crear' : 'Guardar cambios' }}</button>
			<button v-if="editandoId !== null" type="button" @click="limpiar">Cancelar</button>
		</form>

		<p v-if="error" role="alert">{{ error }}</p>

		<p v-if="modelos.length === 0">No hay modelos todavÃ­a.</p>

	<ul class="model-list">
			<li v-for="m in modelos" :key="m.id" class="model-row">
				<img class="model-thumb" :src="m.imagen_link" :alt="m.nombre" />
				<div class="model-body">
					<div><b>#{{ m.id }} {{ m.nombre }}</b> â€” {{ m.descripcion }}</div>
					<div class="model-meta">
						<small v-if="m.fecha_lanzamiento"> Â· Lanzamiento: {{ m.fecha_lanzamiento }}</small>
						<small v-if="m.tipo_arquitectura"> Â· {{ m.tipo_arquitectura }}</small>
						<small v-if="m.sitio_web"> Â· <a :href="m.sitio_web" target="_blank" rel="noopener">sitio</a></small>
						<small v-if="m.tiene_capa_gratuita !== null"> Â· Capa gratuita: {{ m.tiene_capa_gratuita ? 'sÃ­' : 'no' }}</small>
						<small v-if="m.id_compania !== null"> Â· CompaÃ±Ã­a: {{ nombreDe(companias, m.id_compania) }}</small>
						<small v-if="m.id_licencia !== null"> Â· Licencia: {{ nombreDe(licencias, m.id_licencia) }}</small>
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
