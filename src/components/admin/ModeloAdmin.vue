<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../composables/useAuth'

interface Modelo {
	id: number
	nombre: string
	descripcion: string
	imagen_link: string
}

const { requireSession, signOut } = useAuth()

const listo = ref(false) // no se pinta nada hasta confirmar la sesión
const modelos = ref<Modelo[]>([])
const error = ref<string | null>(null)
const editandoId = ref<number | null>(null)
const form = reactive({ nombre: '', descripcion: '', imagen_link: '' })

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
	Object.assign(form, { nombre: '', descripcion: '', imagen_link: '' })
}

// CREATE / UPDATE según haya un id en edición
async function guardar() {
	error.value = null

	// .select() devuelve las filas afectadas: con RLS, un update/delete
	// bloqueado no lanza error, simplemente afecta 0 filas.
	const consulta = editandoId.value === null
		? supabase.from('modelo').insert({ ...form }).select()
		: supabase.from('modelo').update({ ...form }).eq('id', editandoId.value).select()

	const { data, error: err } = await consulta
	if (err) return (error.value = err.message)
	if (!data?.length) return (error.value = 'No se guardó: sin permiso (RLS) o el registro no existe.')

	limpiar()
	await cargar()
}

function editar(m: Modelo) {
	editandoId.value = m.id
	Object.assign(form, { nombre: m.nombre, descripcion: m.descripcion, imagen_link: m.imagen_link })
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
		<header>
			<h1>Administración de modelos</h1>
			<button @click="signOut">Cerrar sesión</button>
		</header>

		<form @submit.prevent="guardar">
			<h2>{{ editandoId === null ? 'Nuevo modelo' : `Editando #${editandoId}` }}</h2>
			<input v-model="form.nombre" placeholder="Nombre" required />
			<input v-model="form.imagen_link" type="url" placeholder="URL de la imagen" required />
			<textarea v-model="form.descripcion" placeholder="Descripción" required></textarea>
			<button>{{ editandoId === null ? 'Crear' : 'Guardar cambios' }}</button>
			<button v-if="editandoId !== null" type="button" @click="limpiar">Cancelar</button>
		</form>

		<p v-if="error" role="alert">{{ error }}</p>

		<p v-if="modelos.length === 0">No hay modelos todavía.</p>

		<ul>
			<li v-for="m in modelos" :key="m.id">
				<img :src="m.imagen_link" :alt="m.nombre" width="60" />
				<b>#{{ m.id }} {{ m.nombre }}</b> — {{ m.descripcion }}
				<button @click="editar(m)">Editar</button>
				<button @click="eliminar(m)">Eliminar</button>
			</li>
		</ul>
	</div>
</template>
